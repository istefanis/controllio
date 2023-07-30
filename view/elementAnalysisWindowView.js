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
  isMobileDevice,
  isLargeScreenDevice,
} from "../util/uiService.js";
import { polynomialTermsArrayToStringWithoutCoeffs } from "../util/prettyPrintingService.js";
import BodePlot from "./plots/bodePlot.js";
import NyquistPlot from "./plots/nyquistPlot.js";
import TimeDomainPlot from "./plots/timeDomainPlot.js";
import { findComplexRootsOfPolynomial } from "../math/numericalAnalysis/numericalAnalysisService.js";
import {
  resetActiveElements,
  resetExpandedElements,
} from "./services/core/elementSelectingAndDraggingService.js";
import { enableHistoricalStateStorage } from "../model/blockStateService.js";
import { renderAllLines } from "./services/core/lineRenderingService.js";

//
// Select DOM elements
//
const deleteButton = document.getElementById("delete-button");

const elementAnalysisWindow = document.querySelector(
  ".element-analysis-window"
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
  deleteButton.disabled = false;
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

    resetExpandedElements();

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
  updateElementNumeratorInput.value = polynomialTermsArrayToStringWithoutCoeffs(
    numeratorTermsArray.map((x) => (!Number.isNaN(+x) ? roundDecimal(x, 3) : x))
  );
  updateElementDenominatorInput.value =
    polynomialTermsArrayToStringWithoutCoeffs(
      denominatorTermsArray.map((x) =>
        !Number.isNaN(+x) ? roundDecimal(x, 3) : x
      )
    );

  //compute zeros & poles
  zeros = findComplexRootsOfPolynomial(numeratorTermsArray);
  poles = findComplexRootsOfPolynomial(denominatorTermsArray);

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
      enableHistoricalStateStorage();
      element.getBlock().storeNewHistoricalState();

      //compute zeros & poles
      zeros = findComplexRootsOfPolynomial(numeratorTermsArray);
      poles = findComplexRootsOfPolynomial(denominatorTermsArray);
    }

    //re-render lines, because DOM element dimensions may have been changed
    renderAllLines();

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
      poles
    );
  } else if (activeTab === 2) {
    nyquistObserver = new NyquistPlot(
      plotContainerTab2,
      numeratorTermsArray,
      denominatorTermsArray,
      zeros,
      poles
    );
  } else if (activeTab === 3) {
    timeDomainObserver = new TimeDomainPlot(
      plotContainerTab3,
      numeratorTermsArray,
      timeDomainInputSignal === "step"
        ? [...denominatorTermsArray, 0]
        : denominatorTermsArray,
      zeros,
      poles
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
    poles
  );
  nyquistObserver = new NyquistPlot(
    plotContainerTab2,
    numeratorTermsArray,
    denominatorTermsArray,
    zeros,
    poles
  );
  timeDomainObserver = new TimeDomainPlot(
    plotContainerTab3,
    numeratorTermsArray,
    timeDomainInputSignal === "step"
      ? [...denominatorTermsArray, 0]
      : denominatorTermsArray,
    zeros,
    poles
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
    timeDomainInputSignal === "step"
      ? [...denominatorTermsArray, 0]
      : denominatorTermsArray,
    zeros,
    poles
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
