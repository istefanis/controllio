/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / PlotsTests
 */

import { findComplexRootsOfPolynomial } from "../../math/numericalAnalysis/numericalAnalysisService.js";
import {
  toleranceTestsSmall,
  toleranceTestsMedium,
  toleranceTestsLarge,
} from "../../util/commons.js";
import BodePlot from "../../view/plots/bodePlot.js";
import NyquistPlot from "../../view/plots/nyquistPlot.js";

const bodeSteps = (numeratorTermsArray, denominatorTermsArray) => {
  const { magnitudeCurvePoints, phaseCurvePoints, characteristicNumbers } =
    new BodePlot(
      null,
      numeratorTermsArray,
      denominatorTermsArray,
      findComplexRootsOfPolynomial(numeratorTermsArray),
      findComplexRootsOfPolynomial(denominatorTermsArray)
    );
  return [magnitudeCurvePoints, phaseCurvePoints, characteristicNumbers];
};

const nyquistSteps = (numeratorTermsArray, denominatorTermsArray) => {
  const { curvePoints, stability } = new NyquistPlot(
    null,
    numeratorTermsArray,
    denominatorTermsArray,
    findComplexRootsOfPolynomial(numeratorTermsArray),
    findComplexRootsOfPolynomial(denominatorTermsArray)
  );
  return [curvePoints, stability];
};

const bodeAndNyquistSteps = (numeratorTermsArray, denominatorTermsArray) => {
  return [
    ...bodeSteps(numeratorTermsArray, denominatorTermsArray),
    ...nyquistSteps(numeratorTermsArray, denominatorTermsArray),
  ];
};

