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
const fs = require('fs');

const REPO = path.join(__dirname, '..');
const msg = process.argv.slice(2).join(' ').trim();

// ── 同時実行対策（定期タスクのバッティング防止）─────────────────────────
// この new-article-draft は日次、他の price-check / seo-competitor-scan /
// technical-seo-audit 等は Mon/Wed/Fri 等の朝に発火するため、deploy.cjs が
// 同時に複数走ると (1) .git/index.lock 衝突 (2) main への多重 push →
// Vercel の多重デプロイで最新コミットが未反映、という事故が起きる。
// そこでリポジトリ単位の排他ロックで deploy を直列化し、古い index.lock も
// 自動で待機/回収する。
const LOCK = path.join(REPO, '.deploy.lock');
const GIT_INDEX_LOCK = path.join(REPO, '.git', 'index.lock');
const GIT_HEAD_LOCK = path.join(REPO, '.git', 'HEAD.lock');
const GIT_REF_LOCK = path.join(REPO, '.git', 'refs', 'heads', 'main.lock');
// commit は index.lock だけでなく HEAD.lock / refs/heads/main.lock も掴む。
// 残骸が残ると `fatal: cannot lock ref 'HEAD'` で commit が中断するため全て回収対象にする。
const GIT_LOCKS = [GIT_INDEX_LOCK, GIT_HEAD_LOCK, GIT_REF_LOCK];
const LOCK_STALE_MS = 15 * 60 * 1000; // これより古い .deploy.lock は死んだプロセスとみなし回収
const LOCK_WAIT_MS = 20 * 60 * 1000; // 別 deploy の完了をこの時間まで待つ
const IDX_STALE_MS = 2 * 60 * 1000; // これより古い index.lock は stale とみなし除去
const IDX_WAIT_MS = 3 * 60 * 1000; // index.lock 解放をこの時間まで待つ
const POLL_MS = 5000;

let lockHeld = false;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireLock() {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      const fd = fs.openSync(LOCK, 'wx'); // 既存なら EEXIST（アトミック作成）
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
      fs.closeSync(fd);
      lockHeld = true;
      return;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let info = {};
      try { info = JSON.parse(fs.readFileSync(LOCK, 'utf8')); } catch {}
      const age = Date.now() - (info.at ? Date.parse(info.at) : 0);
      if (!Number.isFinite(age) || age > LOCK_STALE_MS) {
        console.warn(`⚠ 古い .deploy.lock (pid=${info.pid || '?'}, ${Math.round((age || 0) / 1000)}s) を回収します`);
        try { fs.unlinkSync(LOCK); } catch {}
        continue;
      }
      if (Date.now() > deadline) {
        abort(`別のデプロイが進行中(pid=${info.pid})で待機タイムアウトに達しました。少し後に再実行してください。`);
      }
      console.log(`… 別のデプロイ進行中 (pid=${info.pid})。${POLL_MS / 1000}s 待って再試行します`);
      sleepSync(POLL_MS);
    }
  }
}

function releaseLock() {
  if (!lockHeld) return;
  try { fs.unlinkSync(LOCK); } catch {}
  lockHeld = false;
}

// abort()（process.exit）・正常終了・Ctrl-C 等いずれの経路でもロックを解放する
process.on('exit', releaseLock);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { releaseLock(); process.exit(1); });
}

// 別の git 処理が残した各種ロック（index.lock / HEAD.lock / refs/heads/main.lock）を
// 待機し、stale なら除去する。残骸で commit が fatal 落ちするのを防ぐ。
function waitGitIndexLock() {
  for (const lockPath of GIT_LOCKS) {
    const name = path.relative(REPO, lockPath).replace(/\\/g, '/');
    const deadline = Date.now() + IDX_WAIT_MS;
    while (fs.existsSync(lockPath)) {
      let age = Infinity;
      try { age = Date.now() - fs.statSync(lockPath).mtimeMs; } catch { break; }
      if (age > IDX_STALE_MS) {
        console.warn(`⚠ 古い ${name} (${Math.round(age / 1000)}s) を除去します`);
        try { fs.unlinkSync(lockPath); } catch {}
        break;
      }
      if (Date.now() > deadline) {
        abort(`${name} が解放されません。別の git 処理を確認してください。`);
      }
      console.log(`… 別の git 処理が進行中。${name} の解放を待機します…`);
      sleepSync(3000);
    }
  }
}

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

// 0. 排他ロック取得（他の deploy が走っていれば直列化のため待機）
console.log('■ 0. 排他ロック取得 (.deploy.lock)');
acquireLock();

// 1. 変更確認 + 危険ファイル検出
console.log('\n■ 1. 変更確認 (git status)');
waitGitIndexLock();
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
console.log('\n■ 3. git add（content/posts _file docs pages components styles scripts lib types + ルート直下 CLAUDE.md .gitignore next.config.ts）');
waitGitIndexLock();
// サブディレクトリに加え、日次運用で更新し得るルート直下ファイルも明示的に含める。
// （旧: サブディレクトリのみ→CLAUDE.md/.gitignore/next.config.ts 更新が毎回サイレントに取りこぼされていた）
// next.config.ts はカニバリ整理時の恒久リダイレクト追記で触る。
// .env/node_modules は下の hasDangerousPath と .gitignore で二重に防止。
run('git add content/posts _file docs pages components styles scripts lib types CLAUDE.md .gitignore next.config.ts');

// 3.5 ステージ内容の最終安全確認
const staged = cap('git diff --cached --name-only');
console.log(staged || '(ステージ空)');
if (!staged) abort('ステージに何もありません。');
if (hasDangerousPath(staged)) {
  abort('ステージに .env / node_modules が含まれています。コミットを中止しました。');
}

// 4. commit
console.log('\n■ 4. commit');
waitGitIndexLock();
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
