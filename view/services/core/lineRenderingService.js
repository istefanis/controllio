/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / LineDrawingService
 */

import { getElementFromElementId } from "../../../model/elementService.js";
import { indicativeTfHeight } from "../../../util/uiService.js";
import { getNavbarHeight } from "../../navbarView.js";
import {
  getCanvas,
  getCanvasContext,
  enableLineDrawingStyle,
} from "./canvasService.js";

const optimizeTopologyButton = document.getElementById(
  "optimize-topology-button"
);

/**
 * Array storing all the lineViews
 */
let lineViews = [];

export const getLineViewsNumber = () => lineViews.length;

export const registerLineView = function (lineView) {
  lineViews.push(lineView);
  if (lineViews.length === 1) {
    optimizeTopologyButton.disabled = false;
  }
};

export const resetLineRenderingService = function () {
  lineViews = [];
};

export const renderAllLines = function () {
  getCanvasContext().clearRect(0, 0, getCanvas().width, getCanvas().height);
  enableLineDrawingStyle();
  lineViews.forEach((x) => x.render());
};

export const removeLineRender = function (element1Id, element2Id) {
  //remove block connection too
  getElementFromElementId(element1Id)
    .getBlock()
    .removeConnection(element1Id, element2Id);

  lineViews = lineViews.filter(
    (x) => !x.isLineConnectingElements(element1Id, element2Id)
  );

  //disable optimize topology button if there are no lines left
  if (lineViews.length === 0) {
    optimizeTopologyButton.disabled = true;
  }

  renderAllLines();
};

//
// Line drawing
//
const taxicabManhattanLinesEnabled = true;

export const drawLineWithArrow = function (startX, startY, endX, endY) {
  //adjustment for navbar height:
  const navbarHeight = getNavbarHeight();
  startY -= navbarHeight;
  endY -= navbarHeight;

  let lineLength;

  const canvasContext = getCanvasContext();
  canvasContext.beginPath();

  //draw line
  canvasContext.moveTo(startX, startY);
  let lineAngle;

  if (!taxicabManhattanLinesEnabled) {
    //mixed taxicab/'Manhattan' & straight line path
    lineAngle = 0;
    const dx = 15;

    canvasContext.lineTo(startX + dx, startY);
    canvasContext.lineTo(endX - dx, endY);
    canvasContext.lineTo(endX, endY);
    lineLength =
      dx + Math.sqrt((endX - startX - 2 * dx) ** 2 + (endY - startY) ** 2) + dx;
  } else {
    const dx = 15;
    const dy = 5;

    if (endX > startX + 2 * dx) {
      if (Math.abs(endY - startY) > 10) {
        //taxicab/'Manhattan' line path (large vertical difference case)
        // console.log("line1");
        lineAngle = 0;
        const midX = startX + (endX - startX) / 2;
        canvasContext.lineTo(midX, startY);
        canvasContext.lineTo(midX, endY);
        canvasContext.lineTo(endX, endY);
        lineLength = Math.abs(endX - startX) + Math.abs(endY - startY);
      } else {
        //straight line (small vertical difference case)
        // console.log("line2");
        lineAngle = Math.atan2(endY - startY, endX - startX);
        canvasContext.lineTo(endX, endY);
        lineLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      }
    } else {
      //taxicab/'Manhattan' line path (large vertical difference case)
      lineAngle = 0;
      let midY = startY + (endY - startY) / 2;

      //enhancements, so that lines do not overlap
      const canvasMargin = 10; //so that such lines are not drawn outside the canvas
      const elementMargin = (2 / 3) * indicativeTfHeight; //so that such lines are not drawn over the elements
      if (startY > endY) {
        if (Math.abs(startY - endY) < 2 * elementMargin) {
          // console.log("line3");
          midY = Math.min(midY - elementMargin, endY - elementMargin);
        } else {
          // console.log("line4");
          midY = Math.max(
            canvasMargin,
            endY + elementMargin,
            midY - (startX > endX + 200 ? ((startX - endX) / 30) * dy : dy)
          );
        }
      } else {
        if (Math.abs(startY - endY) < 2 * elementMargin) {
          // console.log("line5");
          midY = Math.max(midY + elementMargin, endY + elementMargin);
        } else {
          // console.log("line6");
          midY = Math.min(
            window.innerHeight - navbarHeight - canvasMargin,
            endY - elementMargin,
            midY + (startX > endX + 200 ? ((startX - endX) / 30) * dy : dy)
          );
        }
      }
      canvasContext.lineTo(startX + dx, startY);
      canvasContext.lineTo(startX + dx, midY);
      canvasContext.lineTo(endX - dx, midY);
      canvasContext.lineTo(endX - dx, endY);
      canvasContext.lineTo(endX, endY);
      lineLength = Math.abs(endX - startX) + Math.abs(endY - startY);
    }
  }

  //draw arrowhead
  const arrowheadSideLength = 7;
  const arrowHead = new Path2D();
  arrowHead.moveTo(endX, endY);
  arrowHead.lineTo(
    endX - arrowheadSideLength * Math.cos(lineAngle + Math.PI / 6),
    endY - arrowheadSideLength * Math.sin(lineAngle + Math.PI / 6)
  );
  arrowHead.lineTo(
    endX - arrowheadSideLength * Math.cos(lineAngle - Math.PI / 6),
    endY - arrowheadSideLength * Math.sin(lineAngle - Math.PI / 6)
  );
  arrowHead.moveTo(endX, endY);
  arrowHead.closePath();
  canvasContext.fill(arrowHead);
  canvasContext.stroke();

  return lineLength;
};

export const getTotalLengthsOfLinesConnectedToElement = function (elementId) {
  return lineViews
    .filter((x) => x.isLineConnectedToElement(elementId))
    .map((x) => x.getLineLength())
    .reduce((acc, x) => acc + x, 0);
};