export const plotsTests = {
  test1: {
    description: "test1: tf([1, 0, 0, 0], [1])",
    numeratorTermsArray: [1, 0, 0, 0],
    denominatorTermsArray: [1],
    steps: bodeAndNyquistSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers,
      nyquistCurvePoints,
      stability
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "60 [dB/dec] (low), 60 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "270", toleranceTestsSmall],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "270",
        toleranceTestsSmall,
      ],
      ["Real part at wMin", nyquistCurvePoints[0][1], 0, toleranceTestsSmall],
      [
        "Imag part at w=0",
        nyquistCurvePoints[Math.ceil(nyquistCurvePoints.length / 2)][2],
        0,
        toleranceTestsSmall,
      ],
      [
        "Real part at wMax",
        nyquistCurvePoints[nyquistCurvePoints.length - 1][1],
        0,
        toleranceTestsSmall,
      ],
      ["Stable", stability, "no"],
    ],
  },

  test2: {
    description: "test2: tf([1], [1, 0, 0, 0])",
    numeratorTermsArray: [1],
    denominatorTermsArray: [1, 0, 0, 0],
    steps: bodeAndNyquistSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers,
      nyquistCurvePoints,
      stability
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "-60 [dB/dec] (low), -60 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "-270", toleranceTestsSmall],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-270",
        toleranceTestsSmall,
      ],
      ["Real part at wMin", nyquistCurvePoints[0][1], 0, toleranceTestsSmall],
      ["Imag part at wMin", nyquistCurvePoints[0][2], 0, toleranceTestsSmall],
      [
        "Real part at wMax",
        nyquistCurvePoints[nyquistCurvePoints.length - 1][1],
        0,
        toleranceTestsSmall,
      ],
      [
        "Imag part at wMax",
        nyquistCurvePoints[nyquistCurvePoints.length - 1][2],
        0,
        toleranceTestsSmall,
      ],
      ["Stable", stability, "no"],
    ],
  },

  test3: {
    description: "test3: tf([1, 0, 1], [1])",
    numeratorTermsArray: [1, 0, 1],
    denominatorTermsArray: [1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), 40 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsSmall],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "180",
        toleranceTestsSmall,
      ],
    ],
  },

  test4: {
    description: "test4: tf([1], [1, 0, 1])",
    numeratorTermsArray: [1],
    denominatorTermsArray: [1, 0, 1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), -40 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsSmall],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-180",
        toleranceTestsSmall,
      ],
    ],
  },

  test5: {
    description: "test5: tf([1], [0.3, 0.1, 1])",
    numeratorTermsArray: [1],
    denominatorTermsArray: [0.3, 0.1, 1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), -40 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-180",
        toleranceTestsMedium,
      ],
    ],
  },

  test6: {
    description: "test6: tf([1], [1, 0])",
    numeratorTermsArray: [1],
    denominatorTermsArray: [1, 0],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "-20 [dB/dec] (low), -20 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceTestsSmall],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-90",
        toleranceTestsSmall,
      ],
    ],
  },

  test7: {
    description: "test7: tf([1, 200, 33.333], [0.333, 0])",
    numeratorTermsArray: [1, 200, 33.333],
    denominatorTermsArray: [0.333, 0],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "90",
        toleranceTestsLarge,
      ],
    ],
  },

  test8: {
    description: "test8: tf([1, 0.625], [0.125])",
    numeratorTermsArray: [1, 0.625],
    denominatorTermsArray: [0.125],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "90",
        toleranceTestsMedium,
      ],
    ],
  },

  test9: {
    description: "test9: tf([1, 1.6], [0.2, 0])",
    numeratorTermsArray: [1, 1.6],
    denominatorTermsArray: [0.2, 0],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "0",
        toleranceTestsMedium,
      ],
    ],
  },

  test10: {
    description: "test10: tf([1, 0.2], [1.6, 0.2])",
    numeratorTermsArray: [1, 0.2],
    denominatorTermsArray: [1.6, 0.2],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "0",
        toleranceTestsMedium,
      ],
    ],
  },

  test11: {
    description: "test11: tf([1, 2, 5], [4, 4])",
    numeratorTermsArray: [1, 2, 5],
    denominatorTermsArray: [4, 4],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), 20 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "90",
        toleranceTestsMedium,
      ],
    ],
  },

  test12: {
    description: "test12: tf([1, 0, -0.1], [-0.1, -0.2, -0.1])",
    numeratorTermsArray: [1, 0, -0.1],
    denominatorTermsArray: [-0.1, -0.2, -0.1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), 0 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-180",
        toleranceTestsMedium,
      ],
    ],
  },

  test13: {
    description: "test13: tf([1, 2, 1], [-10, 0, 1])",
    numeratorTermsArray: [1, 2, 1],
    denominatorTermsArray: [-10, 0, 1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), 0 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "-180", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "0",
        toleranceTestsMedium,
      ],
    ],
  },

  test14: {
    description: "test14: tf([1], [64, 5.214, 64.212, 3.375, 8.062])",
    numeratorTermsArray: [1],
    denominatorTermsArray: [64, 5.214, 64.212, 3.375, 8.062],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-360",
        toleranceTestsMedium,
      ],
    ],
  },

  test15: {
    description: "test15: tf([3.8], [64, 5.214, 64.212, 3.375, 8.062, 0])",
    numeratorTermsArray: [3.8],
    denominatorTermsArray: [64, 5.214, 64.212, 3.375, 8.062, 0],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "-20 [dB/dec] (low), -100 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "-90", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-450",
        toleranceTestsMedium,
      ],
    ],
  },

  test16: {
    description:
      "test16: tf([1, 1.333, 1, -0.667, 0.667, 0.333, 0.833, 1.167, 1.167, 0.833, 0.333], " +
      "[-1, 0.667, 0.667, 2.333, 1.333, -0.333, -0.5, -0.833, -1.167, -0.833, -0.333])",
    numeratorTermsArray: [
      1, 1.333, 1, -0.667, 0.667, 0.333, 0.833, 1.167, 1.167, 0.833, 0.333,
    ],
    denominatorTermsArray: [
      -1, 0.667, 0.667, 2.333, 1.333, -0.333, -0.5, -0.833, -1.167, -0.833,
      -0.333,
    ],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      ["Phase at wMin", phaseCurvePoints[0][1], "-720", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-720",
        toleranceTestsMedium,
      ],
    ],
  },

  test17: {
    description:
      "test17: tf([1, -21, 210, -1260, 4725, -10395, 10395], " +
      "[1, 21, 211, 1281, 4935, 11655, 15120, 10395, 10395])",
    numeratorTermsArray: [1, -21, 210, -1260, 4725, -10395, 10395],
    denominatorTermsArray: [1, 21, 211, 1281, 4935, 11655, 15120, 10395, 10395],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), -40 [dB/dec] (high)",
      ],
      ["Phase at wMin", phaseCurvePoints[0][1], "0", toleranceTestsMedium],
      [
        "Phase at wMax",
        phaseCurvePoints[phaseCurvePoints.length - 1][1],
        "-1260",
        toleranceTestsLarge,
      ],
    ],
  },

  test18: {
    description:
      "test18: tf([1, 0, 0, 0, 1], " +
      "[1, 2.8284, 4, 2.8284, 1]) - linkwitzRiley4Crossover",
    numeratorTermsArray: [1, 0, 0, 0, 1],
    denominatorTermsArray: [1, 2.8284, 4, 2.8284, 1],
    steps: bodeSteps,
    assertions: (
      magnitudeCurvePoints,
      phaseCurvePoints,
      characteristicNumbers
    ) => [
      [
        "Max magnitude",
        Math.max(...magnitudeCurvePoints.map((x) => x[1])),
        1,
        toleranceTestsSmall,
      ],
      ["Filter type", characteristicNumbers?.filterTypeText, "All-pass filter"],
      [
        "Roll-off",
        characteristicNumbers?.rollOffText,
        "0 [dB/dec] (low), 0 [dB/dec] (high)",
      ],
    ],
  },
};
