/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / Plots.test
 */

// Any '*.test.js' files like this are automatically discovered and executed by Jest.
// This file is not imported anywhere so as not to be executed regularly

import { findComplexRootsOfPolynomial } from "../../math/numericalAnalysis/numericalAnalysisService.js";
import BodePlot from "../../view/plots/bodePlot.js";
import { plotsTests } from "../definitions/plotsTests.js";

const runPlotsJestTest = (t) => {
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
    test(`[TE-03] ${
      t.description +
      "\n" +
      assertionsEvaluated
        .map((a, i) =>
          assertionsEvaluated[i][3]
            ? `${a[0]} ~= ${assertionsEvaluated[i][2]}`
            : `${a[0]} === ${assertionsEvaluated[i][2]}`
        )
        .join(",\n")
    }`, () => {
      assertionsEvaluated.forEach((a) => {
        const actualValue = a[1];
        const expectedValue = a[2];
        const assertionTolerance = a[3];
        if (assertionTolerance) {
          expect(Math.abs(expectedValue - actualValue)).toBeLessThan(
            assertionTolerance
          );
        } else {
          expect(actualValue).toEqual(expectedValue);
        }
      });
    });
  }
};

//
// Init
//
const init = function () {
  for (let test of Object.values(plotsTests)) {
    runPlotsJestTest(test);
  }
};

init();
