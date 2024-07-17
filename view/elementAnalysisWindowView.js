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
  round,
} from "../math/computerAlgebra/algebraicOperations.js";
import { getElementFromElementId } from "../model/elementService.js";
import {
  areEqualArrays,
  roundDecimalDigitsTfComputations,
  areAllTfTermsNumbers,
} from "../util/commons.js";
import {
  makeElementUnhidden,
  makeElementHidden,
  makeElementExpanded,
  makeElementUnexpanded,
  isMobileDevice,
  isLargeScreenDevice,
  resetActiveElements,
  moveToGroundLevel,
  toggledButtons,
} from "../util/uiService.js";
import {
  replaceMultipleStringSpacesWithSingle,
  toInfixNotation,
  polynomialTermsArrayToStringWithoutCoeffs,
} from "../util/prettyPrintingService.js";
import BodePlot from "./plots/bodePlot.js";
import NyquistPlot from "./plots/nyquistPlot.js";
import TimeDomainPlot from "./plots/timeDomainPlot.js";
import { findComplexRootsOfPolynomial } from "../math/numericalAnalysis/numericalAnalysisService.js";
import { enableHistoricalStateStorage } from "../model/blockStateService.js";
import { renderAllLines } from "./services/core/lineRenderingService.js";

//
// Select DOM elements
//
const elementAnalysisWindow = document.querySelector(
  ".element-analysis-window"
);

const elementAnalysisWindowHeaderText = document.querySelector(
  "#element-analysis-window-header-text"
);

const elementAnalysisWindowMinimizeButton = elementAnalysisWindow.querySelector(
  "#element-analysis-window-minimize-button"
);
const elementAnalysisWindowMaximizeButton = elementAnalysisWindow.querySelector(
  "#element-analysis-window-maximize-button"
);
const elementAnalysisWindowCloseButton = elementAnalysisWindow.querySelector(
  "#element-analysis-window-close-button"
);
const elementAnalysisWindowContents = elementAnalysisWindow.querySelector(
  ".element-analysis-window-contents"
);

const updateElementNumeratorInput = elementAnalysisWindow.querySelector(
  "#update-element-numerator-input"
);
const updateElementDenominatorInput = elementAnalysisWindow.querySelector(
  "#update-element-denominator-input"
);
const updateElementValueButton = elementAnalysisWindow.querySelector(
  ".update-element-value-button"
);
const samplingTInputContainer = elementAnalysisWindow.querySelector(
  ".sampling-t-input-container"
);
const samplingTInput = elementAnalysisWindow.querySelector(
  "#element-sampling-t-input"
);

