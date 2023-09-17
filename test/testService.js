/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / TestService
 */

import { runComputerAlgebraTests } from "../../test/computerAlgebraTests.js";
import { logMessages, getLogMode, setLogMode } from "../util/loggingService.js";
import { runPlotsTests } from "./plotsTests.js";

//
// Tests
//
export const runTestsSection = function (description, runTest, tests) {
  logMessages([`[TE-01] ${description} tests start`], "tests");
  Object.values(tests).forEach(runTest);
  logMessages([`[TE-04] ${description} tests end`], "tests");
};

export const runAllTests = function () {
  const logMode = getLogMode();
  setLogMode("null");

  runComputerAlgebraTests();
  runPlotsTests();

  setLogMode(logMode); //revert it to its previous value
};
