/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / ComputerAlgebra.customTest
 */

import { computerAlgebraTests } from "../definitions/computerAlgebraTests.js";
import { areEqualArrays, sleep } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";

const runComputerAlgebraCustomTest = (t) => {
  const actualValue = t.assertion[0];
  const expectedValue = t.assertion[1];
  const testCondition = areEqualArrays(actualValue, expectedValue);

  logMessages(
    [
      `[TE-02] ` +
        `%c ${testCondition ? "success" : "failure"} ` +
        `%c - ${t.description} === ${expectedValue}`,
      `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
      `background: #fff; color: #000`,
    ],
    "tests-css"
  );
};

export const runComputerAlgebraCustomTests = async function () {
  logMessages([`[TE-01] Computer algebra tests start`], "tests");
  for (let test of Object.values(Object.values(computerAlgebraTests))) {
    runComputerAlgebraCustomTest(test);
    await sleep(100);
  }

  logMessages([`[TE-05] Computer algebra tests end`], "tests");
};
