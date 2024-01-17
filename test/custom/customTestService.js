/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / CustomTestService
 */

import { sleep } from "../../util/commons.js";
import { getLogMode, setLogMode } from "../../util/loggingService.js";
import { runComputerAlgebraCustomTests } from "../computerAlgebra.test.js";
import { runPlotsCustomTests } from "../plots.test.js";
import { runSimplificationAlgorithmsCustomTests } from "../simplificationAlgorithms.test.js";

export const runAllCustomTests = async function () {
  const logMode = getLogMode();
  setLogMode("null");

  runComputerAlgebraCustomTests();
  runPlotsCustomTests();
  await runSimplificationAlgorithmsCustomTests();
  await sleep(1000);

  setLogMode(logMode); //revert it to its previous value
};
