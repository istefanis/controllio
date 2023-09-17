/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Script
 */

// Import these first to initialize required components
import * as computerAlgebraService from "./math/computerAlgebra/computerAlgebraService.js";
import * as gridView from "./view/mainView.js";

import { Block } from "./model/elements/block.js";

// Import few circuit examples
import {
  mergeFeedbackLoopTest1,
  splitTfIntoSingleOutputTfsTest1,
  mergeSerialAddersTest1,
  mergeParallelTfsTest1,
  circuit1,
} from "./test/simplificationAlgorithmsTests.js";
import { runAllTests } from "./test/testService.js";

//
// Top block definition (the circuit elements are stored inside this block)
//
let topBlock;
export const getTopBlock = () => topBlock;

//
// Check that external JS libraries have been loaded
//
if (!window.functionPlot) {
  // Display 'JS libraries not loaded' notification
  const jsLibrariesNotLoadedNotificationMarkup = `
    <section class="js-disabled-notification">
      <h2>Please enable the loading of external JavaScript libraries in your browser to run Controllio!</h2>
    </section>
  `;
  document.body.insertAdjacentHTML(
    "afterbegin",
    jsLibrariesNotLoadedNotificationMarkup
  );
} else {
  // Run all tests (optional)
  // await runAllTests();

  // Display one of the circuit examples
  topBlock = circuit1(new Block());
}
