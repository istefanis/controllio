/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / ElementSelectingAndDraggingService
 */

import {
  selectionEncompasesElement,
  translateElement,
  makeElementActive,
  makeElementInactive,
  changeCursorStyle,
  moveΤοForeground,
  moveToGroundLevel,
  makeElementExpanded,
  makeButtonActive,
  makeButtonInActive,
} from "../../../util/uiService.js";
import {
  getCanvasContext,
  resetCanvas,
  enableSelectionDrawingStyle,
} from "./canvasService.js";
import {
  openOrUpdateElementAnalysisWindow,
  closeElementAnalysisWindow,
} from "../../elementAnalysisWindowView.js";
import { drawLineWithArrow, renderAllLines } from "./lineRenderingService.js";
import {
  deleteElement,
  getElementFromElementId,
} from "../../../model/elementService.js";
import { connect } from "../../../model/elementConnectionService.js";
import { getNavbarHeight } from "../../navbarView.js";
import { enableHistoricalStateStorage } from "../../../model/blockStateService.js";

let currentElement; //single selected element
let isDraggingActive = false;
let cursorX = 0;
let cursorY = 0;
let translateX = 0;
let translateY = 0;

let initialCursorX = 0;
let initialCursorY = 0;

let allElements = [];
let selectedElements = [];

let expandedElement;
let anyElementCanBeExpanded = true;
let elementToBeUnexpanded;

let newlyCreatedElement;

let newConnectionMode;
let newConnectionElement1;
let newConnectionElement2;

const canvasContext = getCanvasContext();
let navbarHeight;

const deleteButton = document.getElementById("delete-button");

//
// A. Exports to other modules for interacting with this Service
//

export const setExpandedElement = (element) => {
  expandedElement = element;
  deleteButton.disabled = false;
};

//there can be elements that are displayed as active, but not counted among selected
//(newly created tfs in touchscreen devices are such, so that their analysis window
//can be opened with a single touch)
export const resetActiveElements = function () {
  allElements = Array.from(document.querySelectorAll(".element"));
  allElements.forEach(makeElementInactive);
};

export const resetExpandedElements = function () {
  if (expandedElement) {
    closeElementAnalysisWindow();
    moveToGroundLevel(expandedElement);
    expandedElement = null;
    deleteButton.disabled = true;
  }
};

export const resetExpandedOrSelectedElements = function () {
  resetSelectedElements();
  resetExpandedElements();
};

export const deleteExpandedOrSelectedElements = function () {
  if (expandedElement) {
    const element = getElementFromElementId(+expandedElement.dataset.elementId);
    closeElementAnalysisWindow();
    deleteElement(element);
    expandedElement = null;
    deleteButton.disabled = true;
  } else if (selectedElements.length !== 0) {
    const block = getElementFromElementId(
      +selectedElements[0].dataset.elementId
    ).getBlock();
    selectedElements.forEach((x) => {
      const element = getElementFromElementId(+x.dataset.elementId);
      deleteElement(element, true);
    });
    block.storeNewHistoricalState();
    selectedElements = [];
    deleteButton.disabled = true;
  }
};

export const setNewlyCreatedElement = (element) => {
  newlyCreatedElement = element;
  if (element !== null) {
    expandedElement = element;
    currentElement = element;
    selectedElements = [];
    isDraggingActive = true;
    cursorX =
      element.getBoundingClientRect().left +
      element.getBoundingClientRect().width / 2;
    cursorY =
      element.getBoundingClientRect().top +
      element.getBoundingClientRect().height / 2;
    makeElementExpanded(element);
  }
};

export const getNewlyCreatedElement = () => newlyCreatedElement;

//also used internally:
export const toggleNewConnectionMode = () => {
  closeElementAnalysisWindow();
  const newConnectionButton = document.getElementById("connection-button");

  if (!newConnectionMode) {
    makeButtonActive(newConnectionButton);
    // changeCursorStyle("crosshair", grid);
    document
      .querySelectorAll(".element")
      .forEach((x) => changeCursorStyle("crosshair", x));

    newConnectionMode = true;
    selectedElements = [];
    deleteButton.disabled = true;
    isDraggingActive = false;
  } else {
    makeButtonInActive(newConnectionButton);
    // changeCursorStyle("default", grid);
    document
      .querySelectorAll(".element")
      .forEach((x) => changeCursorStyle("pointer", x));
    newConnectionMode = null;

    if (newConnectionElement1) {
      makeElementInactive(newConnectionElement1);
    }
    newConnectionElement1 = null;
    newConnectionElement2 = null;
  }
};

//
// B. Main callback functions of the Service
//

/**
 * Invoked when the mouse or touch 'click' is initiated
 */
