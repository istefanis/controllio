/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Core / ElementSelectingAndDraggingService
 */

import {
  getNavbarHeight,
  getAllElements,
  moveAllElementsToGroundLevel,
  resetActiveElements,
  selectionEncompasesElement,
  translateElement,
  makeElementActive,
  makeElementInactive,
  makeElementExpanded,
  makeElementUnexpanded,
  giveElementAttention,
  removeElementAttention,
  changeCursorStyle,
  moveΤοForeground,
  moveToGroundLevel,
  makeButtonActive,
  makeButtonInActive,
  toggledButtons,
} from "../../../util/uiService.js";
import {
  getCanvasContext,
  resetCanvas,
  enableSelectionDrawingStyle,
} from "./canvasService.js";
import {
  openOrUpdateElementAnalysisWindow,
  closeElementAnalysisWindow,
  setExpandedElement,
  getExpandedElement,
  resetExpandedElement,
} from "../../elementAnalysisWindowView.js";
import { drawLineWithArrow, renderAllLines } from "./lineRenderingService.js";
import {
  deleteElement,
  getElementFromElementId,
} from "../../../model/elementService.js";
import { connect } from "../../../model/elementConnectionService.js";
import {
  disableHistoricalStateStorage,
  enableHistoricalStateStorage,
} from "../../../model/blockStateService.js";
import { copyElement } from "../feature/elementCopyService.js";
import { continuousDiscreteTimeTransform } from "../feature/continuousDiscreteTimeTransformService.js";

let currentElement; //single selected DOM element
let isDraggingActive = false;
let cursorX = 0;
let cursorY = 0;
let translateX = 0;
let translateY = 0;

let initialCursorX = 0;
let initialCursorY = 0;

let selectedElements = [];

let anyElementCanBeExpanded = true;
let elementToBeUnexpanded;

let newlyCreatedElement;

let newConnectionMode;
let newConnectionElement1;
let newConnectionElement2;

const canvasContext = getCanvasContext();
let navbarHeight;

//
// A. Exports to other modules for interacting with this Service
//

export const resetExpandedOrSelectedElements = function () {
  resetSelectedElements();
  resetExpandedElement();
};

export const copyExpandedOrSelectedElements = function () {
  if (getExpandedElement()) {
    //single element case
    const element = getElementFromElementId(
      +getExpandedElement().dataset.elementId
    );
    closeElementAnalysisWindow();

    //store only one new block state for all changes
    const block = element.getBlock();
    disableHistoricalStateStorage();
    copyElement(element);
    moveAllElementsToGroundLevel();
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    resetExpandedOrSelectedElements();
  } else if (selectedElements.length !== 0) {
    //multiple elements case
    //store only one new block state for all changes
    const block = getElementFromElementId(
      +selectedElements[0].dataset.elementId
    ).getBlock();
    disableHistoricalStateStorage();
    selectedElements.forEach((x) => {
      const element = getElementFromElementId(+x.dataset.elementId);
      copyElement(element);
      moveAllElementsToGroundLevel();
    });
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    resetExpandedOrSelectedElements();
  }
};

export const transformExpandedOrSelectedTf = async function () {
  if (getExpandedElement()) {
    const e = getExpandedElement();
    const element = getElementFromElementId(+e.dataset.elementId);
    closeElementAnalysisWindow();

    //store only one new block state for all changes
    const block = element.getBlock();
    disableHistoricalStateStorage();
    giveElementAttention(e);
    await continuousDiscreteTimeTransform(element);
    removeElementAttention(e);
    moveAllElementsToGroundLevel();
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    resetExpandedOrSelectedElements();
  } else if (selectedElements.length !== 0) {
    //multiple elements case
    //store only one new block state for all changes
    const block = getElementFromElementId(
      +selectedElements[0].dataset.elementId
    ).getBlock();
    disableHistoricalStateStorage();
    const selectedElementsState = [...selectedElements];
    for (let se of selectedElementsState) {
      const element = getElementFromElementId(+se.dataset.elementId);
      if (element.isTf()) {
        giveElementAttention(se);
        await continuousDiscreteTimeTransform(element);
        removeElementAttention(se);
      }
      moveAllElementsToGroundLevel();
    }
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    resetExpandedOrSelectedElements();
  }
};

export const deleteExpandedOrSelectedElements = function () {
  if (getExpandedElement()) {
    //single element case
    const element = getElementFromElementId(
      +getExpandedElement().dataset.elementId
    );
    closeElementAnalysisWindow();

    //store only one new block state for all changes
    const block = element.getBlock();
    disableHistoricalStateStorage();
    deleteElement(element);
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    setExpandedElement(null);
    toggledButtons.forEach((x) => (x.disabled = true));
  } else if (selectedElements.length !== 0) {
    //multiple elements case
    //store only one new block state for all changes
    const block = getElementFromElementId(
      +selectedElements[0].dataset.elementId
    ).getBlock();
    disableHistoricalStateStorage();
    selectedElements.forEach((x) => {
      const element = getElementFromElementId(+x.dataset.elementId);
      deleteElement(element);
    });
    enableHistoricalStateStorage();
    block.storeNewHistoricalState();

    selectedElements = [];
    toggledButtons.forEach((x) => (x.disabled = true));
  }
};

