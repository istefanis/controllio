/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / SimplificationAlgorithms.test
 */

// Any '*.test.js' files like this are automatically discovered and executed by Jest.
// This file is not imported anywhere so as not to be executed regularly

// Import this first to initialize required components
import * as computerAlgebraService from "../../math/computerAlgebra/computerAlgebraService.js";
import { Block } from "../../model/elements/block.js";
import {
  areEqualArraysRoundDecimal,
  roundDecimalDigitsTests,
} from "../../util/commons.js";
import { getLogMode, setLogMode } from "../../util/loggingService.js";
import { simplificationAlgorithmsTests } from "../definitions/simplificationAlgorithmsTests.js";

let testsBlock = new Block();

const runSimplificationAlgorithmsJestTest = async (t) => {
  testsBlock.clearState();
  testsBlock = t.circuit(testsBlock);

  //computation of simplified block value
  const actualValue = await testsBlock.getSimplifiedValue();
  const expectedValue = t.assertion;
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundDecimalDigitsTests
  );

  test(`[TE-04] ${t.description} - ${actualValue} ~== ${expectedValue}`, () => {
    expect(testCondition).toBeTruthy();
  });

  testsBlock.clearState();
  return;
};

//
// Init
//
const init = async function () {
  const logMode = getLogMode();
  setLogMode("null");
  for (let test of Object.values(simplificationAlgorithmsTests)) {
    await runSimplificationAlgorithmsJestTest(test);
  }
  setLogMode(logMode);
};

await init();