export const startSelectionOrDrag = function (e) {
  //stop propagation to other overlappping elements
  e.stopPropagation();

  //set the canvas size here, in case the window has been resized meanwhile
  //(it will delete all existing elements)
  resetCanvas();
  renderAllLines();
  navbarHeight = getNavbarHeight();

  currentElement = e.target.closest(".element"); //will be reset at endSelectionOrDrag()
  if (newlyCreatedElement) {
    //just to escape the other 'if' clauses
  } else if (
    selectedElements.length > 0 &&
    currentElement &&
    selectedElements.includes(currentElement)
  ) {
    // console.log("start1");
    //existing selection area + single element click case (drag and drop multiple elements - phase 2)
    setCursorCoordinates(e);
    selectedElements.map(moveΤοForeground);

    //unexpand element when drag and drop multiple elements starts,
    //or when clicking in empty space
    if (expandedElement) {
      // console.log("start1-2");
      closeElementAnalysisWindow();
      moveToGroundLevel(expandedElement);
      if (currentElement !== expandedElement) {
        expandedElement = null;
        deleteButton.disabled = true;
      }
    }
  } else if (newConnectionMode && currentElement) {
    if (!newConnectionElement1) {
      newConnectionElement1 = currentElement;
      makeElementActive(newConnectionElement1);
    } else if (!newConnectionElement2) {
      const element2 = getElementFromElementId(
        +currentElement.dataset.elementId
      );

      newConnectionElement2 = currentElement;
      makeElementInactive(newConnectionElement1);

      //get JS objects from DOM elements
      const element1 = getElementFromElementId(
        +newConnectionElement1.dataset.elementId
      );

      //connect
      connect(element1, element2);
    }
  } else if (currentElement) {
    // console.log("start3");
    //single element selection case (drag and drop single element)
    resetActiveElements();
    resetSelectedElements();
    setCursorCoordinates(e);
    moveΤοForeground(currentElement);

    //unexpand element when drag and drop single element starts,
    //or when clicking in empty space
    if (expandedElement) {
      // console.log("start3-2");
      if (currentElement !== expandedElement) {
        elementToBeUnexpanded = expandedElement;
        expandedElement = null;
        deleteButton.disabled = true;
      }
    }
  } else {
    if (newConnectionMode) {
      toggleNewConnectionMode();
    }

    // console.log("start4");
    //new selection area case (drag and drop multiple elements - phase 1)
    allElements = Array.from(document.querySelectorAll(".element"));
    resetActiveElements();
    resetSelectedElements();
    setInitialCursorCoordinates(e);

    if (expandedElement) {
      //unexpand element when new selection area dragging starts
      // console.log("start4-2");
      moveToGroundLevel(expandedElement);
      closeElementAnalysisWindow();
      expandedElement = null;
      deleteButton.disabled = true;
    }
  }
  isDraggingActive = true;
};

/**
 * Invoked when the mouse is moved or when the touch point is dragged
 */
export const selectionOrDrag = function (e) {
  e.stopPropagation();
  // e.preventDefault();

  if (newlyCreatedElement) {
    // console.log("drag1");
    makeElementActive(newlyCreatedElement);
    changeCursorStyle("move", newlyCreatedElement);

    setTranslateCoordinates(e);
    setCursorCoordinates(e); // if (Math.abs(translateX) > 5 || Math.abs(translateY) > 5) {

    translateElement(translateX, translateY, newlyCreatedElement);

    renderAllLines();
  } else if (
    selectedElements.length > 0 &&
    currentElement &&
    isDraggingActive &&
    selectedElements.includes(currentElement)
  ) {
    //existing selection area + single element click case (drag and drop multiple elements - phase 2)
    // console.log("drag2");
    changeCursorStyle("move", currentElement);

    setTranslateCoordinates(e);
    setCursorCoordinates(e);

    selectedElements.forEach((x) => {
      translateElement(translateX, translateY, x);
    });

    renderAllLines();
  } else if (newConnectionMode && newConnectionElement1) {
    //calculate start & end points
    const newConnectionElement1BoundingRect =
      newConnectionElement1.getBoundingClientRect();

    const startX = newConnectionElement1BoundingRect.right;
    const startY =
      (newConnectionElement1BoundingRect.top +
        newConnectionElement1BoundingRect.bottom) /
      2;
    let endX;
    let endY;

    if (e.type === "touchstart" || e.type === "touchmove") {
      endX = e.touches[0].clientX;
      endY = e.touches[0].clientY;
    } else {
      endX = e.clientX;
      endY = e.clientY;
    }
    renderAllLines();
    drawLineWithArrow(startX, startY, endX, endY);
  } else if (currentElement && isDraggingActive) {
    //single element selection case (drag and drop single element)

    if (currentElement !== expandedElement) {
      // console.log("drag3");
      anyElementCanBeExpanded = false;
      if (elementToBeUnexpanded) {
        // console.log("drag3-2");
        closeElementAnalysisWindow();
        moveToGroundLevel(elementToBeUnexpanded);
        elementToBeUnexpanded = null;
      }
    }

    makeElementActive(currentElement);
    changeCursorStyle("move", currentElement);

    setTranslateCoordinates(e);
    setCursorCoordinates(e); // if (Math.abs(translateX) > 5 || Math.abs(translateY) > 5) {

    translateElement(translateX, translateY, currentElement);

    renderAllLines();
  } else if (isDraggingActive) {
    //new selection area case (drag and drop multiple elements - phase 1)
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY =
      e.type === "touchmove"
        ? e.touches[0].clientY - navbarHeight
        : e.clientY - navbarHeight;
    cursorX = clientX - initialCursorX;
    cursorY = clientY - initialCursorY;

    //select elements
    selectedElements = allElements.filter((x) =>
      selectionEncompasesElement(
        {
          left: Math.min(initialCursorX, clientX),
          right: Math.max(initialCursorX, clientX),
          top: Math.min(initialCursorY, clientY) + navbarHeight,
          bottom: Math.max(initialCursorY, clientY) + navbarHeight,
        },
        x.getBoundingClientRect()
      )
    );
    if (selectedElements.length > 0) {
      deleteButton.disabled = false;
    } else if (selectedElements.length === 0) {
      deleteButton.disabled = true;
    }

    //make elements active or inactive
    allElements.forEach((x) =>
      selectedElements.includes(x)
        ? makeElementActive(x)
        : makeElementInactive(x)
    );

    //draw updated selection rectangle
    renderAllLines();
    enableSelectionDrawingStyle();

    canvasContext.strokeRect(initialCursorX, initialCursorY, cursorX, cursorY);
  }
};

