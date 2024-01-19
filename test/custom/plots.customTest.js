/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / Plots.customTest
 */

import { findComplexRootsOfPolynomial } from "../../math/numericalAnalysis/numericalAnalysisService.js";
import { sleep } from "../../util/commons.js";
import { logMessages } from "../../util/loggingService.js";
import BodePlot from "../../view/plots/bodePlot.js";
import { plotsTests } from "../definitions/plotsTests.js";

const runPlotsCustomTest = (t) => {
  //computation of Bode curve points & characteristic numbers
  const { magnitudeCurvePoints, phaseCurvePoints, characteristicNumbers } =
    new BodePlot(
      null,
      t.numeratorTermsArray,
      t.denominatorTermsArray,
      findComplexRootsOfPolynomial(t.numeratorTermsArray),
      findComplexRootsOfPolynomial(t.denominatorTermsArray)
    );
  // console.log(phaseCurvePoints);

  //evaluation of assertions using the computed data
  const assertionsEvaluated = t.assertions(
    magnitudeCurvePoints,
    phaseCurvePoints,
    characteristicNumbers
  );

  if (assertionsEvaluated.length > 0) {
    const testCondition = assertionsEvaluated.every((a) => {
      const actualValue = a[1];
      const expectedValue = a[2];
      const assertionTolerance = a[3];
      return assertionTolerance
        ? Math.abs(expectedValue - actualValue) < assertionTolerance
        : actualValue === expectedValue;
    });

    logMessages(
      [
        `[TE-03] ` +
          `%c ${testCondition ? "success" : "failure"} ` +
          `%c - ${
            t.description +
            "\n" +
            assertionsEvaluated
              .map((a, i) =>
                assertionsEvaluated[i][3]
                  ? `${a[0]} ~= ${assertionsEvaluated[i][2]}`
                  : `${a[0]} === ${assertionsEvaluated[i][2]}`
              )
              .join(",\n")
          }`,
        `background: ${testCondition ? "#00aa00" : "#dd0000"}; color: #fff`,
        `background: #fff; color: #000`,
      ],
      "tests-css"
    );
  }
};

export const runPlotsCustomTests = async function () {
  logMessages([`[TE-01] Plots tests start`], "tests");
  for (let test of Object.values(Object.values(plotsTests))) {
    runPlotsCustomTest(test);
    await sleep(100);
  }
  logMessages([`[TE-05] Plots tests end`], "tests");
};
