/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / LineDrawingService
 */

import { getElementFromElementId } from "../../../model/elementService.js";
import { getNavbarHeight } from "../../navbarView.js";
import {
  getCanvas,
  getCanvasContext,
  enableLineDrawingStyle,
} from "./canvasService.js";

let lineViews = [];

export const registerLineView = function (lineView) {
  lineViews.push(lineView);
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
    if (endX > startX) {
      if (Math.abs(endY - startY) > 10) {
        //taxicab/'Manhattan' line path (large vertical difference case)
        lineAngle = 0;
        const midX = startX + (endX - startX) / 2;
        canvasContext.lineTo(midX, startY);
        canvasContext.lineTo(midX, endY);
        canvasContext.lineTo(endX, endY);
        lineLength = Math.abs(endX - startX) + Math.abs(endY - startY);
      } else {
        //straight line (small vertical difference case)
        lineAngle = Math.atan2(endY - startY, endX - startX);
        canvasContext.lineTo(endX, endY);
        lineLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      }
    } else {
      //taxicab/'Manhattan' line path (large vertical difference case)
      lineAngle = 0;
      let midY = startY + (endY - startY) / 2;

      const dx = 15;
      const dy = 5;
      //micro-enhancement, so that some lines do not overlap:
      if (startY > endY) {
        midY -= startX > endX + 200 ? ((startX - endX) / 30) * dy : dy;
      } else {
        midY += startX > endX + 200 ? ((startX - endX) / 30) * dy : dy;
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
