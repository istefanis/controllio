/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Script
 */

// import first to initialize required components
import * as computerAlgebraService from "./math/computerAlgebra/computerAlgebraService.js";
import * as gridView from "./view/mainView.js";

import { Block } from "./model/elements/block.js";
import {
  mergeFeedbackLoopTest1,
  splitTfIntoSingleOutputTfsTest1,
  mergeSerialAddersTest1,
  mergeParallelTfsTest1,
  circuit1,
} from "./model/tests/circuitExamples.js";

//
// Top block definition (elements are stored there)
//
let topBlock;
export const getTopBlock = () => topBlock;

// circuit example
topBlock = circuit1(new Block());
