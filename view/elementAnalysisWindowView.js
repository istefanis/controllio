/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / ElementAnalysisWindowView
 */

import { Polynomial } from "../math/computerAlgebra/dataTypes/polynomials.js";
import { Ratio } from "../math/computerAlgebra/dataTypes/ratios.js";
import {
  getDenominator,
  getNumerator,
  getTermsArray,
} from "../math/computerAlgebra/algebraicOperations.js";
import { getElementFromElementId } from "../model/elementService.js";
import { areEqualArrays, roundDecimal } from "../util/commons.js";
import {
  makeElementUnhidden,
  makeElementHidden,
  makeElementExpanded,
  makeElementUnexpanded,
} from "../util/uiService.js";
import { polynomialTermsArrayToStringWithoutCoeffs } from "../util/prettyPrintingService.js";
import BodePlot from "./plots/bodePlot.js";
import NyquistPlot from "./plots/nyquistPlot.js";

//
// Select DOM elements
//
const elementAnalysisWindow = document.querySelector(
  ".element-analysis-window"
);
const elementAnalysisWindowCloseButton = document.querySelector(
  ".element-analysis-window-close-button"
);
const elementAnalysisWindowContents = document.querySelector(
  ".element-analysis-window-contents"
);

const updateElementNumeratorInput = document.getElementById(
  "update-element-numerator-input"
);
const updateElementDenominatorInput = document.getElementById(
  "update-element-denominator-input"
);
const updateElementValueButton = document.querySelector(
  ".update-element-value-button"
);

const tabButtonsContainer = elementAnalysisWindowContents.querySelector(
  ".element-analysis-window-tab-buttons"
);
const tabButtons = Array.from(
  elementAnalysisWindowContents.getElementsByClassName("tab-button")
);
const tabcontent = Array.from(
  elementAnalysisWindowContents.getElementsByClassName("tab-content")
);

const plotContainerTab1 = document.getElementById("plot-container-tab-1");
const plotContainerTab2 = document.getElementById("plot-container-tab-2");
// const plotContainerTab3 = document.getElementById("plot-container-tab-3");

let expandedDomElement;
let numeratorTermsArray;
let denominatorTermsArray;
let activeTab;

export const openOrUpdateElementAnalysisWindow = (domElement) => {
  let updateExistingWindow = false;
  if (expandedDomElement) {
    makeElementUnexpanded(expandedDomElement);
    updateExistingWindow = true;
  }
  makeElementExpanded(domElement);
  //store expanded element
  expandedDomElement = domElement;

  //retrieve element
  const element = getElementFromElementId(+domElement.dataset.elementId);

  if (element.isBlock() || element.isTf()) {
    makeElementUnhidden(elementAnalysisWindow);
    populateElementAnalysisWindow(element, updateExistingWindow);
  } else {
    makeElementHidden(elementAnalysisWindow);
  }
};

export const closeElementAnalysisWindow = () => {
  if (expandedDomElement) {
    removeElementAnalysisWindowEventListeners();

    //reset active tab
    tabcontent.forEach((x) => (x.style.display = "none"));
    tabButtons.forEach((x) => x.classList.remove("active"));

    //reset expanded element
    makeElementUnexpanded(expandedDomElement);
    expandedDomElement = null;

    makeElementHidden(elementAnalysisWindow);

    resetPlotContainersMarkup();
  }
};

const populateElementAnalysisWindow = function (element, updateExistingWindow) {
  addElementAnalysisWindowEventListeners();

  const tfValue = element.getValue();
  numeratorTermsArray = getTermsArray(getNumerator(tfValue));
  denominatorTermsArray = getTermsArray(getDenominator(tfValue));
  updateElementNumeratorInput.value = polynomialTermsArrayToStringWithoutCoeffs(
    numeratorTermsArray.map((x) => (!Number.isNaN(+x) ? roundDecimal(x, 3) : x))
  );
  updateElementDenominatorInput.value =
    polynomialTermsArrayToStringWithoutCoeffs(
      denominatorTermsArray.map((x) =>
        !Number.isNaN(+x) ? roundDecimal(x, 3) : x
      )
    );

  if (!updateExistingWindow) {
    //set first tab as active by default
    document
      .getElementById(`element-analysis-window-tab-button-1`)
      .classList.add("active");
    activeTab = 1;
  }

  populateActiveTab();
};

