/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / MockingService
 */

import { roundDecimal } from "../../../util/commons.js";

/**
 * Updates a DOM element's mocked getBoundingClientRect() function.
 * Used when the latter is not available (ex. when testing with Jest)
 *
 * @param {*} domElement
 * @param {Object} newValuesObject an object that contains the new values of only those parameters updated (ex. width)
 */
export const updateMockedGetBoundingClientRect = function (
  domElement,
  newValuesObject
) {
  const boundingClientRect = domElement.getBoundingClientRect();
  const oldWidth = boundingClientRect.width;
  const oldHeight = boundingClientRect.height;
  const oldTop = boundingClientRect.top;
  const oldLeft = boundingClientRect.left;
  const oldRight = boundingClientRect.right;
  const oldBottom = boundingClientRect.bottom;

  domElement.getBoundingClientRect = function () {
    return {
      width: newValuesObject.width || oldWidth,
      height: newValuesObject.height || oldHeight,
      top: roundDecimal(newValuesObject.top, 3) || oldTop,
      left: roundDecimal(newValuesObject.left, 3) || oldLeft,
      right: newValuesObject.right || oldRight,
      bottom: newValuesObject.width || oldBottom,
      isMocked: true,
    };
  };
};
