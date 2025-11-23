import QUnit from "qunit";
import "qunit-dom";
import { cleanup } from "@testing-library/react";

// Setup qunit-dom
import { setup } from "qunit-dom";

setup(QUnit.assert);

function getTestFilter() {
  const cliTestFilter = process.env.TEST_FILTER || "";
  const searchParams = new URLSearchParams(window.location.search);
  const testFilesParam = searchParams.get("testFiles");
  let testFilesArray = testFilesParam ? testFilesParam.split(",") : [];

  const alreadyUsedCli = sessionStorage.getItem("alreadyUsedCli") === "true";

  if (!alreadyUsedCli && testFilesArray.length === 0 && cliTestFilter) {
    sessionStorage.setItem("alreadyUsedCli", "true");
    searchParams.set("testFiles", cliTestFilter);
    testFilesArray = cliTestFilter.split(",");
    window.location.search = searchParams.toString();
  }
  return testFilesArray;
}

const testContext = import.meta.webpackContext("../src", {
  recursive: true,
  regExp: /\.test\.(ts|tsx|js|jsx)$/,
});

const allTestKeys = testContext.keys();
const testFilesArray = getTestFilter();
const testKeys =
  testFilesArray.length > 0
    ? allTestKeys.filter((key) => {
        const pathLower = key.toLowerCase();
        return testFilesArray.some((filter: string) =>
          pathLower.includes(filter)
        );
      })
    : allTestKeys;

for (const key of testKeys) {
  testContext(key);
}

// RTL cleanup after each test
QUnit.hooks.afterEach(cleanup);

// Start QUnit
QUnit.start();
