/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / ViewServices.customTest
 */

import { logMessages } from "../../util/loggingService.js";
import { viewServicesTests } from "../definitions/viewServicesTests.js";

const runViewServicesCustomTest = async (t) => {
  const returnedValuesArray = await t.steps();
  const testCondition = t.assertion.call(null, ...returnedValuesArray);
  const testResultsDescription = t.resultsDescription.call(
    null,
    ...returnedValuesArray
  );

  logMessages(
    [
      `[TE-05] ` +
        `%c ${testCondition ? "success" : "failure"} ` +
        `%c - ${t.description}${
          testResultsDescription ? " - " + testResultsDescription : ""
        }`,
      `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
      `background: #fff; color: #000`,
    ],
    "tests-css"
  );

  return;
};

export const runViewServicesCustomTests = async function () {
  logMessages([`[TE-01] View services tests start`], "tests");
  for (let test of Object.values(Object.values(viewServicesTests))) {
    await runViewServicesCustomTest(test);
  }
  logMessages([`[TE-06] View services tests end`], "tests");
};
