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
  isLargeScreenDevice,
  isMobileDevice,
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
import { sleep } from "../../../util/commons.js";

let maxLoopsOverAllElements;
let maxTriesPerElementInEachLoop;
let canvas;
let navbarHeight;

export const optimizeTopology = async function () {
  logMessages(["[CP-101] Optimize topology started"], "checkpoints");

  disableHistoricalStateStorage();

  //set the canvas size here, in case the window has been resized meanwhile
  //(it will delete all existing elements)
  resetCanvas();
  renderAllLines();
  canvas = getCanvas();
  navbarHeight = getNavbarHeight();

  for (let i = 1; i <= maxLoopsOverAllElements; i++) {
    for (let j = 0; j < domElements.length; j++) {
      await optimizeElementPositionStochastic(
        domElements[j],
        maxTriesPerElementInEachLoop
      );
    }
  }
  enableHistoricalStateStorage();
  getTopBlock().storeNewHistoricalState();

  logMessages(["[CP-102] Optimize topology finished"], "checkpoints");
};

/**
 * The optimization of an element's position is pursued via a stochastic process,
 * during which each new candidate position is evaluated against the current one
 */
const optimizeElementPositionStochastic = async function (
  domElement,
  maxSteps
) {
  const elementId = +domElement.dataset.elementId;

  //store current position
  const tfBoundingRect = domElement.getBoundingClientRect();
  let left = tfBoundingRect.left;
  let top = tfBoundingRect.top;
  let totalLineLengths = getTotalLengthsOfLinesConnectedToElement(elementId);
  // console.log(totalLineLengths);

  let step = 1;

  const assignHelper = async () => {
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
    const newOverlappingElementsNumber =
      computeOverlappingElementsNumber(domElement);

    step++;

    //reject new position, if it leads to element overlaps
    if (newOverlappingElementsNumber > 0) {
      revertPosition(domElement, left, top);
    } else {
      //new lines must be rendered here, in order for their lengths to be computed
      renderAllLines();

      const newTotalLineLengths =
        getTotalLengthsOfLinesConnectedToElement(elementId);

      //reject new position, if it leads to greater or equal total line lengths
      //(equality is also the case of unconnected elements, the position of which is not to be changed)
      if (newTotalLineLengths >= totalLineLengths) {
        revertPosition(domElement, left, top);
        renderAllLines();
      } else {
        //accept new position
        left = newLeft;
        top = newTop;
        totalLineLengths = newTotalLineLengths;
        // console.log(
        //   `Improved position: ${newTotalLineLengths}, step: ${step}, elementId: ${elementId}`
        // );

        //enable in order to display the process
        await sleep(20);
      }
    }

    if (step < maxSteps) await assignHelper();
  };

  await assignHelper();
};

//
// Helper functions
//

const computeOverlappingElementsNumber = (domElement) =>
  domElements.filter((x) =>
    x !== domElement
      ? elementsWithinDistance(
          x.getBoundingClientRect(),
          domElement.getBoundingClientRect(),
          marginAroundElements *
            (isLargeScreenDevice ? 4.5 : !isMobileDevice ? 3 : 1.75)
        )
      : false
  ).length;

const revertPosition = (domElement, left, top) => {
  domElement.style.left = left + "px";
  domElement.style.top = top + "px";
};

//
// Init
//
const init = function () {
  maxLoopsOverAllElements = 125;
  maxTriesPerElementInEachLoop = 15;
};

init();
