/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Definitions / DomainTransformationTests
 */

import { getTermsArray } from "../../math/computerAlgebra/algebraicOperations.js";
import { Polynomial } from "../../math/computerAlgebra/dataTypes/polynomials.js";
import {
  c2dViaEulerBackwardDifferenceMethod,
  d2cViaEulerBackwardDifferenceMethod,
} from "../../math/domainTransformation/backwardDifferenceMethod.js";
import {
  c2dViaTustinBilinearMethod,
  d2cViaTustinBilinearMethod,
} from "../../math/domainTransformation/bilinearMethod.js";

//continuous tf
const ctf1 = [new Polynomial("s", [5]), new Polynomial("s", [2, 12, 8])];
const ctf1Norm = [
  new Polynomial("s", [1]),
  new Polynomial("s", [0.4, 2.4, 1.6]),
];
const ctf1Numer = getTermsArray(ctf1[0]);
const ctf1Denom = getTermsArray(ctf1[1]);

//discrete tfs
const dtf1 = [
  new Polynomial("z", [1, 2, 1]),
  new Polynomial("z", [8, 0, -1.6]),
];
const dtf1Numer = getTermsArray(dtf1[0]);
const dtf1Denom = getTermsArray(dtf1[1]);

const dtf2 = [
  new Polynomial("z", [1, 2, 1]),
  new Polynomial("z", [209.6, -316.8, 113.6]),
];
const dtf2Numer = getTermsArray(dtf2[0]);
const dtf2Denom = getTermsArray(dtf2[1]);

const dtf3 = [
  new Polynomial("z", [1, 0, 0]),
  new Polynomial("z", [4.4, -3.2, 0.4]),
];
const dtf3Numer = getTermsArray(dtf3[0]);
const dtf3Denom = getTermsArray(dtf3[1]);

const dtf4 = [
  new Polynomial("z", [1, 0, 0]),
  new Polynomial("z", [65.6, -104, 40]),
];
const dtf4Numer = getTermsArray(dtf4[0]);
const dtf4Denom = getTermsArray(dtf4[1]);

export const domainTransformationTests = {
  test1: {
    description: `test1: c2dViaTustinBilinearMethod([${ctf1Numer}], [${ctf1Denom}], 1)`,
    assertion: [c2dViaTustinBilinearMethod(ctf1Numer, ctf1Denom, 1), dtf1],
  },

  test2: {
    description: `test2: d2cViaTustinBilinearMethod([${dtf1Numer}], [${dtf1Denom}], 1)`,
    assertion: [d2cViaTustinBilinearMethod(dtf1Numer, dtf1Denom, 1), ctf1Norm],
  },

  test3: {
    description: `test3: c2dViaTustinBilinearMethod([${ctf1Numer}], [${ctf1Denom}], 0.1)`,
    assertion: [c2dViaTustinBilinearMethod(ctf1Numer, ctf1Denom, 0.1), dtf2],
  },

  test4: {
    description: `test4: d2cViaTustinBilinearMethod([${dtf2Numer}], [${dtf2Denom}], 0.1)`,
    assertion: [
      d2cViaTustinBilinearMethod(dtf2Numer, dtf2Denom, 0.1),
      ctf1Norm,
    ],
  },

  test5: {
    description: `test5: c2dViaEulerBackwardDifferenceMethod([${ctf1Numer}],[${ctf1Denom}], 1)`,
    assertion: [
      c2dViaEulerBackwardDifferenceMethod(ctf1Numer, ctf1Denom, 1),
      dtf3,
    ],
  },

  test6: {
    description: `test6: d2cViaEulerBackwardDifferenceMethod([${dtf3Numer}], [${dtf3Denom}], 1)`,
    assertion: [
      d2cViaEulerBackwardDifferenceMethod(dtf3Numer, dtf3Denom, 1),
      ctf1Norm,
    ],
  },

  test7: {
    description: `test7: c2dViaEulerBackwardDifferenceMethod([${ctf1Numer}], [${ctf1Denom}], 0.1)`,
    assertion: [
      c2dViaEulerBackwardDifferenceMethod(ctf1Numer, ctf1Denom, 0.1),
      dtf4,
    ],
  },

  test8: {
    description: `test8: d2cViaEulerBackwardDifferenceMethod([${dtf4Numer}], [${dtf4Denom}], 0.1)`,
    assertion: [
      d2cViaEulerBackwardDifferenceMethod(dtf4Numer, dtf4Denom, 0.1),
      ctf1Norm,
    ],
  },
};
