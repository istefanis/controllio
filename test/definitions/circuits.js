/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / Circuits
 */

import { Ratio } from "../../math/computerAlgebra/dataTypes/ratios.js";
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import { adder } from "../../model/elements/adder.js";
import { tf, Tf } from "../../model/elements/tf.js";
import { connect } from "../../model/elementConnectionService.js";
import { computeButterworthTermsArrays } from "../../util/commons.js";

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

export const linkwitzRiley4Crossover = (block1) => {
  const termsArrays1 = computeButterworthTermsArrays("low-pass", 2, 1, 1);
  const lowPassButterworth1 = tf(...termsArrays1, block1);
  const lowPassButterworth2 = tf(...termsArrays1, block1);

  const termsArrays2 = computeButterworthTermsArrays("high-pass", 2, 1, 1);
  const highPassButterworth1 = tf(...termsArrays2, block1);
  const highPassButterworth2 = tf(...termsArrays2, block1);

  const add1 = adder(block1);
  const add2 = adder(block1);

  connect(add1, lowPassButterworth1);
  connect(lowPassButterworth1, lowPassButterworth2);
  connect(lowPassButterworth2, add2);

  connect(add1, highPassButterworth1);
  connect(highPassButterworth1, highPassButterworth2);
  connect(highPassButterworth2, add2);

  return block1;
};
