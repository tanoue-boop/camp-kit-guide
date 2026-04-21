/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.camp-kit-guide.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
    ],
  },
};
