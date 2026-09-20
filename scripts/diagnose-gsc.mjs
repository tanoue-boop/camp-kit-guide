#!/usr/bin/env node
// Google Search Console 実績の取得（診断フェーズ1 / 2026-09-20）
//
// Search Console API (searchanalytics.query) で直近90日を取得し、
//   _file/gsc-pages.tsv    … page 単位（全ページ）: page / clicks / impressions / ctr / position
//   _file/gsc-queries.tsv  … query 単位（上位1000）: query / clicks / impressions / ctr / position
//   _file/gsc-meta.json    … 取得条件（期間・プロパティ・取得日時・件数）
// を書き出す。集計・突合は scripts/diagnose-articles.mjs が行う。
//
// 認証（優先順）※ 認証情報はコードに書かない。.env.local か .gitignore 対象のキーファイルで渡す
//   1. GSC_ACCESS_TOKEN                     … 既発行のOAuthアクセストークン（短命・手動検証用）
//   2. GSC_SA_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS … サービスアカウントJSONキーのパス
//        （GCP camp-kit-gsc で発行し、GSCプロパティのユーザーに client_email を追加しておく）
//   3. GSC_CLIENT_ID + GSC_CLIENT_SECRET + GSC_REFRESH_TOKEN … OAuthリフレッシュトークン
// プロパティ: GSC_SITE_URL（既定 https://www.camp-kit-guide.com/ 。403/404時は sc-domain: を試す）
//
// 使い方: node scripts/diagnose-gsc.mjs [--days 90] [--end YYYY-MM-DD]

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "_file");
const DEFAULT_SITE = "https://www.camp-kit-guide.com/";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3/sites";

// ---------- args ----------
const args = process.argv.slice(2);
const argVal = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const DAYS = Number(argVal("--days", "90"));

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
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
const endDate = argVal("--end", ymd(new Date(Date.now() - 3 * 86400e3)));
const startDate = ymd(new Date(new Date(endDate).getTime() - (DAYS - 1) * 86400e3));

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
async function queryAll(token, siteUrl, dimension, { rowLimit = 25000, maxRows = Infinity } = {}) {
  const rows = [];
  let startRow = 0;
  for (;;) {
    const body = {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: Math.min(rowLimit, maxRows - rows.length),
      startRow,
      dataState: "final",
    };
    const res = await fetch(`${API}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      const err = new Error(`searchAnalytics.query ${dimension} 失敗: ${res.status} ${t.slice(0, 500)}`);
      err.status = res.status;
      throw err;
    }
    const j = await res.json();
    const got = j.rows ?? [];
    for (const r of got) {
      rows.push({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    }
    if (got.length < body.rowLimit || rows.length >= maxRows) break;
    startRow += got.length;
  }
  return rows;
}

function writeTsv(file, header, rows) {
  const lines = [header.join("\t")];
  for (const r of rows) {
    lines.push(
      [r.key, r.clicks, r.impressions, (r.ctr * 100).toFixed(2), r.position.toFixed(1)]
        .map((v) => String(v).replace(/[\t\r\n]/g, " "))
        .join("\t")
    );
  }
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
}

// ---------- main ----------
(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`期間: ${startDate} 〜 ${endDate} (${DAYS}日)`);

  let auth;
  try {
    auth = await getToken();
  } catch (e) {
    console.error(`[auth] ${e.message}`);
    fs.writeFileSync(
      path.join(OUT_DIR, "gsc-meta.json"),
      JSON.stringify({ status: "no-credentials", error: e.message, startDate, endDate, attemptedAt: new Date().toISOString() }, null, 2)
    );
    process.exit(2);
  }
  console.log(`認証: ${auth.method}`);

  const candidates = [process.env.GSC_SITE_URL || DEFAULT_SITE, "sc-domain:camp-kit-guide.com"];
  let siteUrl = null;
  let pages = null;
  let lastErr = null;
  for (const c of candidates) {
    try {
      pages = await queryAll(auth.token, c, "page");
      siteUrl = c;
      break;
    } catch (e) {
      lastErr = e;
      console.warn(`[site ${c}] ${e.message}`);
      if (e.status !== 403 && e.status !== 404) throw e;
    }
  }
  if (!siteUrl) throw lastErr;

  const queries = await queryAll(auth.token, siteUrl, "query", { rowLimit: 1000, maxRows: 1000 });

  writeTsv(path.join(OUT_DIR, "gsc-pages.tsv"), ["page", "clicks", "impressions", "ctr", "position"], pages);
  writeTsv(path.join(OUT_DIR, "gsc-queries.tsv"), ["query", "clicks", "impressions", "ctr", "position"], queries);
  fs.writeFileSync(
    path.join(OUT_DIR, "gsc-meta.json"),
    JSON.stringify(
      { status: "ok", siteUrl, startDate, endDate, days: DAYS, auth: auth.method, pages: pages.length, queries: queries.length, fetchedAt: new Date().toISOString() },
      null,
      2
    )
  );
  console.log(`page: ${pages.length}件 / query: ${queries.length}件 → _file/gsc-pages.tsv, _file/gsc-queries.tsv`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
