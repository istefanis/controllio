/*
 * Controllio · Open source web drafting table for studying control systems
 */

import { roundDecimal } from "./commons.js";

/*
 * Util / UIService
 */

//
// UI reference dimensions
//
export let indicativeTfWidth = 120;
export let indicativeTfHeight = 60;
export let adderWidth = 24;
export let adderHeight = 24;

export let marginAroundElements = 30;

export let maxUtilizedCanvasWidth = 1440;
export let maxUtilizedCanvasHeight = 960;

export const scaleReferenceDimensionsAfterZoom = (relativeZoomFactor) => {
  indicativeTfWidth = roundDecimal(indicativeTfWidth * relativeZoomFactor, 2);
  indicativeTfHeight = roundDecimal(indicativeTfHeight * relativeZoomFactor, 2);
  adderWidth = roundDecimal(adderHeight * relativeZoomFactor, 2);
  adderHeight = roundDecimal(adderHeight * relativeZoomFactor, 2);

  marginAroundElements = roundDecimal(
    marginAroundElements * relativeZoomFactor,
    2
  );

  maxUtilizedCanvasWidth = roundDecimal(
    maxUtilizedCanvasWidth * relativeZoomFactor,
    2
  );
  maxUtilizedCanvasHeight = roundDecimal(
    maxUtilizedCanvasHeight * relativeZoomFactor,
    2
  );
};

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

export const getNavbarHeight = () =>
  document.getElementById("navbar").getBoundingClientRect().height;

//
// All DOM elements of class 'element'
// (stored here to avoid circular dependencies, since it is used by 'resetActiveElements()')
//
let allElements = [];
export const getAllElements = () => allElements;

//there can be elements that are displayed as active, but not counted among selected
//(newly created tfs in touchscreen devices are such, so that their analysis window
//can be opened with a single touch)
export const resetActiveElements = function () {
  allElements = Array.from(document.querySelectorAll(".element"));
  allElements.forEach(makeElementInactive);
};

export const moveAllElementsToGroundLevel = function () {
  Array.from(document.querySelectorAll(".element")).map(moveToGroundLevel);
};

//
// Stored here to avoid circular dependencies
//
let zoomFactor = 1; //absolute zoom factor
export const getZoomFactor = () => zoomFactor;
export const setZoomFactor = (newZoomFactor) => {
  zoomFactor = newZoomFactor;
};