export const setNewlyCreatedElement = (element) => {
  newlyCreatedElement = element;
  if (element !== null) {
    setExpandedElement(element);
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
    toggledButtons.forEach((x) => (x.disabled = true));
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
 * ('mousedown' or 'touchstart' event)
 */
export const startSelectionOrDrag = function (e) {
  //stop propagation to other overlappping elements
  e.stopPropagation();

  //reset the canvas, in case the window has been resized meanwhile (it will delete all existing lines)
  resetCanvas();
  renderAllLines();
  navbarHeight = getNavbarHeight();

  currentElement = e.target.closest(".element"); //will be reset at endSelectionOrDrag()
  if (newlyCreatedElement) {
    // console.log("start-1");
    //case: click on the grid to place a newly created element
    //(just to escape the other 'if' clauses)
  } else if (
    selectedElements.length > 0 &&
    currentElement &&
    selectedElements.includes(currentElement)
  ) {
    // console.log("start-2");
    //case: click on a single element, which is one of the elements already selected via area selection
    //(drag and drop of area selection elements - phase 2: translation of selected elements)

    setCursorCoordinates(e);
    selectedElements.map(moveΤοForeground);
  } else if (newConnectionMode && currentElement) {
    // console.log("start-3");
    //case: click on element to define an new connection

    if (!newConnectionElement1) {
      // console.log("start-3.1");
      //case: click on first element of the new connection

      newConnectionElement1 = currentElement;
      makeElementActive(newConnectionElement1);
    } else if (!newConnectionElement2) {
      // console.log("start-3.2");
      //case: click on second element of the new connection

      const element2 = getElementFromElementId(
        +currentElement.dataset.elementId
      );

      newConnectionElement2 = currentElement;
      makeElementInactive(newConnectionElement1);

      //get JS objects from DOM elements
      const element1 = getElementFromElementId(
        +newConnectionElement1.dataset.elementId
      );

      connect(element1, element2);
    }
  } else if (currentElement) {
    // console.log("start-4");
    //case: single element selection, or start of single element dragging (drag and drop of single element)
    // - elements may or may not be selected before

    resetActiveElements();
    resetSelectedElements();
    setCursorCoordinates(e);
    moveΤοForeground(currentElement);

    if (getExpandedElement() && currentElement !== getExpandedElement()) {
      // console.log("start-4.1");
      //case: click on a different element, while another one is already expanded
      //(the expanded element to be unexpanded if drag and drop starts)

      elementToBeUnexpanded = getExpandedElement();
      toggledButtons.forEach((x) => (x.disabled = true));
    }
  } else {
    // console.log("start-5");
    //case: click on empty space, or start a new area selection dragging
    //(drag and drop of area selection elements - phase 1: selection of elements)
    // - elements may or may not be selected before

    if (newConnectionMode) {
      // console.log("start-5.1");
      //case: click on empty space, or start a new area selection dragging,
      //which cancels the definition of a new connection between elements

      toggleNewConnectionMode();
    }

    resetActiveElements();
    resetSelectedElements();
    setInitialCursorCoordinates(e);

    if (getExpandedElement()) {
      // console.log("start-5.2");
      //case: element to be unexpanded,
      //after a click on empty space, or the start of a new area selection dragging

      moveToGroundLevel(getExpandedElement());
      closeElementAnalysisWindow();
      setExpandedElement(null);
      toggledButtons.forEach((x) => (x.disabled = true));
    }
  }
  isDraggingActive = true;
};

/**
 * Invoked when the mouse is moved or when the touch point is dragged
 * ('mousemove' or 'touchmove' event)
 */
export const selectionOrDrag = function (e) {
  e.stopPropagation();
  // e.preventDefault();

  if (newlyCreatedElement) {
    // console.log("drag-1");
    //case: translate a newly created element, before placing it on the grid

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
    // console.log("drag-2");
    //case: elements are selected via an area selection & are now being dragged, after a single element click
    //(drag and drop of area selection elements - phase 2: translation of selected elements)

    changeCursorStyle("move", currentElement);

    setTranslateCoordinates(e);
    setCursorCoordinates(e);

    selectedElements.forEach((x) => {
      translateElement(translateX, translateY, x);
    });

    renderAllLines();
  } else if (newConnectionMode && newConnectionElement1) {
    // console.log("drag-3");
    //case: translation of the mouse over the grid to define a new connection,
    //after the first/start element has been selected

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
    // console.log("drag-4");
    //case: single element dragging, after single element selection (drag and drop of single element)
    //(element is expanded or unexpanded)

    if (currentElement !== getExpandedElement()) {
      // console.log("drag-4.1");
      //case: dragging of an unexpanded element

      anyElementCanBeExpanded = false;
      if (elementToBeUnexpanded) {
        // console.log("drag-4.1.1");
        //case: start of dragging of an unexpanded element, while another element is still expanded
        //(this will run only once during a dragging, to unexpand the expanded element)

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
    // console.log("drag-5");
    //case: translation of the mouse over the grid to define a new area selection
    //(drag and drop of area selection elements - phase 1: selection of elements)

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY =
      e.type === "touchmove"
        ? e.touches[0].clientY - navbarHeight
        : e.clientY - navbarHeight;
    cursorX = clientX - initialCursorX;
    cursorY = clientY - initialCursorY;

    //select elements
    selectedElements = getAllElements().filter((x) =>
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
      toggledButtons.forEach((x) => (x.disabled = false));
    } else if (selectedElements.length === 0) {
      toggledButtons.forEach((x) => (x.disabled = true));
    }

    //make elements active or inactive
    getAllElements().forEach((x) =>
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
 * ('mouseup' or 'touchend' event)
 */
export const endSelectionOrDrag = function (e) {
  e.preventDefault();
  e.stopPropagation();

  if (newConnectionMode) {
    // console.log("end-1");
    //case: click on first element of the new connection

    if (newConnectionElement2) {
      // console.log("end-1.1");
      //case: click on second element of the new connection

      toggleNewConnectionMode();
    }
  } else if (
    selectedElements.length > 0 &&
    currentElement &&
    selectedElements.includes(currentElement)
  ) {
    // console.log("end-2");
    //case: end of dragging of elements selected via an area selection
    //(drag and drop of area selection elements - phase 2: translation of selected elements)

    selectedElements.map(moveToGroundLevel);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;
  } else if (
    currentElement &&
    anyElementCanBeExpanded &&
    currentElement === getExpandedElement()
  ) {
    // console.log("end-3");
    //case: end of dragging of single expanded element

    if (newlyCreatedElement) {
      // console.log("end-3.1");
      //case: end of placement of newly created element
      enableHistoricalStateStorage();

      newlyCreatedElement = null;
      openOrUpdateElementAnalysisWindow(currentElement);

      //make buttons inactive
      const newTfButton = document.getElementById("tf-button");
      const newAdderButton = document.getElementById("adder-button");
      makeButtonInActive(newTfButton);
      makeButtonInActive(newAdderButton);
    }

    makeElementInactive(currentElement);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;
    anyElementCanBeExpanded = true;
  } else if (
    currentElement &&
    anyElementCanBeExpanded &&
    elementToBeUnexpanded
  ) {
    // console.log("end-4");
    //case: expand another element by clicking on it

    setExpandedElement(currentElement);
    toggledButtons.forEach((x) => (x.disabled = false));
    moveToGroundLevel(elementToBeUnexpanded);
    makeElementUnexpanded(elementToBeUnexpanded);
    moveΤοForeground(getExpandedElement());
    changeCursorStyle("pointer", getExpandedElement());
    openOrUpdateElementAnalysisWindow(getExpandedElement());
    currentElement = null;
    anyElementCanBeExpanded = true;
    elementToBeUnexpanded = null;
  } else if (currentElement && anyElementCanBeExpanded) {
    // console.log("end-5");
    //case: expand new element by clicking on it (no other element is previously expanded)

    setExpandedElement(currentElement);
    toggledButtons.forEach((x) => (x.disabled = false));
    makeElementInactive(getExpandedElement());
    moveΤοForeground(getExpandedElement());
    changeCursorStyle("pointer", getExpandedElement());
    openOrUpdateElementAnalysisWindow(getExpandedElement());
    currentElement = null;
    anyElementCanBeExpanded = true;
  } else if (currentElement) {
    // console.log("end-6");
    //case: end of dragging of single unexpanded element

    makeElementInactive(currentElement);
    moveToGroundLevel(currentElement);
    changeCursorStyle("pointer", currentElement);

    //store state
    getElementFromElementId(+currentElement.dataset.elementId)
      .getBlock()
      .storeNewHistoricalState();

    currentElement = null;
    anyElementCanBeExpanded = true;
  } else {
    // console.log("end-7");
    //case: click on empty space, or end of new area selection dragging
    //(drag and drop of area selection elements - phase 1: selection of elements)

    renderAllLines();
    moveAllElementsToGroundLevel();

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
  toggledButtons.forEach((x) => (x.disabled = true));
};

/**
 * Set the area selection starting point coordinates
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
