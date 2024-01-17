/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / ElementRenderingService
 */

import {
  adderHeight,
  adderWidth,
  elementsWithinDistance,
  marginAroundElements,
  indicativeTfHeight,
  maxUtilizedCanvasWidth,
  maxUtilizedCanvasHeight,
  getNavbarHeight,
} from "../../../util/uiService.js";
import { zoomFactor } from "./zoomingService.js";
import { getCanvas, resetCanvas } from "./canvasService.js";

export let domElements = [];

/**
 * Register a new Tf or Adder DOM element
 */
export const registerDomElement = function (domElement) {
  domElements.push(domElement);
};

/**
 * Remove elements from DOM
 */
export const removeRenderedElement = function (elementId) {
  domElements
    .filter((x) => x.dataset.elementId === "" + elementId)
    .map((x) => x.remove());
};

/**
 * Remove all rendered elements
 */
export const resetElementRenderingService = function () {
  domElements.forEach((x) => x.remove());
  domElements = [];
};

/**
 * Assign a position to a DOM element
 */
const generateNewElementPosition = function (
  domElement,
  elementWidth,
  elementHeight
) {
  let step = 0;

  resetCanvas();
  const canvas = getCanvas();
  const navbarHeight = getNavbarHeight();

  const assignHelper = () => {
    //assign a position to the element
    domElement.style.left =
      marginAroundElements +
      Math.random() *
        (Math.min(canvas.width, maxUtilizedCanvasWidth) -
          elementWidth -
          2 * marginAroundElements) +
      "px";
    domElement.style.top =
      marginAroundElements +
      Math.random() *
        (Math.min(canvas.height, maxUtilizedCanvasHeight) -
          elementHeight -
          2 * marginAroundElements) +
      navbarHeight +
      "px";

    step++;

    //check overlapping with any other element
    const overlapppingElements = domElements.filter((x) =>
      x !== domElement
        ? elementsWithinDistance(
            x.getBoundingClientRect(),
            domElement.getBoundingClientRect(),
            marginAroundElements
          )
        : false
    ).length;

    if (overlapppingElements > 0 && step < 100) {
      assignHelper();
    }
  };

  assignHelper();
};

export const generateNewTfPosition = (domTfElement) =>
  generateNewElementPosition(
    domTfElement,
    domTfElement.getBoundingClientRect().width,
    indicativeTfHeight
  );

export const generateNewAdderPosition = (domAdderElement) =>
  generateNewElementPosition(domAdderElement, adderWidth, adderHeight);

/**
 * Set an element's position to the one passed as input, as long as the element
 * fits inside the canvas dimensions; otherwise, generate a new position.
 *
 * Fitting inside canvas checks are skipped if skipChecks === true. or zoomFactor !== 1.
 *
 * @param {*} domElement
 * @param {*} position passed in a navbar height agnostic format
 * @param {*} skipChecks if true, skip fitting inside canvas checks
 */
export const setNewElementPosition = (domElement, position, skipChecks) => {
  const boundRect = domElement.getBoundingClientRect();
  if (
    skipChecks ||
    zoomFactor !== 1 ||
    (position.left + boundRect.width <= canvas.width - marginAroundElements &&
      position.top + boundRect.height <= canvas.height - marginAroundElements)
  ) {
    domElement.style.left = position.left + "px";
    domElement.style.top = position.top + getNavbarHeight() + "px";
  } else {
    generateNewElementPosition(domElement, boundRect.width, boundRect.height);
  }
};

export const adjustAllElementPositionsAfterZoom = (relativeZoomFactor) => {
  domElements.forEach((x) => {
    setNewElementPosition(
      x,
      {
        left: x.getBoundingClientRect().left * relativeZoomFactor,
        top:
          (x.getBoundingClientRect().top - getNavbarHeight()) *
          relativeZoomFactor,
      },
      true
    );
  });
};
