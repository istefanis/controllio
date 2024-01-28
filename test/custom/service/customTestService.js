/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Custom / Service / CustomTestService
 */

import { sleep } from "../../../util/commons.js";
import { getLogMode, setLogMode } from "../../../util/loggingService.js";
import { runComputerAlgebraCustomTests } from "../computerAlgebra.customTest.js";
import { runPlotsCustomTests } from "../plots.customTest.js";
import { runSimplificationAlgorithmsCustomTests } from "../simplificationAlgorithms.customTest.js";
import { runViewServicesCustomTests } from "../viewServices.customTest.js";

export const runAllCustomTests = async function () {
  const logMode = getLogMode();
  setLogMode("null");

  await runComputerAlgebraCustomTests();
  await runPlotsCustomTests();
  await runSimplificationAlgorithmsCustomTests();
  await runViewServicesCustomTests();
  await sleep(1000);

  setLogMode(logMode); //revert it to its previous value
};
