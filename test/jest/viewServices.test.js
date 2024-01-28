/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / ViewServices.test
 */

// Any '*.test.js' files like this are automatically discovered and executed by Jest.
// This file is not imported anywhere so as not to be executed regularly

// Import these first to initialize required components
import * as computerAlgebraService from "../../math/computerAlgebra/computerAlgebraService.js";
import * as navbarView from "../../view/navbarView.js";
import { viewServicesTests } from "../definitions/viewServicesTests.js";

const runViewServicesJestTest = async (t) => {
  const returnedValuesArray = await t.steps();
  const testCondition = t.assertion.call(null, ...returnedValuesArray);
  const testResultsDescription = t.resultsDescription.call(
    null,
    ...returnedValuesArray
  );

  test(`[TE-05] ${t.description}${
    testResultsDescription ? " - " + testResultsDescription : ""
  }`, () => {
    expect(testCondition).toBeTruthy();
  });

  return;
};

//
// Init
//
const init = async function () {
  for (let test of Object.values(viewServicesTests)) {
    await runViewServicesJestTest(test);
  }
};

await init();
