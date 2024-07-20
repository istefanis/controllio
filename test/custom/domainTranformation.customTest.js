/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / DomainTransformation.customTest
 */

import { domainTransformationTests } from "../definitions/domainTransformationTests.js";
import {
  areEqualArraysRoundDecimal,
  roundDecimalDigitsTests,
  sleep,
} from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";

const runDomainTransformationCustomTest = (t) => {
  const actualValue = t.assertion[0];
  const expectedValue = t.assertion[1];
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundDecimalDigitsTests
  );

  logMessages(
    [
      `[TE-05] ` +
        `%c ${testCondition ? "success" : "failure"} ` +
        `%c - ${t.description} === ${expectedValue}`,
      `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
      `background: #fff; color: #000`,
    ],
    "tests-css"
  );
};

export const runDomainTransformationCustomTests = async function () {
  logMessages([`[TE-04] Domain transformation tests start`], "tests");
  for (let test of Object.values(Object.values(domainTransformationTests))) {
    runDomainTransformationCustomTest(test);
    await sleep(100);
  }

  logMessages([`[TE-06] Domain transformation tests end`], "tests");
};
