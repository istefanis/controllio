/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / SimplificationAlgorithmsTests
 */

import {
  circuit1,
  linkwitzRiley4Crossover,
  mergeFeedbackLoopTest1,
  mergeParallelTfsTest1,
  mergeSerialAddersTest1,
  splitTfIntoSingleOutputTfsTest1,
} from "./circuits.js";

export const simplificationAlgorithmsTests = {
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

  test6: {
    description: "test6: linkwitzRiley4Crossover",
    circuit: linkwitzRiley4Crossover,
    assertion: [
      "ratio",
      [
        ["polynomial", ["s", [1, 0, 0, 0, 1]]],
        ["polynomial", ["s", [1, 2.8284, 4, 2.8284, 1]]],
      ],
    ],
  },
};
