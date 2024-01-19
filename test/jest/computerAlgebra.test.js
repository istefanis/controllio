/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / ComputerAlgebra.test
 */

// Any '*.test.js' files like this are automatically discovered and executed by Jest.
// This file is not imported anywhere so as not to be executed regularly

// Import this first to initialize required components
import * as computerAlgebraService from "../../math/computerAlgebra/computerAlgebraService.js";
import { computerAlgebraTests } from "../definitions/computerAlgebraTests.js";

const runComputerAlgebraJestTest = (t) => {
  const actualValue = t.assertion[0];
  const expectedValue = t.assertion[1];

  test(`[TE-02] ${t.description} === ${expectedValue}`, () => {
    expect(actualValue).toEqual(expectedValue);
  });
};

//
// Init
//
const init = function () {
  for (let test of Object.values(computerAlgebraTests)) {
    runComputerAlgebraJestTest(test);
  }
};

init();