const singlePlotContainer = elementAnalysisWindow.querySelector(
  ".single-plot-container"
);
const multiplePlotsContainer = elementAnalysisWindow.querySelector(
  ".multiple-plots-container"
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

let plotContainerTab1 = singlePlotContainer.querySelector(
  "#plot-container-tab-1"
);
let plotContainerTab2 = singlePlotContainer.querySelector(
  "#plot-container-tab-2"
);
let plotContainerTab3 = singlePlotContainer.querySelector(
  "#plot-container-tab-3"
);

let expandedDomElement;

export const setExpandedElement = (element) => {
  expandedDomElement = element;
  if (element) {
    toggledButtons.forEach((x) => (x.disabled = false));
  }
};
export const getExpandedElement = () => expandedDomElement;

export const resetExpandedElement = () => {
  if (expandedDomElement) {
    moveToGroundLevel(expandedDomElement);
    closeElementAnalysisWindow();
    setExpandedElement(null);
    toggledButtons.forEach((x) => (x.disabled = true));
  }
};

let tfParam;
let samplingT;
let numeratorTermsArray;
let denominatorTermsArray;
let zeros = [];
let poles = [];
let activeTab;

let bodeObserver;
let nyquistObserver;
let timeDomainObserver;

let timeDomainInputSignalRadioButtons;
let timeDomainInputSignal;

let isWindowMaximized = false;

export const openOrUpdateElementAnalysisWindow = function (domElement) {
  toggledButtons.forEach((x) => (x.disabled = false));

  let updateExistingWindow = false;

  resetActiveElements();

  if (expandedDomElement) {
    if (expandedDomElement !== domElement) {
      makeElementUnexpanded(expandedDomElement);

      //retrieve expandedElement
      const expandedElement = getElementFromElementId(
        +expandedDomElement.dataset.elementId
      );
      if (expandedElement.isBlock() || expandedElement.isTf()) {
        updateExistingWindow = true;
      }
    }
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

  elementAnalysisWindowCloseButton.focus();
};

export const closeElementAnalysisWindow = function () {
  resetActiveElements();

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
  displayMinimizeMaximizeButtons();
  if (!updateExistingWindow) {
    addElementAnalysisWindowEventListeners();
  }

  const tfValue = element.getValue();
  numeratorTermsArray = getTermsArray(getNumerator(tfValue));
  denominatorTermsArray = getTermsArray(getDenominator(tfValue));

  tfParam = element.getParam();
  if (tfParam === "z") {
    samplingT = element.getSamplingT();
    makeElementUnhidden(samplingTInputContainer);
    samplingTInput.textContent = samplingT;
    elementAnalysisWindowHeaderText.textContent = "Discrete transfer function";
  } else {
    samplingT = null;
    makeElementHidden(samplingTInputContainer);
    elementAnalysisWindowHeaderText.textContent = "Transfer function";
  }

  updateElementNumeratorInput.value = polynomialTermsArrayToStringWithoutCoeffs(
    numeratorTermsArray.map((x) => (!Number.isNaN(+x) ? x : toInfixNotation(x)))
  );
  updateElementDenominatorInput.value =
    polynomialTermsArrayToStringWithoutCoeffs(
      denominatorTermsArray.map((x) =>
        !Number.isNaN(+x) ? x : toInfixNotation(x)
      )
    );

  //compute zeros & poles, after checking that all terms are numbers
  if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
    zeros = findComplexRootsOfPolynomial(numeratorTermsArray);
    poles = findComplexRootsOfPolynomial(denominatorTermsArray);
  } else {
    zeros = [];
    poles = [];
  }

  if (!isWindowMaximized) {
    populateActiveTab();
  } else {
    populateAllTabs();
  }
};

const updateElementValueButtonCallback = function (e) {
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
      .split(",")
      .map((x) => x.trim())
      .map((x) =>
        !Number.isNaN(+x) ? +x : replaceMultipleStringSpacesWithSingle(x)
      )
      .map((x) => round(x, roundDecimalDigitsTfComputations));

    denominatorTermsArray = denominatorTermsArrayString
      .slice(1, -1)
      .split(",")
      .map((x) => x.trim())
      .map((x) =>
        !Number.isNaN(+x) ? +x : replaceMultipleStringSpacesWithSingle(x)
      )
      .map((x) => round(x, roundDecimalDigitsTfComputations));

    const newTfValue = new Ratio(
      new Polynomial(tfParam, numeratorTermsArray),
      new Polynomial(tfParam, denominatorTermsArray)
    );
    //update value
    const element = getElementFromElementId(
      +expandedDomElement.dataset.elementId
    );
    const tfValue = element.getValue();
    const oldNumeratorTermsArray = getTermsArray(getNumerator(tfValue));
    const oldDenominatorTermsArray = getTermsArray(getDenominator(tfValue));

    //update displayed value in input fields
    updateElementNumeratorInput.value =
      polynomialTermsArrayToStringWithoutCoeffs(
        numeratorTermsArray.map((x) =>
          !Number.isNaN(+x) ? x : toInfixNotation(x)
        )
      );
    updateElementDenominatorInput.value =
      polynomialTermsArrayToStringWithoutCoeffs(
        denominatorTermsArray.map((x) =>
          !Number.isNaN(+x) ? x : toInfixNotation(x)
        )
      );

    if (
      !areEqualArrays(numeratorTermsArray, oldNumeratorTermsArray) ||
      !areEqualArrays(denominatorTermsArray, oldDenominatorTermsArray)
    ) {
      element.setValue(newTfValue);
      //store state
      enableHistoricalStateStorage();
      element.getBlock().storeNewHistoricalState();

      //compute zeros & poles, after checking that all terms are numbers
      if (areAllTfTermsNumbers(numeratorTermsArray, denominatorTermsArray)) {
        zeros = findComplexRootsOfPolynomial(numeratorTermsArray);
        poles = findComplexRootsOfPolynomial(denominatorTermsArray);
      } else {
        zeros = [];
        poles = [];
      }

      //re-render lines, because DOM element dimensions may have been changed
      renderAllLines();
    }

    //update plot(s)
    if (!isWindowMaximized) {
      populateActiveTab();
    } else {
      populateAllTabs();
    }
  }
};

