/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / ComputerAlgebraService
 */

import { loadSymbolicParamsOperations } from "./dataTypes/symbolicParams.js";
import { loadRealsOperations } from "./dataTypes/reals.js";
import { loadRatiosOperations } from "./dataTypes/ratios.js";
import { loadPolynomialsOperations } from "./dataTypes/polynomials.js";
import { runTests } from "./tests.js";
import { logMessages } from "../../util/loggingService.js";

//
// Init
//
const init = function () {
  loadSymbolicParamsOperations();
  loadRealsOperations();
  loadRatiosOperations();
  loadPolynomialsOperations();
  // runTests();
  // console.log(algebraicOperationsMap);

  logMessages(["[CP-02] Computer algebra operations loaded"], "checkpoints");
};

init();
