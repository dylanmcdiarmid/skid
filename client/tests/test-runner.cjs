"use strict";

const {
  runQunitPuppeteer,
  printResultSummary,
  printFailedTests,
} = require("node-qunit-puppeteer");

const qunitArgs = {
  targetUrl: `file://${__dirname}/../../dist-tests/test.html`,
  timeout: 10_000,
  puppeteerArgs: ["--no-sandbox"],
  redirectConsole: true,
};

runQunitPuppeteer(qunitArgs)
  .then((result) => {
    if (result.stats.failed > 0) {
      printFailedTests(result, console);
    }
    printResultSummary(result, console);
    process.exit(result.stats.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("Error running tests:", error);
    process.exit(1);
  });
