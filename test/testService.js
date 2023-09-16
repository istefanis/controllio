/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / TestService
 */

import { runComputerAlgebraTests } from "../../test/computerAlgebraTests.js";
import { runPlotsTests } from "./plotsTests.js";

//
// Tests
//
export const runTestsSection = function (description, runTest, tests) {
  console.log(`${description} tests start`);
  Object.values(tests).forEach(runTest);
  console.log(`${description} tests end`);
};

export const runAllTests = function () {
  runComputerAlgebraTests();
  runPlotsTests();
};
