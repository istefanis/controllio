/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / SimplificationAlgorithms.customTest
 */

import { Block } from "../../model/elements/block.js";
import {
  animationSpeedCoeff,
  setAnimationSpeedCoeff,
} from "../../view/navbarView.js";
import { areEqualArraysRoundDecimal } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import { simplificationAlgorithmsTests } from "../definitions/simplificationAlgorithmsTests.js";

let testsBlock = new Block();
const roundingDigits = 3;

const runSimplificationAlgorithmsCustomTest = async (t) => {
  testsBlock.clearState();
  testsBlock = t.circuit(testsBlock);

  //computation of simplified block value
  const actualValue = await testsBlock.getSimplifiedValue();
  const expectedValue = t.assertion;
  const testCondition = areEqualArraysRoundDecimal(
    actualValue,
    expectedValue,
    roundingDigits
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

  testsBlock.clearState();
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