const populateActiveTab = function () {
  if (!activeTab) {
    //set first tab as active by default
    activeTab = 1;
  }
  document
    .getElementById(`element-analysis-window-tab-button-${activeTab}`)
    .classList.add("active");

  disconnectObservers();
  resetPlotContainersMarkup();

  //set plot container tabs
  plotContainerTab1 = singlePlotContainer.querySelector(
    "#plot-container-tab-1"
  );
  plotContainerTab2 = singlePlotContainer.querySelector(
    "#plot-container-tab-2"
  );
  plotContainerTab3 = singlePlotContainer.querySelector(
    "#plot-container-tab-3"
  );

  //display active tab contents
  singlePlotContainer.querySelector(
    `#element-analysis-window-tab-content-${activeTab}`
  ).style.display = "block";

  if (activeTab === 1) {
    bodeObserver = new BodePlot(
      plotContainerTab1,
      numeratorTermsArray,
      denominatorTermsArray,
      zeros,
      poles,
      samplingT
    );
  } else if (activeTab === 2) {
    nyquistObserver = new NyquistPlot(
      plotContainerTab2,
      numeratorTermsArray,
      denominatorTermsArray,
      zeros,
      poles,
      samplingT
    );
  } else if (activeTab === 3) {
    timeDomainObserver = new TimeDomainPlot(
      plotContainerTab3,
      numeratorTermsArray,
      denominatorTermsArray,
      timeDomainInputSignal,
      zeros,
      poles,
      samplingT
    );
  }
};

const populateAllTabs = function () {
  disconnectObservers();
  resetPlotContainersMarkup();

  //set plot container tabs
  plotContainerTab1 = multiplePlotsContainer.querySelector(
    "#plot-container-tab-1"
  );
  plotContainerTab2 = multiplePlotsContainer.querySelector(
    "#plot-container-tab-2"
  );
  plotContainerTab3 = multiplePlotsContainer.querySelector(
    "#plot-container-tab-3"
  );

  //display all tab contents
  multiplePlotsContainer.querySelector(
    `#element-analysis-window-tab-content-1`
  ).style.display = "block";
  multiplePlotsContainer.querySelector(
    `#element-analysis-window-tab-content-2`
  ).style.display = "block";
  multiplePlotsContainer.querySelector(
    `#element-analysis-window-tab-content-3`
  ).style.display = "block";

  bodeObserver = new BodePlot(
    plotContainerTab1,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles,
    samplingT
  );
  nyquistObserver = new NyquistPlot(
    plotContainerTab2,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles,
    samplingT
  );
  timeDomainObserver = new TimeDomainPlot(
    plotContainerTab3,
    numeratorTermsArray,
    denominatorTermsArray,
    timeDomainInputSignal,
    zeros,
    poles,
    samplingT
  );
};

const updateOnlyTimeDomainTab = function () {
  if (timeDomainObserver && timeDomainObserver.disconnect) {
    timeDomainObserver.disconnect();
  }
  plotContainerTab3.innerHTML = "";

  timeDomainObserver = new TimeDomainPlot(
    plotContainerTab3,
    numeratorTermsArray,
    denominatorTermsArray,
    timeDomainInputSignal,
    zeros,
    poles,
    samplingT
  );
};

/**
 * Add event listeners, when the element analysis window has been opened
 */
const addElementAnalysisWindowEventListeners = function () {
  elementAnalysisWindowMinimizeButton.addEventListener(
    "click",
    toggleMinimizeMaximizeWindow
  );
  elementAnalysisWindowMaximizeButton.addEventListener(
    "click",
    toggleMinimizeMaximizeWindow
  );
  elementAnalysisWindowCloseButton.addEventListener(
    "click",
    closeElementAnalysisWindow
  );
  updateElementValueButton.addEventListener(
    "click",
    updateElementValueButtonCallback
  );
  tabButtonsContainer.addEventListener("click", tabButtonsCallback);

  timeDomainInputSignalRadioButtons.forEach((x) =>
    x.addEventListener("change", changeTimeDomainInputSignalCallback)
  );
};

/**
 * Remove event listeners, after the element analysis window has been closed
 */
const removeElementAnalysisWindowEventListeners = function () {
  elementAnalysisWindowMinimizeButton.removeEventListener(
    "click",
    toggleMinimizeMaximizeWindow
  );
  elementAnalysisWindowMaximizeButton.removeEventListener(
    "click",
    toggleMinimizeMaximizeWindow
  );
  elementAnalysisWindowCloseButton.removeEventListener(
    "click",
    closeElementAnalysisWindow
  );
  updateElementValueButton.removeEventListener(
    "click",
    updateElementValueButtonCallback
  );
  tabButtonsContainer.removeEventListener("click", tabButtonsCallback);

  timeDomainInputSignalRadioButtons.forEach((x) =>
    x.removeEventListener("change", changeTimeDomainInputSignalCallback)
  );
};

