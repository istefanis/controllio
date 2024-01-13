/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / SimplificationAlgorithmsTests
 */

import { Ratio } from "../math/computerAlgebra/dataTypes/ratios.js";
import { Polynomial } from "../math/computerAlgebra/dataTypes/polynomials.js";
import { adder } from "../model/elements/adder.js";
import { tf, Tf } from "../model/elements/tf.js";
import { connect } from "../model/elementConnectionService.js";
import { Block, getSimplifiedBlockValue } from "../model/elements/block.js";
import { runTestsSectionAsync } from "./testService.js";
import {
  animationSpeedCoeff,
  setAnimationSpeedCoeff,
} from "../view/navbarView.js";
import { areEqualArraysRoundDecimal } from "../util/commons.js";
import { logMessages } from "../util/loggingService.js";

export const mergeFeedbackLoopTest1 = (block1) => {
  const tf1 = new Tf(
    new Ratio(new Polynomial("s", [1, 0, 1, 1, 0]), new Polynomial("s", [1])),
    block1
  );
  const tf2 = tf([1, 0], [2, 1, 0], block1);
  const tf3 = tf([1, 0], [1, 0, 1, 0], block1);
  // const tf4 = tf([1], [1, 0], block1);
  // const tf5 = tf([1], [1, 0, 0], block1);
  // const tf6 = tf([2, 0], [3, 0, 1], block1);

  const add1 = adder(block1);
  const add2 = adder(block1);

  connect(tf1, tf2);
  connect(tf2, add1);
  connect(add1, tf1);
  connect(tf1, add2);
  connect(add2, tf3);
  connect(tf3, add2);

  // return the block where the elements were stored so as to be passed to simplify
  return block1;
};

export const splitTfIntoSingleOutputTfsTest1 = (block1) => {
  // const tf1 = tf([1, 0, 1, 1, 0], [1], block1);
  const tf2 = tf([1, 0], [2, 1, 0], block1);
  const tf3 = tf([1, 0], [1, 0, 1, 0], block1);
  const tf4 = tf([1], [1, 0], block1);
  const tf5 = tf([1], [1, 0, 0], block1);
  const tf6 = tf([2, 0], [1, 1], block1);

  const add1 = adder(block1);
  // const add2 = adder(block1);

  connect(add1, tf2);
  connect(tf2, tf3);
  connect(tf2, tf4);
  connect(tf2, tf5);
  connect(tf3, tf6);
  connect(tf4, tf6);
  connect(tf5, tf6);

  return block1;
};

export const mergeSerialAddersTest1 = (block1) => {
  // const tf1 = tf([1, 0, 1, 1, 0], [1], block1);
  // const tf2 = tf([1, 0], [2, 1, 0], block1);
  // const tf3 = tf([1, 0], [1, 0, 1, 0], block1);
  // const tf4 = tf([1], [1, 0], block1);
  const tf5 = tf([1], [1, 0, 0], block1);
  // const tf6 = tf([2, 0], [3, 0, 1], block1);

  const add1 = adder(block1);
  const add2 = adder(block1);

  connect(add1, add2);
  connect(add2, tf5);
  connect(tf5, add1);

  return block1;
};

export const mergeParallelTfsTest1 = (block1) => {
  const tf1 = tf([1, 0, 1, 1, 0], [1], block1);
  const tf2 = tf([1, 0], [2, 1, 0], block1);
  const tf3 = tf([1, 0], [1, 0, 1, 0], block1);
  // const tf4 = tf([1], [1, 0], block1);
  // const tf5 = tf([1], [1, 0, 0], block1);
  // const tf6 = tf([2, 0], [3, 0, 1], block1);

  const add1 = adder(block1);
  const add2 = adder(block1);

  connect(add1, tf1);
  connect(add1, tf2);
  connect(add1, tf3);
  connect(tf1, add2);
  connect(tf2, add2);
  connect(tf3, add2);

  return block1;
};

