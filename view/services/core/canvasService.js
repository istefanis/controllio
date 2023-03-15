/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / CanvasService
 */

const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");

export const getCanvas = () => canvas;
export const getCanvasContext = () => canvasContext;

const navbar = document.getElementById("navbar");

/**
 * Reset the whole canvas (deleting existing elements) to new dimensions
 */
const setCanvasSize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - navbar.getBoundingClientRect().height;
};

export const resetCanvas = () => {
  setCanvasSize();
  canvasContext.clearRect(0, 0, getCanvas().width, getCanvas().height);
};

export const enableLineDrawingStyle = function () {
  const canvasContext = getCanvasContext();
  canvasContext.strokeStyle = "black";
  canvasContext.lineWidth = 0.5;
};

export const enableSelectionDrawingStyle = function () {
  const canvasContext = getCanvasContext();
  canvasContext.strokeStyle = "green";
  canvasContext.lineWidth = 1.0;
};

//
// Init
//
const init = function () {
  resetCanvas();
};

init();
