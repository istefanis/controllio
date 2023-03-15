/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / OptimizeTopologyService
 */

import { getTopBlock } from "../../../script.js";
import {
  disableHistoricalStateStorage,
  enableHistoricalStateStorage,
} from "../../../model/blockStateService.js";
import {
  elementsWithinDistance,
  marginAroundElements,
  maxUtilizedCanvasHeight,
  maxUtilizedCanvasWidth,
} from "../../../util/uiService.js";
import { getNavbarHeight } from "../../navbarView.js";
import { getCanvas, resetCanvas } from "../core/canvasService.js";
import { domElements } from "../core/elementRenderingService.js";
import {
  getTotalLengthsOfLinesConnectedToElement,
  renderAllLines,
} from "../core/lineRenderingService.js";
import { logMessages } from "../../../util/loggingService.js";

let maxLoopsOverAllElements;
let maxTriesPerElementInEachLoop;

export const optimizeTopology = async function () {
  logMessages(["[CP-101] Optimize topology started"], "checkpoints");

  disableHistoricalStateStorage();

  //set the canvas size here, in case the window has been resized meanwhile
  //(it will delete all existing elements)
  resetCanvas();
  renderAllLines();

  for (let i = 1; i <= maxLoopsOverAllElements; i++) {
    for (let j = 0; j < domElements.length; j++) {
      await optimizeElementPosition(
        domElements[j],
        maxTriesPerElementInEachLoop
      );
    }
  }
  enableHistoricalStateStorage();
  getTopBlock().storeNewHistoricalState();

  logMessages(["[CP-102] Optimize topology finished"], "checkpoints");
};

const optimizeElementPosition = async function (domElement, maxSteps) {
  const elementId = +domElement.dataset.elementId;

  let totalLineLengths = getTotalLengthsOfLinesConnectedToElement(elementId);
  // console.log(totalLineLengths);

  //store current position
  const tfBoundingRect = domElement.getBoundingClientRect();
  let left = tfBoundingRect.left;
  let top = tfBoundingRect.top;

  const computeOverlapppingElementsNumber = () =>
    domElements.filter((x) =>
      x !== domElement
        ? elementsWithinDistance(
            x.getBoundingClientRect(),
            domElement.getBoundingClientRect(),
            marginAroundElements * 3
          )
        : false
    ).length;

  const revertPosition = () => {
    //revert position
    domElement.style.left = left + "px";
    domElement.style.top = top + "px";
  };

  let step = 1;

  resetCanvas();
  const canvas = getCanvas();
  const navbarHeight = getNavbarHeight();

  const assignHelper = async () => {
    //enable in order to display the process
    // await sleep(1);

    //compute overlapping elements number (old position)
    const oldOverlapppingElementsNumber = computeOverlapppingElementsNumber();

    //assign a new position to the element
    const newLeft =
      marginAroundElements +
      Math.random() *
        (Math.min(canvas.width, maxUtilizedCanvasWidth) -
          2 * marginAroundElements -
          tfBoundingRect.width);
    const newTop =
      marginAroundElements +
      Math.random() *
        (Math.min(canvas.height, maxUtilizedCanvasHeight) -
          2 * marginAroundElements -
          tfBoundingRect.height) +
      navbarHeight;
    domElement.style.left = newLeft + "px";
    domElement.style.top = newTop + "px";

    //compute overlapping elements number (new position)
    const overlapppingElementsNumber = computeOverlapppingElementsNumber();

    step++;

    //accept new position, if it leads to fewer element overlaps
    if (overlapppingElementsNumber < oldOverlapppingElementsNumber) {
      renderAllLines();
      totalLineLengths = getTotalLengthsOfLinesConnectedToElement(elementId);
      left = newLeft;
      top = newTop;
      if (step < maxSteps) await assignHelper();
    }

    if (overlapppingElementsNumber > 0) {
      revertPosition();
      if (step < maxSteps) await assignHelper();
    }

    //new lines must be rendered here, in order for their lengths to be computed
    renderAllLines();

    const currentTotalLineLengths =
      getTotalLengthsOfLinesConnectedToElement(elementId);
    if (currentTotalLineLengths === totalLineLengths) {
    } else if (currentTotalLineLengths > totalLineLengths) {
      revertPosition();
    } else {
      // console.log(
      //   "Improved position: " +
      //     currentTotalLineLengths +
      //     ", step:" +
      //     step +
      //     ", elementId:" +
      //     elementId
      // );
      totalLineLengths = currentTotalLineLengths;
      left = newLeft;
      top = newTop;
    }

    if (step < maxSteps) await assignHelper();
  };

  await assignHelper();
};

//
// Init
//
const init = function () {
  maxLoopsOverAllElements = 100;
  maxTriesPerElementInEachLoop = 10;
};

init();
