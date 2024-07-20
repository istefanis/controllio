/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / DomainTransformation.test
 */

// Any '*.test.js' files like this are automatically discovered and executed by Jest.
// This file is not imported anywhere so as not to be executed regularly

// Import this first to initialize required components
import * as computerAlgebraService from "../../math/computerAlgebra/computerAlgebraService.js";
import {
  areEqualArraysRoundDecimal,
  roundDecimalDigitsTests,
} from "../../util/commons.js";
import { domainTransformationTests } from "../definitions/domainTransformationTests.js";

const runDomainTranformationJestTest = (t) => {
  const actualValue = t.assertion[0];
  const expectedValue = t.assertion[1];
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundDecimalDigitsTests
  );

  test(`[TE-05] ${t.description} ~== ${expectedValue}`, () => {
    expect(testCondition).toBeTruthy();
  });
};

//
// Init
//
const init = function () {
  for (let test of Object.values(domainTransformationTests)) {
    runDomainTranformationJestTest(test);
  }
};

init();
