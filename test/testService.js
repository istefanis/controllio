/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / TestService
 */

import { sleep } from "../util/commons.js";
import { logMessages, getLogMode, setLogMode } from "../util/loggingService.js";
import { runComputerAlgebraTests } from "./computerAlgebraTests.js";
import { runPlotsTests } from "./plotsTests.js";
import { runSimplificationAlgorithmsTests } from "./simplificationAlgorithmsTests.js";

//
// Tests
//
export const runTestsSection = function (description, runTest, tests) {
  logMessages([`[TE-01] ${description} tests start`], "tests");
  for (let test of Object.values(tests)) {
    runTest(test);
  }
  logMessages([`[TE-05] ${description} tests end`], "tests");
};

export const runTestsSectionAsync = async function (
  description,
  runTest,
  tests
) {
  logMessages([`[TE-01] ${description} tests start`], "tests");
  for (let test of Object.values(tests)) {
    await runTest(test);
  }
  logMessages([`[TE-05] ${description} tests end`], "tests");
};

export const runAllTests = async function () {
  const logMode = getLogMode();
  setLogMode("null");

  runComputerAlgebraTests();
  runPlotsTests();
  await runSimplificationAlgorithmsTests();
  await sleep(1000);

  setLogMode(logMode); //revert it to its previous value
};