const updateElementValueCallback = function (e) {
  e.preventDefault();

  //parse updated value:
  const numeratorTermsArrayString = String(updateElementNumeratorInput.value);
  const denominatorTermsArrayString = String(
    updateElementDenominatorInput.value
  );

  if (
    numeratorTermsArrayString.startsWith("[") &&
    denominatorTermsArrayString.endsWith("]")
  ) {
    numeratorTermsArray = numeratorTermsArrayString
      .slice(1, -1)
      .replaceAll(" ", "")
      .split(",")
      .map((x) => (!Number.isNaN(+x) ? +x : x));
    denominatorTermsArray = denominatorTermsArrayString
      .slice(1, -1)
      .replaceAll(" ", "")
      .split(",")
      .map((x) => (!Number.isNaN(+x) ? +x : x));

    //constrain input to numbers only:
    // if (
    //   numeratorTermsArray.every((x) => Number.isFinite(x)) &&
    //   denominatorTermsArray.every((x) => Number.isFinite(x))
    // ) {
    const newTfValue = new Ratio(
      new Polynomial("s", numeratorTermsArray),
      new Polynomial("s", denominatorTermsArray)
    );
    //update value
    const element = getElementFromElementId(
      +expandedDomElement.dataset.elementId
    );
    const tfValue = element.getValue();
    const oldNumeratorTermsArray = getTermsArray(getNumerator(tfValue));
    const oldDenominatorTermsArray = getTermsArray(getDenominator(tfValue));

    if (
      !areEqualArrays(numeratorTermsArray, oldNumeratorTermsArray) ||
      !areEqualArrays(denominatorTermsArray, oldDenominatorTermsArray)
    ) {
      element.setValue(newTfValue);
      //store state
      element.getBlock().storeNewHistoricalState();
    }

    //update plot
    populateActiveTab();
  }
};

const populateActiveTab = function () {
  document.getElementById(
    `element-analysis-window-tab-content-${activeTab}`
  ).style.display = "block";

  resetPlotContainersMarkup();

  if (activeTab === 1) {
    new BodePlot(plotContainerTab1, numeratorTermsArray, denominatorTermsArray);
  } else if (activeTab === 2) {
    new NyquistPlot(
      plotContainerTab2,
      numeratorTermsArray,
      denominatorTermsArray
    );
  }
};

/**
 * Add event listeners, when the element analysis window has been opened
 */
const addElementAnalysisWindowEventListeners = function () {
  elementAnalysisWindowCloseButton.addEventListener(
    "click",
    closeElementAnalysisWindow
  );
  updateElementValueButton.addEventListener(
    "click",
    updateElementValueCallback
  );
  tabButtonsContainer.addEventListener("click", tabButtonsCallback);
};

/**
 * Remove event listeners, after the element analysis window has been closed
 */
const removeElementAnalysisWindowEventListeners = function () {
  //remove event listeners
  elementAnalysisWindowCloseButton.removeEventListener(
    "click",
    closeElementAnalysisWindow
  );
  updateElementValueButton.removeEventListener(
    "click",
    updateElementValueCallback
  );
  tabButtonsContainer.removeEventListener("click", tabButtonsCallback);
};

const tabButtonsCallback = function (e) {
  let currentTabButton = e.target.closest(".tab-button");
  if (currentTabButton) {
    tabcontent.forEach((x) => (x.style.display = "none"));
    tabButtons.forEach((x) => x.classList.remove("active"));

    currentTabButton.classList.add("active");
    activeTab = +currentTabButton.dataset.tabId;

    populateActiveTab();
  }
};

const resetPlotContainersMarkup = function () {
  plotContainerTab1.innerHTML = "";
  plotContainerTab2.innerHTML = "";
  // plotContainerTab3.innerHTML = "";
};
