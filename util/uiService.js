/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / UIService
 */

//
// Common dimensions
//
export const indicativeTfWidth = 120;
export const indicativeTfHeight = 60;
export const adderWidth = 24;
export const adderHeight = 24;

export const marginAroundElements = 30;

export const maxUtilizedCanvasWidth = 1440;
export const maxUtilizedCanvasHeight = 960;

//
// Check whether the application runs on a touchscreen or mobile device
//
export let isTouchScreenDevice = navigator.maxTouchPoints > 0;
export let isMobileDevice =
  window.innerWidth < 1024 && window.innerHeight < 1280; //width is more important in determining what should be displayed
export let isLargeScreenDevice = window.innerWidth >= 1920;

/**
 * Check whether a selection 'bounding client rectangle'
 * contains an element 'bounding client rectangle'
 */
export const selectionEncompasesElement = function (
  selectionBoundRect,
  elementBoundRect
) {
  const elementMiddleX = (elementBoundRect.left + elementBoundRect.right) / 2;
  const elementMiddleY = (elementBoundRect.bottom + elementBoundRect.top) / 2;
  return (
    selectionBoundRect.left < elementMiddleX &&
    selectionBoundRect.right > elementMiddleX &&
    selectionBoundRect.top < elementMiddleY &&
    selectionBoundRect.bottom > elementMiddleY
  );
};

export const elementsWithinDistance = function (
  element1BoundRect,
  element2BoundRect,
  distance
) {
  return !(
    element1BoundRect.left > element2BoundRect.right + distance ||
    element1BoundRect.right + distance < element2BoundRect.left ||
    element1BoundRect.top > element2BoundRect.bottom + distance ||
    element1BoundRect.bottom + distance < element2BoundRect.top
  );
};

export const elementsOverlap = (element1BoundRect, element2BoundRect) =>
  elementsWithinDistance(element1BoundRect, element2BoundRect, 0);

//
// Element style helper functions
//
export const translateElement = function (x, y, element) {
  element.style.top = element.offsetTop - y + "px";
  element.style.left = element.offsetLeft - x + "px";
};

export const makeElementActive = (element) => {
  element.classList.add("element-active");
};

export const makeElementInactive = (element) => {
  element.classList.remove("element-active");
};

export const makeElementExpanded = (element) => {
  element.classList.add("element-expanded");
};

export const makeElementUnexpanded = (element) => {
  element.classList.remove("element-expanded");
};

export const giveElementAttention = (element) =>
  element.classList.add("element-attention");

export const removeElementAttention = (element) =>
  element.classList.remove("element-attention");

export const changeCursorStyle = (styleString, element) =>
  (element.style.cursor = styleString);

export const makeButtonActive = (button) => {
  button.classList.add("button-active");
};

export const makeButtonInActive = (button) => {
  button.classList.remove("button-active");
};

export const makeElementHidden = (element) => {
  element.classList.add("hidden");
};

export const makeElementUnhidden = (element) => {
  element.classList.remove("hidden");
};

export const makeElementFontSizeSmaller = (element) => {
  element.classList.add("font-size-smaller");
};

export const makeElementFontSizeNormal = (element) => {
  element.classList.remove("font-size-smaller");
};

/**
 * Increase the element's z-index, to bring it to the front
 */
export const moveΤοForeground = function (element) {
  element.style.zIndex = 100;
};

/**
 * Reset the element's z-index
 */
export const moveToGroundLevel = function (element) {
  element.style.zIndex = 0;
};
