// Backward-compatible command path; sitemap generation now uses the accepted Vercel serving API.
const generator = require("./generate-sitemap-v9.cjs");

if (require.main === module) {
  generator.main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = generator;
