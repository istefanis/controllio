/*
 * Controllio · Open source web drafting table for studying control systems
 */

import { roundDecimal } from "../../../util/commons.js";
import {
  scaleReferenceDimensionsAfterZoom,
  getZoomFactor,
  setZoomFactor,
} from "../../../util/uiService.js";
import { adjustAllElementPositionsAfterZoom } from "./elementRenderingService.js";
import { renderAllLines } from "./lineRenderingService.js";

/*
 * View / Services / Core / ZoomingService
 */

// the (absolute) zoom factor is stored inside 'util/uiService' to avoid circular dependencies

let minZoomFactor = 0.5;
let maxZoomFactor = 1.5;
let zoomFactorIncrementStep = 0.05;

export const resetZoom = () => {
  //compute new relativeZoomFactor
  const lastZoomFactor = getZoomFactor();
  const zoomFactor = 1;
  setZoomFactor(zoomFactor);
  const relativeZoomFactor = roundDecimal(
    1 + (zoomFactor - lastZoomFactor) / lastZoomFactor,
    2
  );

  //enable zoom buttons
  zoomInButton.disabled = false;
  zoomOutButton.disabled = false;

  scaleElementsAndLinesAfterZoom(zoomFactor, relativeZoomFactor);
};

const scaleElementsAndLinesAfterZoom = (zoomFactor, relativeZoomFactor) => {
  //scale dimensions defined in CSS
  document.documentElement.style.setProperty("--zoom-factor", zoomFactor);

  //scale UI reference dimensions
  scaleReferenceDimensionsAfterZoom(relativeZoomFactor);

  //adjust all element positions
  adjustAllElementPositionsAfterZoom(relativeZoomFactor);

  renderAllLines();
};

//
// Zoom-in button
//
const zoomInButton = document.getElementById("zoom-in-button");
zoomInButton.addEventListener("click", function (e) {
  if (getZoomFactor() + zoomFactorIncrementStep <= maxZoomFactor) {
    //compute new zoomFactor & relativeZoomFactor
    const lastZoomFactor = getZoomFactor();
    const zoomFactor = roundDecimal(
      lastZoomFactor + zoomFactorIncrementStep,
      2
    );
    setZoomFactor(zoomFactor);
    const relativeZoomFactor = roundDecimal(
      1 + (zoomFactor - lastZoomFactor) / lastZoomFactor,
      2
    );

    //enable/disable zoom buttons
    zoomOutButton.disabled = false;
    if (zoomFactor === maxZoomFactor) {
      zoomInButton.disabled = true;
    }

    scaleElementsAndLinesAfterZoom(zoomFactor, relativeZoomFactor);
  }
});

//
// Zoom-out button
//
const zoomOutButton = document.getElementById("zoom-out-button");
zoomOutButton.addEventListener("click", function (e) {
  if (getZoomFactor() - zoomFactorIncrementStep >= minZoomFactor) {
    //compute new zoomFactor & relativeZoomFactor
    const lastZoomFactor = getZoomFactor();
    const zoomFactor = roundDecimal(
      lastZoomFactor - zoomFactorIncrementStep,
      2
    );
    setZoomFactor(zoomFactor);
    const relativeZoomFactor = roundDecimal(
      1 + (zoomFactor - lastZoomFactor) / lastZoomFactor,
      2
    );

    //enable/disable zoom buttons
    zoomInButton.disabled = false;
    if (zoomFactor === minZoomFactor) {
      zoomOutButton.disabled = true;
    }

    scaleElementsAndLinesAfterZoom(zoomFactor, relativeZoomFactor);
  }
});

export const disableZoomButtons = () => {
  zoomInButton.disabled = true;
  zoomOutButton.disabled = true;
};

/**
 * Enable the zoom buttons, if the conditions required are met
 */
export const enableZoomButtons = () => {
  const zoomFactor = getZoomFactor();
  if (zoomFactor !== maxZoomFactor) {
    zoomInButton.disabled = false;
  }
  if (zoomFactor !== minZoomFactor) {
    zoomOutButton.disabled = false;
  }
};
