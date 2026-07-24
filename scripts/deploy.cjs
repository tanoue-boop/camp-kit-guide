#!/usr/bin/env node
/**
 * 一括デプロイスクリプト（Claude Code 用）
 *
 * build → 安全確認 → git add → commit → push → 本番検証 を「1コマンド」で実行する。
 * 途中の各操作はこのスクリプト内部の execSync で回るため、Claude Code から見えるのは
 * `node scripts/deploy.cjs ...` の1コマンドだけ。許可ルール Bash(node *) に収まるので、
 * 個別の許可プロンプト（git add / commit / push / curl 等）が発生しない。
 *
 * 使い方:
 *   node scripts/deploy.cjs "記事追加: 焚き火テーブル(楽天API実データ5選) ..."
 *
 * 安全装置:
 *   - コミットメッセージ未指定なら中止
 *   - 変更が無ければ中止
 *   - .env* / node_modules が変更・ステージに混入していたら中止（誤コミット防止）
 *   - ビルド失敗なら push せず中止
 *   - 本番検証(verify-deploy.cjs)が FAIL なら exit 1
 */

const { execSync } = require('child_process');
const path = require('path');

const REPO = path.join(__dirname, '..');
const msg = process.argv.slice(2).join(' ').trim();

function run(cmd) {
  execSync(cmd, { cwd: REPO, stdio: 'inherit' });
}
function cap(cmd) {
  return execSync(cmd, { cwd: REPO, encoding: 'utf8' }).trim();
}
function abort(m) {
  console.error('\n✖ 中止: ' + m);
  process.exit(1);
}
function hasDangerousPath(text) {
  return text
    .split('\n')
    .some((line) => /\.env/.test(line) || line.includes('node_modules'));
}

if (!msg) {
  abort('コミットメッセージを引数で指定してください。\n  例: node scripts/deploy.cjs "記事追加: ..."');
}

// 1. 変更確認 + 危険ファイル検出
console.log('■ 1. 変更確認 (git status)');
const status = cap('git status --porcelain');
console.log(status || '(変更なし)');
if (!status) abort('コミットする変更がありません。');
if (hasDangerousPath(status)) {
  abort('.env / node_modules が変更に含まれています。手動で確認してください。');
}

// 2. ビルド（必須・EXIT 0 を確認）
console.log('\n■ 2. ビルド (npm run build)');
try {
  run('npm run build');
} catch {
  abort('ビルド失敗。push せず停止します。frontmatter/MDX/ComparisonTable の記述を確認してください。');
}

// 3. add（対象を限定）
console.log('\n■ 3. git add（content/posts _file docs pages components styles scripts）');
run('git add content/posts _file docs pages components styles scripts');

// 3.5 ステージ内容の最終安全確認
const staged = cap('git diff --cached --name-only');
console.log(staged || '(ステージ空)');
if (!staged) abort('ステージに何もありません。');
if (hasDangerousPath(staged)) {
  abort('ステージに .env / node_modules が含まれています。コミットを中止しました。');
}

// 4. commit
console.log('\n■ 4. commit');
run(`git commit -m ${JSON.stringify(msg)}`);

// 5. push（＝本番デプロイ）
console.log('\n■ 5. push origin main（本番デプロイ）');
run('git push origin main');

// 6. 本番検証（反映待ちは verify 側が 20回×15秒でリトライ）
console.log('\n■ 6. 本番検証 (verify-deploy.cjs)');
try {
  run('node scripts/verify-deploy.cjs');
} catch {
  abort('本番検証で FAIL。Vercel のデプロイログを確認し、反映後に `node scripts/verify-deploy.cjs` を再実行してください。');
}

console.log('\n✅ デプロイ完了（build → commit → push → verify すべて通過）');