/**
 * Invoked when the mouse or touch 'click' is completed
 */
export const endSelectionOrDrag = function (e) {
  e.preventDefault();
  e.stopPropagation();

  if (newConnectionMode) {
    if (newConnectionElement2) {
      toggleNewConnectionMode();
    }

    //existing selection area + single element click case (drag and drop multiple elements - phase 2)
  } else if (
    selectedElements.length > 0 &&
    currentElement &&
    selectedElements.includes(currentElement)
  ) {
    // console.log("end1");
    selectedElements.map(moveToGroundLevel);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;

    //single expanded element selection case (drag and drop single expanded element)
  } else if (
    currentElement &&
    anyElementCanBeExpanded &&
    currentElement === expandedElement
  ) {
    if (newlyCreatedElement) {
      // console.log("end2-1");
      enableHistoricalStateStorage();

      newlyCreatedElement = null;
      openOrUpdateElementAnalysisWindow(currentElement);

      //make buttons inactive
      const newTfButton = document.getElementById("tf-button");
      const newAdderButton = document.getElementById("adder-button");
      makeButtonInActive(newTfButton);
      makeButtonInActive(newAdderButton);
    }

    // console.log("end2");
    makeElementInactive(currentElement);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;
    anyElementCanBeExpanded = true;

    //expand another element by clicking on it
  } else if (
    currentElement &&
    anyElementCanBeExpanded &&
    elementToBeUnexpanded
  ) {
    // console.log("end3");
    expandedElement = currentElement;
    deleteButton.disabled = false;
    moveToGroundLevel(elementToBeUnexpanded);
    moveΤοForeground(expandedElement);
    changeCursorStyle("pointer", expandedElement);
    openOrUpdateElementAnalysisWindow(expandedElement);
    currentElement = null;
    anyElementCanBeExpanded = true;
    elementToBeUnexpanded = null;

    //expand new element by clicking on it
  } else if (currentElement && anyElementCanBeExpanded) {
    // console.log("end4");
    expandedElement = currentElement;
    deleteButton.disabled = false;
    makeElementInactive(expandedElement);
    moveΤοForeground(expandedElement);
    changeCursorStyle("pointer", expandedElement);
    openOrUpdateElementAnalysisWindow(expandedElement);
    currentElement = null;
    anyElementCanBeExpanded = true;

    //single element selection case (drag and drop single element)
  } else if (currentElement) {
    // console.log("end5");
    makeElementInactive(currentElement);
    moveToGroundLevel(currentElement);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;
    anyElementCanBeExpanded = true;

    //new selection area case (drag and drop multiple elements - phase 1) or click in empty space
  } else {
    // console.log("end6");
    renderAllLines();
    if (selectedElements.length > 0) {
      selectedElements.map(moveΤοForeground);
    }
  }
  isDraggingActive = false;
};

//
// C. Helper functions
//

const resetSelectedElements = function () {
  selectedElements.forEach(makeElementInactive);
  selectedElements = [];
  deleteButton.disabled = true;
};

/**
 * Set the selection area starting point coordinates
 */
const setInitialCursorCoordinates = function (e) {
  if (e.type === "touchstart") {
    initialCursorX = e.touches[0].clientX;
    initialCursorY = e.touches[0].clientY - navbarHeight;
  } else {
    initialCursorX = e.clientX;
    initialCursorY = e.clientY - navbarHeight;
  }
};

const setCursorCoordinates = function (e) {
  if (e.type === "touchstart" || e.type === "touchmove") {
    cursorX = e.touches[0].clientX;
    cursorY = e.touches[0].clientY;
  } else {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }
};

const setTranslateCoordinates = function (e) {
  if (e.type === "touchmove") {
    translateX = cursorX - e.touches[0].clientX;
    translateY = cursorY - e.touches[0].clientY;
  } else {
    translateX = cursorX - e.clientX;
    translateY = cursorY - e.clientY;
  }
};