const tabButtonsCallback = function (e) {
  let currentTabButton = e.target.closest(".tab-button");
  if (currentTabButton && !currentTabButton.classList.contains("active")) {
    tabcontent.forEach((x) => (x.style.display = "none"));
    tabButtons.forEach((x) => x.classList.remove("active"));

    currentTabButton.classList.add("active");
    activeTab = +currentTabButton.dataset.tabId;

    populateActiveTab();
  }
};

const changeTimeDomainInputSignalCallback = function () {
  if (this.checked) {
    timeDomainInputSignal = this.value;
    if (!isWindowMaximized) {
      populateActiveTab();
    } else {
      updateOnlyTimeDomainTab();
      // populateAllTabs();
    }
  }
};

const resetPlotContainersMarkup = function () {
  plotContainerTab1.innerHTML = "";
  plotContainerTab2.innerHTML = "";
  plotContainerTab3.innerHTML = "";
};

const disconnectObservers = function () {
  if (bodeObserver && bodeObserver.disconnect) {
    bodeObserver.disconnect();
  }
  if (nyquistObserver && nyquistObserver.disconnect) {
    nyquistObserver.disconnect();
  }
  if (timeDomainObserver && timeDomainObserver.disconnect) {
    timeDomainObserver.disconnect();
  }
};

//
// Minimize & maximize window
//
const displayMinimizeMaximizeButtons = function () {
  if (!isMobileDevice) {
    if (isWindowMaximized) {
      elementAnalysisWindowMinimizeButton.classList.remove("hidden");
      elementAnalysisWindowMaximizeButton.classList.add("hidden");
      singlePlotContainer.classList.add("hidden");
      multiplePlotsContainer.classList.remove("hidden");
    } else {
      elementAnalysisWindowMinimizeButton.classList.add("hidden");
      elementAnalysisWindowMaximizeButton.classList.remove("hidden");
      singlePlotContainer.classList.remove("hidden");
      multiplePlotsContainer.classList.add("hidden");
    }
  }
};

const toggleMinimizeMaximizeWindow = function () {
  isWindowMaximized = !isWindowMaximized;
  elementAnalysisWindow.classList.toggle("element-analysis-window-maximized");
  elementAnalysisWindowMinimizeButton.classList.toggle("hidden");
  elementAnalysisWindowMaximizeButton.classList.toggle("hidden");
  singlePlotContainer.classList.toggle("hidden");
  multiplePlotsContainer.classList.toggle("hidden");

  //the event listeners must also be adjusted accordingly
  timeDomainInputSignalRadioButtons.forEach((x) =>
    x.removeEventListener("change", changeTimeDomainInputSignalCallback)
  );
  //determine the radio button elements
  timeDomainInputSignalRadioButtons = isWindowMaximized
    ? multiplePlotsContainer.querySelectorAll('input[name="input-signal"]')
    : singlePlotContainer.querySelectorAll('input[name="input-signal"]');
  timeDomainInputSignalRadioButtons.forEach((x) =>
    x.addEventListener("change", changeTimeDomainInputSignalCallback)
  );

  timeDomainInputSignalRadioButtons.forEach((x) => {
    if (x.value === timeDomainInputSignal) {
      x.checked = "checked";
    }
  });

  if (!isWindowMaximized) {
    populateActiveTab();
  } else {
    populateAllTabs();
  }
};

const setMaximizedWindowAsDefault = function () {
  isWindowMaximized = true;
  elementAnalysisWindow.classList.add("element-analysis-window-maximized");
  elementAnalysisWindowMinimizeButton.classList.remove("hidden");
  elementAnalysisWindowMaximizeButton.classList.add("hidden");
  singlePlotContainer.classList.add("hidden");
  multiplePlotsContainer.classList.remove("hidden");
};

//
// Init
//
const init = function () {
  if (isLargeScreenDevice) {
    setMaximizedWindowAsDefault();
  }

  //determine the radio button elements
  timeDomainInputSignalRadioButtons = isWindowMaximized
    ? multiplePlotsContainer.querySelectorAll('input[name="input-signal"]')
    : singlePlotContainer.querySelectorAll('input[name="input-signal"]');

  timeDomainInputSignalRadioButtons[0].checked = "checked";
  timeDomainInputSignal = timeDomainInputSignalRadioButtons[0].value;
};

init();
