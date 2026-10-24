// 記事MDXから構造化データ（ItemList / FAQPage）の材料を抜き出すヘルパー。
// MDX は書き換えず、ページ側（pages/posts/[slug].tsx の getStaticProps）で解析する。
// AI検索（AIによる概要・AIモード／ChatGPT検索／Perplexity 等）に引用されやすくするのが目的で、
// 本文に無い文言は一切足さない（抜き出したテキストの装飾を落とすだけ）。

export type RankedCard = {
  /** ItemList の position（記事内の出現順・1始まり） */
  position: number;
  /** MDX の rank 属性（記事内で一意でないことがあるので position とは別に持つ） */
  rank: number;
  /** 記事内アンカー用のカードid（無いカードもある） */
  id?: string;
  name: string;
};

export type FaqPair = { question: string; answer: string };

const CARD_BLOCK_RE = /<ProductCardMdx\b[\s\S]*?\/>/g;

function getAttr(block: string, key: string): string | undefined {
  const m = block.match(new RegExp(`\\b${key}="([^"]*)"`));
  return m && m[1] ? m[1] : undefined;
}

/** 装飾（リンク・太字・コード）を落として素のテキストにする。文言は変えない。 */
function toPlainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * ランキング形式（rank 属性付き ProductCardMdx）のカードを出現順に返す。
 * rank の無いカード（関連アイテム等）は ItemList に載せない。
 */
export function extractRankedCards(content: string): RankedCard[] {
  const blocks = content.match(CARD_BLOCK_RE) ?? [];
  const cards: RankedCard[] = [];
  for (const block of blocks) {
    const name = getAttr(block, "name");
    const rank = getAttr(block, "rank");
    if (!name || !rank) continue;
    const rankNum = Number(rank);
    if (!Number.isFinite(rankNum)) continue;
    const id = getAttr(block, "id");
    cards.push({
      position: cards.length + 1,
      rank: rankNum,
      ...(id ? { id } : {}),
      name: toPlainText(name),
    });
  }
  return cards;
}

/**
 * 「## よくある質問」配下の Q&A を対にして返す。対応する書き方は2つ。
 *   1. `**Q. …**` ＋ 直後の `A. …` 段落（既存記事の形式）
 *   2. `### …？` の見出し ＋ 直後の段落（campkit-aio-spec の推奨形式・2026-10-24 追加）
 * Q&A の形になっていない記事では空配列（＝FAQPage を出さない）。
 */
export function extractFaq(content: string): FaqPair[] {
  // MDX は CRLF で保存されている（core.autocrlf=true）ので、行頭/行末アンカーを
  // 使う前に必ず LF へ正規化する。これを忘れると全記事で見出しに一致しない。
  const src = content.replace(/\r\n?/g, "\n");
  const heading = src.match(/^##[ \t]+よくある質問[^\n]*$/m);
  if (!heading || heading.index === undefined) return [];

  const after = src.slice(heading.index + heading[0].length);
  const nextHeading = after.search(/^##[ \t]+/m);
  const section = nextHeading >= 0 ? after.slice(0, nextHeading) : after;

  // 行単位で走査する。`**Q. …**` の直後に `A. …` が来る形と、1行空けてから来る形の
  // 両方が既存記事に存在するため、ブロック分割ではなく行スキャンで対にする。
  const pairs: FaqPair[] = [];
  let question: string | null = null;
  let answerLines: string[] = [];

  const flush = () => {
    if (question && answerLines.length > 0) {
      const answer = toPlainText(answerLines.join("\n"));
      if (answer) pairs.push({ question, answer });
    }
    question = null;
    answerLines = [];
  };

  for (const rawLine of section.split("\n")) {
    const line = rawLine.trim();
    // 見出し形式の質問（`### 〜ですか？`）。疑問符で終わる h3〜h6 だけを質問として扱い、
    // それ以外の見出しは従来どおり「回答の終わり」として処理する（既存記事への影響なし）。
    const qh = line.match(/^#{3,6}[ \t]+(.+?)[ \t]*$/);
    if (qh && /[?？]$/.test(qh[1])) {
      flush();
      question = toPlainText(qh[1]);
      continue;
    }
    // `**Q. …**` と `**Q1. …**` の両方（既存記事に両形式がある）
    const q = line.match(/^\*\*[ \t]*Q\d*[.．:：][ \t]*(.+?)[ \t]*\*\*$/);
    if (q) {
      flush();
      question = toPlainText(q[1]);
      continue;
    }
    if (!question) continue;

    if (answerLines.length === 0) {
      if (line === "") continue; // Q と A の間の空行は許容
      const a = line.match(/^A[.．:：][ \t]*(.*)$/);
      if (a) {
        answerLines.push(a[1]);
        continue;
      }
      // `A.` を付けずに回答段落が続く記事もある。見出し・リスト・表・JSX・区切りで
      // 始まる行は回答ではないので、その場合だけ Q を捨てる。
      if (/^(#{1,6}[ \t]|[-*+][ \t]|\||<|>|---)/.test(line)) {
        question = null;
        continue;
      }
      answerLines.push(line);
      continue;
    }

    // 回答の継続行。空行・区切り・次の見出しで1件確定。
    if (line === "" || line === "---" || /^#{1,6}[ \t]/.test(line)) {
      flush();
      continue;
    }
    answerLines.push(line);
  }
  flush();

  return pairs;
}
