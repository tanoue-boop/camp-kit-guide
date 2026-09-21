#!/usr/bin/env node
/**
 * validate-backlog-tsv.cjs — 台帳 TSV の構造検査（列数・ヘッダ名・値ドメイン・行数）
 *
 * 経緯（campkit-20260921-30 作業A）:
 *   29 で `_file/article-fix-backlog.tsv` の 8 行を手編集した際に issue_type と detail の間のタブが落ち、
 *   その行だけ 9 列に潰れた（issue_type に detail が連結され、以降の列が 1 つずつ前にずれ、notes が消失）。
 *   ビルドには影響しないので誰も気づかず本番へ push された。**台帳 TSV を書き換えたら必ずこれを通す**。
 *
 * 使い方:
 *   node scripts/validate-backlog-tsv.cjs                       # 登録済みの台帳を全部検査（1 つでも NG なら exit 1）
 *   node scripts/validate-backlog-tsv.cjs _file/article-fix-backlog.tsv   # 指定ファイルだけ（登録済みならその仕様で、未登録なら列数の一致だけ）
 *   node scripts/validate-backlog-tsv.cjs --expect-rows 401     # 行数（ヘッダ除く）の期待値も検査（1 ファイル指定時）
 *
 * 検査項目（共通）: BOM 無し／CR 無し／末尾が改行 1 つ／途中に空行なし／全データ行の列数がヘッダと同じ／ヘッダ名が仕様どおり
 * 検査項目（article-fix-backlog.tsv）: status・priority・issue_type の値ドメイン／target_slug の書式／added_date が YYYY-MM-DD／
 *   rakuten_url が空か http(s)／issue_type に長文が混ざっていない（＝タブ落ちの兆候）
 * 検査項目（card-name-check.tsv）: 18 列（check-card-name-vs-sku.cjs の COLUMNS と同じ）／frozen が 0/1／rank が数字／flags が空でない／
 *   slug+rank+id が一意
 * 出力: 行数・status 内訳・issue_type のユニーク値（report にそのまま貼れる形）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SPECS = {
  '_file/article-fix-backlog.tsv': {
    header: ['status', 'priority', 'target_slug', 'position', 'issue_type', 'detail', 'rakuten_url', 'source', 'added_date', 'notes'],
    domains: {
      status: ['pending', 'blocked', 'needs-human', 'done'],
      priority: ['A', 'B', 'C'],
      //   asin_mismatch: 既設置 Amazon ASIN が別変種／別商品を指している（campkit-20260921-36 §B・キュー#16 で新設）
      issue_type: ['discontinued_404', 'product_swap', 'price_unconfirmed', 'out_of_stock', 'name_fix', 'asin_mismatch'],
    },
    patterns: {
      target_slug: /^[a-z0-9-]+$/,
      added_date: /^\d{4}-\d{2}-\d{2}$/,
      rakuten_url: /^(?:https?:\/\/\S+)?$/,
    },
    summarize: ['status', 'issue_type'],
  },
  '_file/rewrite-backlog.tsv': {
    header: ['status', 'priority', 'target_slug', 'cluster', 'gsc_impressions', 'gsc_position', 'lever', 'detail', 'source', 'added_date', 'notes'],
    domains: { status: ['pending', 'blocked', 'needs-human', 'done'] },
    //   added_date は既存 3 行（L2/L4/L6・2026-08 の手順R 実施分）が「日付 ｜実施メモ」の形で書かれているため前方一致に留める（列ずれではない＝11 列は揃っている）
    patterns: { target_slug: /^[a-z0-9-]+$/, added_date: /^\d{4}-\d{2}-\d{2}/ },
    summarize: ['status', 'lever'],
  },
  '_file/card-name-check.tsv': {
    header: ['slug', 'rank', 'id', 'frozen', 'http', 'card_name', 'rakuten_item_name', 'maker_model', 'brand',
      'axis_count', 'axis_first', 'card_price', 'current_price', 'stock', 'flags', 'checked_at', 'judged_task', 'sku_selected'],
    domains: { frozen: ['0', '1'] },
    patterns: { slug: /^[a-z0-9-]+$/, rank: /^\d+$/, flags: /^\S+$/ },
    uniqueKey: ['slug', 'rank', 'id'],
    summarize: ['frozen', 'http'],
  },
  // 既設置 Amazon リンクの棚卸し（check-amazon-asin.cjs の COLUMNS と同じ 21 列。campkit-20260921-36 §B で 19 列、37 §A で verdict の直後に
  //   price_gap（(Amazon価格−カードprice)÷カードprice の整数%・空/0%/±NN%）と seller_type（official/amazon/marketplace/reseller/unknown）を追加）
  '_file/amazon-asin-check.tsv': {
    header: ['slug', 'rank', 'id', 'frozen', 'link_form', 'asin', 'amazon_url', 'card_name', 'brand', 'maker_model', 'card_price',
      'static_flags', 'amazon_title', 'amazon_price', 'amazon_stock', 'verdict', 'price_gap', 'seller_type', 'checked_at', 'judged_task', 'note'],
    domains: { frozen: ['0', '1'], link_form: ['amazonAsin', 'amazonUrl', 'legacy_source_amazon', 'none'] },
    //   verdict / price_gap / seller_type は未照合なら空（seller_type の空は domains でなく patterns で許す）
    //   asin の書式は検査しない（不正な ASIN を bad_format として検出するのが同スクリプトの役目）
    patterns: {
      slug: /^[a-z0-9-]+$/, rank: /^\d+$/, static_flags: /^\S+$/,
      verdict: /^(?:|ok|model_mismatch|different_product|out_of_stock|404|unverifiable|blocked_by_amazon)$/,
      price_gap: /^(?:|0%|[+-][1-9]\d*%)$/,
      seller_type: /^(?:|official|amazon|marketplace|reseller|unknown)$/,
    },
    uniqueKey: ['slug', 'rank', 'id'],
    summarize: ['link_form', 'verdict', 'seller_type'],
  },
};

function validate(rel, opts = {}) {
  const abs = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  const key = path.relative(ROOT, abs).replace(/\\/g, '/');
  const spec = SPECS[key] || null;
  const errors = [];
  const err = (m) => errors.push(m);

  if (!fs.existsSync(abs)) return { key, errors: [`ファイルが無い: ${abs}`], summary: '' };
  const text = fs.readFileSync(abs, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) err('先頭に BOM がある');
  if (text.includes('\r')) err('CR（\\r）が含まれている（LF のみで書くこと）');
  if (!text.endsWith('\n')) err('末尾が改行で終わっていない');
  if (text.endsWith('\n\n')) err('末尾に空行が 2 つ以上ある');
  const lines = text.replace(/\n$/, '').split('\n');
  const header = lines[0].split('\t');
  if (spec && spec.header.join('\t') !== header.join('\t')) {
    err(`ヘッダが仕様と違う\n      期待: ${spec.header.join(' | ')}\n      実際: ${header.join(' | ')}`);
  }
  const ncol = spec ? spec.header.length : header.length;
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (l === '') { err(`L${i + 1}: 空行`); continue; }
    const cells = l.split('\t');
    if (cells.length !== ncol) {
      err(`L${i + 1}: 列数 ${cells.length}（期待 ${ncol}）: ${l.slice(0, 90)}…`);
      continue;
    }
    const o = {};
    header.forEach((h, k) => { o[h] = cells[k]; });
    o.__line = i + 1;
    rows.push(o);
  }
  if (spec) {
    for (const r of rows) {
      for (const [col, dom] of Object.entries(spec.domains || {})) {
        if (!dom.includes(r[col])) err(`L${r.__line}: ${col}="${String(r[col]).slice(0, 60)}" は許可値 [${dom.join('|')}] に無い`);
      }
      for (const [col, re] of Object.entries(spec.patterns || {})) {
        if (!re.test(r[col] ?? '')) err(`L${r.__line}: ${col}="${String(r[col]).slice(0, 60)}" が書式 ${re} に合わない`);
      }
    }
    if (spec.uniqueKey) {
      const seen = new Map();
      for (const r of rows) {
        const k = spec.uniqueKey.map((c) => r[c]).join('\t');
        if (seen.has(k)) err(`L${r.__line}: キー (${spec.uniqueKey.join('+')}) が L${seen.get(k)} と重複: ${k.replace(/\t/g, ' / ')}`);
        else seen.set(k, r.__line);
      }
    }
  }
  if (opts.expectRows != null && rows.length !== opts.expectRows) err(`行数（ヘッダ除く）${rows.length} が期待 ${opts.expectRows} と違う`);

  // サマリ
  const parts = [`行数（ヘッダ除く）: ${rows.length}`, `列数: ${ncol}`];
  for (const col of (spec && spec.summarize) || []) {
    const m = {};
    for (const r of rows) m[r[col]] = (m[r[col]] || 0) + 1;
    parts.push(`${col} 内訳: ${Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('／')}`);
  }
  if (spec && spec.domains && spec.domains.issue_type) {
    parts.push(`issue_type ユニーク値: ${[...new Set(rows.map((r) => r.issue_type))].join(', ')}`);
  }
  return { key, errors, summary: parts.join('\n  '), rows: rows.length };
}

function main() {
  const argv = process.argv.slice(2);
  let expectRows = null;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--expect-rows') expectRows = Number(argv[++i]);
    else files.push(argv[i]);
  }
  const targets = files.length ? files : Object.keys(SPECS).filter((k) => fs.existsSync(path.join(ROOT, k)));
  let bad = 0;
  for (const f of targets) {
    const r = validate(f, { expectRows: files.length === 1 ? expectRows : null });
    const ok = r.errors.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.key}${SPECS[r.key] ? '' : '（未登録: 列数の一致のみ検査）'}`);
    if (r.summary) console.log(`  ${r.summary}`);
    for (const e of r.errors) console.log(`  NG: ${e}`);
  }
  console.log(bad ? `\n${bad} ファイル NG` : '\nすべて PASS');
  process.exit(bad ? 1 : 0);
}

if (require.main === module) main();
module.exports = { validate, SPECS };
