/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Script
 */

// to run with NPM uncomment this:
// import "bootstrap-icons/font/bootstrap-icons.css";

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
import { functionPlot } from "./view/plots/plotService.js";
import { runAllTests } from "./test/testService.js";
import { getTopBlock, setTopBlock } from "./model/topBlockService.js";

// Top block definition (the circuit elements are stored inside this block)
let topBlock = getTopBlock();

//
// Check that external JS libraries have been loaded
//
if (!functionPlot) {
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
  //
  // Tests
  //

  // To run all tests at app start (optional) uncomment this.
  // Open the browser's console to see the results:
  // await runAllTests();

  // To run all tests manually from the browser's console anytime (optional) uncomment this.
  // Open the browser's console and execute "runAllTests()":
  // window.runAllTests = async () => {
  //   await runAllTests();
  //   setTopBlock(circuit1(new Block()));
  // };

  // Display one of the circuit examples
  setTopBlock(circuit1(new Block()));
}
