/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.camp-kit-guide.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    // 全許可（'*'）は維持したうえで、AI検索・AI学習系のクローラを明示的に allow で並べる。
    // 明示しておくと「robots.txt に名前が無いので控える」挙動のクローラにも許可が伝わる。
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      // Google: AIによる概要／AIモード・Gemini 向けの利用可否は Google-Extended で制御する
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      // OpenAI: GPTBot=学習用クロール／OAI-SearchBot=ChatGPT検索のインデックス／ChatGPT-User=ユーザー操作による取得
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
  },
};
