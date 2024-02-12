/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / SimplificationAlgorithms.customTest
 */

import { Block } from "../../model/elements/block.js";
import { getTopBlock, setTopBlock } from "../../model/topBlockService.js";
import {
  animationSpeedCoeff,
  setAnimationSpeedCoeff,
} from "../../view/navbarView.js";
import {
  areEqualArraysRoundDecimal,
  roundDecimalDigitsTests,
} from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import { simplificationAlgorithmsTests } from "../definitions/simplificationAlgorithmsTests.js";

const runSimplificationAlgorithmsCustomTest = async (t) => {
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

  logMessages(
    [
      `[TE-04] ` +
        `%c ${testCondition ? "success" : "failure"} ` +
        `%c - ${t.description} - ${actualValue} ~== ${expectedValue}`,
      `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
      `background: #fff; color: #000`,
    ],
    "tests-css"
  );

  getTopBlock().clearState();
  return;
};

export const runSimplificationAlgorithmsCustomTests = async function () {
  let c = animationSpeedCoeff;
  setAnimationSpeedCoeff(1);

  logMessages([`[TE-01] Simplification algorithms tests start`], "tests");
  for (let test of Object.values(
    Object.values(simplificationAlgorithmsTests)
  )) {
    await runSimplificationAlgorithmsCustomTest(test);
  }
  logMessages([`[TE-06] Simplification algorithms tests end`], "tests");

  setAnimationSpeedCoeff(c);
};
