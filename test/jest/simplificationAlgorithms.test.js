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
import { getTopBlock, setTopBlock } from "../../model/topBlockService.js";
import {
  areEqualArraysRoundDecimal,
  roundDecimalDigitsTests,
} from "../../util/commons.js";
import { getLogMode, setLogMode } from "../../util/loggingService.js";
import { simplificationAlgorithmsTests } from "../definitions/simplificationAlgorithmsTests.js";

const runSimplificationAlgorithmsJestTest = async (t) => {
  if (getTopBlock()) {
    getTopBlock().clearState();
  } else {
    setTopBlock(new Block());
  }
  setTopBlock(t.circuit(getTopBlock()));

  //computation of simplified block value
  const actualValue = await getTopBlock().getSimplifiedValue();
  const expectedValue = t.assertion;
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundDecimalDigitsTests
  );

  test(`[TE-11] ${t.description} - ${actualValue} ~== ${expectedValue}`, () => {
    expect(testCondition).toBeTruthy();
  });

  getTopBlock().clearState();
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
