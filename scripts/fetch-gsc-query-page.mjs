#!/usr/bin/env node
// Google Search Console「クエリ×ページ」データの取得（campkit-20261013-03 / 2026-10-13）
//
// 新規記事・統合方針の分析用に、searchanalytics.query を dimensions ["query","page"] で
// 全行ページングして取得し、Drive の指示箱フォルダへ TSV を書き出す（リポジトリには置かない）。
//
//   data-campkit-gsc-qp-90d-<YYYYMMDD>.tsv   … 直近90日 query×page
//   data-campkit-gsc-qp-28d-<YYYYMMDD>.tsv   … 直近28日 query×page
//   data-campkit-gsc-page-28d-<YYYYMMDD>.tsv … 直近28日 page 単位
//
// 列: query / page / clicks / impressions / ctr / position
//     （page 単位ファイルは page / clicks / impressions / ctr / position）
//     ctr は百分率（小数2桁）、position は小数1桁。UTF-8・BOMなし・タブ区切り・ヘッダ1行。
//
// 認証・プロパティ解決は scripts/diagnose-gsc.mjs と同方式（認証情報はコードに書かない）。
//   1. GSC_ACCESS_TOKEN
//   2. GSC_SA_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS
//   3. GSC_CLIENT_ID + GSC_CLIENT_SECRET + GSC_REFRESH_TOKEN
// プロパティ: GSC_SITE_URL（既定 https://www.camp-kit-guide.com/ 。403/404時は sc-domain: を試す）
//
// 使い方:
//   node scripts/fetch-gsc-query-page.mjs [--end YYYY-MM-DD] [--out <dir>] [--tag YYYYMMDD]

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DEFAULT_OUT_DIR = "G:\\マイドライブ\\_claude\\_reference\\_tasks";
const DEFAULT_SITE = "https://www.camp-kit-guide.com/";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const ROW_LIMIT = 25000;

// ---------- args ----------
const args = process.argv.slice(2);
const argVal = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

// ---------- .env.local ----------
function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

// ---------- dates ----------
// GSC は直近2〜3日分が未確定のため、終了日は既定で「今日-3日」
const ymd = (d) => d.toISOString().slice(0, 10);
const END_DATE = argVal("--end", ymd(new Date(Date.now() - 3 * 86400e3)));
const startFor = (days) => ymd(new Date(new Date(END_DATE).getTime() - (days - 1) * 86400e3));
const OUT_DIR = argVal("--out", DEFAULT_OUT_DIR);
const TAG = argVal("--tag", ymd(new Date()).replace(/-/g, ""));

// ---------- auth ----------
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function tokenFromServiceAccount(keyFile) {
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  if (!key.client_email || !key.private_key) throw new Error("サービスアカウントJSONに client_email / private_key がありません");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  );
  const sig = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${claim}`), key.private_key);
  const assertion = `${header}.${claim}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`SAトークン取得失敗: ${res.status} ${JSON.stringify(j)}`);
  return { token: j.access_token, method: `service-account (${key.client_email})` };
}

async function tokenFromRefresh(id, secret, refresh) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: id, client_secret: secret, refresh_token: refresh }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`refresh_token 交換失敗: ${res.status} ${JSON.stringify(j)}`);
  return { token: j.access_token, method: "oauth-refresh-token" };
}

async function getToken() {
  const env = process.env;
  if (env.GSC_ACCESS_TOKEN) return { token: env.GSC_ACCESS_TOKEN, method: "access-token(env)" };
  const keyFile = env.GSC_SA_KEY_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    const abs = path.isAbsolute(keyFile) ? keyFile : path.join(ROOT, keyFile);
    if (!fs.existsSync(abs)) throw new Error(`キーファイルが見つかりません: ${abs}`);
    return tokenFromServiceAccount(abs);
  }
  if (env.GSC_CLIENT_ID && env.GSC_CLIENT_SECRET && env.GSC_REFRESH_TOKEN) {
    return tokenFromRefresh(env.GSC_CLIENT_ID, env.GSC_CLIENT_SECRET, env.GSC_REFRESH_TOKEN);
  }
  throw new Error(
    "GSC認証情報がありません。次のいずれかを .env.local に設定してください: " +
      "GSC_ACCESS_TOKEN / GSC_SA_KEY_FILE(またはGOOGLE_APPLICATION_CREDENTIALS) / GSC_CLIENT_ID+GSC_CLIENT_SECRET+GSC_REFRESH_TOKEN"
  );
}