export const circuit1 = (block1) => {
  const tf1 = new Tf(
    new Ratio(new Polynomial("s", [2]), new Polynomial("s", [1, 1])),
    block1
  );
  const tf2 = tf([10, 2, 5], [8, -1, 1], block1);
  const tf2p = tf([1], [8], block1);
  const tf3 = tf([1, 2, 5], [8], block1);
  const tf4 = tf([1], [4], block1);
  const add1 = adder(block1);
  const add2 = adder(block1);
  const add3 = adder(block1);
  const add4 = adder(block1);
  const add5 = adder(block1);
  connect(add1, add2);
  connect(add2, tf1);
  connect(tf1, add4);
  connect(add4, tf2);
  connect(tf2, add4);
  connect(tf1, add5);
  connect(add5, tf2p);
  connect(tf2p, tf4);
  connect(tf4, add5);
  connect(tf2, add3);
  connect(tf2p, add3);
  connect(add3, tf3);
  return block1;
};

let testsBlock = new Block();
const roundingDigits = 3;

export const runSimplificationAlgorithmsTests = async function () {
  const runSimplificationAlgorithmsTest = async (test) => {
    testsBlock.clearState();
    testsBlock = test.circuit(testsBlock);

    //computation of simplified block value
    const actualValue = await getSimplifiedBlockValue(testsBlock);
    const expectedValue = test.assertion;
    const testCondition = areEqualArraysRoundDecimal(
      actualValue,
      expectedValue,
      roundingDigits
    );

    logMessages(
      [
        `[TE-04] ` +
          `%c ${testCondition ? "success" : "failure"} ` +
          `%c - ${test.description} === ${expectedValue}`,
        `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
        `background: #fff; color: #000`,
      ],
      "tests-css"
    );

    testsBlock.clearState();
    return;
  };

  const tests = {
    test1: {
      description: "test1: mergeFeedbackLoopTest1",
      circuit: mergeFeedbackLoopTest1,
      assertion: [
        "ratio",
        [
          ["polynomial", ["s", [1, 0.5, 1, 1.5, 0.5]]],
          ["polynomial", ["s", [-0.5, 0, -0.5, 0.5, 0.5, 0]]],
        ],
      ],
    },

    test2: {
      description: "test2: splitTfIntoSingleOutputTfsTest1",
      circuit: splitTfIntoSingleOutputTfsTest1,
      assertion: [
        "ratio",
        [
          ["polynomial", ["s", [1, 2, 1, 1]]],
          ["polynomial", ["s", [1, 1.5, 1.5, 1.5, 0.5, 0]]],
        ],
      ],
    },

    test3: {
      description: "test3: mergeSerialAddersTest1",
      circuit: mergeSerialAddersTest1,
      assertion: [
        "ratio",
        [
          ["polynomial", ["s", [1]]],
          ["polynomial", ["s", [1, 0, -1]]],
        ],
      ],
    },

    test4: {
      description: "test4: mergeParallelTfsTest1",
      circuit: mergeParallelTfsTest1,
      assertion: [
        "ratio",
        [
          ["polynomial", ["s", [1, 0.5, 2, 2, 1.5, 2, 1.5, 1]]],
          ["polynomial", ["s", [1, 0.5, 1, 0.5]]],
        ],
      ],
    },

    test5: {
      description: "test5: circuit1",
      circuit: circuit1,
      assertion: [
        "ratio",
        [
          ["polynomial", ["s", [1, 3.166, 7.957, 7.54, 4.05, 2.301]]],
          ["polynomial", ["s", [-0.821, -2.874, -4.927, -4.517, -1.642]]],
        ],
      ],
    },
  };

  let c = animationSpeedCoeff;
  setAnimationSpeedCoeff(0);

  await runTestsSectionAsync(
    "Simplification algorithms",
    runSimplificationAlgorithmsTest,
    Object.values(tests)
  );

  setAnimationSpeedCoeff(c);
};
