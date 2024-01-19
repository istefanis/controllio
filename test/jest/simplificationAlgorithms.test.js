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
import { Block, getSimplifiedBlockValue } from "../../model/elements/block.js";
import { areEqualArraysRoundDecimal } from "../../util/commons.js";
import { getLogMode, setLogMode } from "../../util/loggingService.js";
import { simplificationAlgorithmsTests } from "../definitions/simplificationAlgorithmsTests.js";

let testsBlock = new Block();
const roundingDigits = 3;

const runSimplificationAlgorithmsJestTest = async (t) => {
  testsBlock.clearState();
  testsBlock = t.circuit(testsBlock);

  //computation of simplified block value
  const actualValue = await getSimplifiedBlockValue(testsBlock);
  const expectedValue = t.assertion;
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundingDigits
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