// ---------- query ----------
// dimensions を配列で渡し、startRow で全行取得する（1リクエスト最大 25000 行）
async function queryAll(token, siteUrl, dimensions, startDate) {
  const rows = [];
  let startRow = 0;
  for (;;) {
    const body = { startDate, endDate: END_DATE, dimensions, rowLimit: ROW_LIMIT, startRow, dataState: "final" };
    const res = await fetch(`${API}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      const err = new Error(`searchAnalytics.query [${dimensions.join(",")}] ${startDate}〜${END_DATE} 失敗: ${res.status} ${t.slice(0, 800)}`);
      err.status = res.status;
      throw err;
    }
    const j = await res.json();
    const got = j.rows ?? [];
    for (const r of got) rows.push({ keys: r.keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    if (got.length < ROW_LIMIT) break;
    startRow += got.length;
  }
  return rows;
}

const clean = (v) => String(v).replace(/[\t\r\n]/g, " ");

function writeTsv(file, keyHeaders, rows) {
  const lines = [[...keyHeaders, "clicks", "impressions", "ctr", "position"].join("\t")];
  for (const r of rows) {
    lines.push(
      [...r.keys.map(clean), r.clicks, r.impressions, (r.ctr * 100).toFixed(2), r.position.toFixed(1)].join("\t")
    );
  }
  // BOMなし・LF・UTF-8
  fs.writeFileSync(file, lines.join("\n") + "\n", { encoding: "utf8" });
  return lines.length - 1;
}

const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);

// ---------- main ----------
(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const auth = await getToken();
  console.log(`認証: ${auth.method}`);
  console.log(`終了日: ${END_DATE} / 出力先: ${OUT_DIR}`);

  // プロパティ解決（90日 page 単位の軽いクエリで確定させる）
  const candidates = [process.env.GSC_SITE_URL || DEFAULT_SITE, "sc-domain:camp-kit-guide.com"];
  let siteUrl = null;
  let lastErr = null;
  for (const c of candidates) {
    try {
      await queryAll(auth.token, c, ["date"], startFor(1));
      siteUrl = c;
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`[site ${c}] ${e.message}`);
      if (e.status !== 403 && e.status !== 404) throw e;
    }
  }
  if (!siteUrl) throw lastErr;
  console.log(`プロパティ: ${siteUrl}`);

  const jobs = [
    { file: `data-campkit-gsc-qp-90d-${TAG}.tsv`, dimensions: ["query", "page"], days: 90 },
    { file: `data-campkit-gsc-qp-28d-${TAG}.tsv`, dimensions: ["query", "page"], days: 28 },
    { file: `data-campkit-gsc-page-28d-${TAG}.tsv`, dimensions: ["page"], days: 28 },
  ];

  const summary = [];
  for (const job of jobs) {
    const startDate = startFor(job.days);
    const rows = await queryAll(auth.token, siteUrl, job.dimensions, startDate);
    const out = path.join(OUT_DIR, job.file);
    const n = writeTsv(out, job.dimensions, rows);
    const s = {
      file: job.file,
      period: `${startDate} 〜 ${END_DATE} (${job.days}日)`,
      rows: n,
      clicks: sum(rows, "clicks"),
      impressions: sum(rows, "impressions"),
    };
    summary.push(s);
    console.log(`${s.file}: ${s.rows}行 / clicks ${s.clicks} / impressions ${s.impressions} / ${s.period}`);
  }

  console.log("\n--- summary (markdown) ---");
  console.log("| ファイル | 期間 | 行数 | 合計クリック | 合計表示 |");
  console.log("|---|---|---|---|---|");
  for (const s of summary) console.log(`| ${s.file} | ${s.period} | ${s.rows} | ${s.clicks} | ${s.impressions} |`);
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
