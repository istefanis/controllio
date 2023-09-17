/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / NavbarView
 */

import { getTopBlock } from "../script.js";
import { isMobileDevice, isTouchScreenDevice } from "../util/uiService.js";
import { setLogMode } from "../util/loggingService.js";
import {
  createNewAdder,
  createNewTf,
} from "./services/feature/elementCreationService.js";
import { optimizeTopology } from "./services/feature/optimizeTopologyService.js";
import {
  deleteExpandedOrSelectedElements,
  toggleNewConnectionMode,
} from "./services/core/elementSelectingAndDraggingService.js";
import {
  getLineViewsNumber,
  renderAllLines,
} from "./services/core/lineRenderingService.js";
import { resetCanvas } from "./services/core/canvasService.js";
import { closeElementAnalysisWindow } from "./elementAnalysisWindowView.js";
import { openNewReadyMadeTfPopupWindow } from "./services/feature/readyMadeTfCreationService.js";
import { openUserGuidePopupWindow } from "./services/feature/userGuideService.js";
import {
  openExportFilePopupWindow,
  openImportFilePopupWindow,
} from "./services/feature/exportAndImportFileService.js";
import {
  openLoadFromLocalStoragePopupWindow,
  openSaveToLocalStoragePopupWindow,
} from "./services/feature/saveToAndLoadFromLocalStorageService.js";
import { isLocalStorageEnabled } from "../util/ioService.js";
import { getSimplifiedBlockValue } from "../model/elements/block.js";
import { displayTf } from "../util/prettyPrintingService.js";
import { sleep } from "../util/commons.js";

const navbar = document.getElementById("navbar");

export const getNavbarHeight = function () {
  return navbar.getBoundingClientRect().height;
};

//
// Navbar dimensions change
//
const navbarDimensionsChangeObserver = new ResizeObserver(() => {
  resetCanvas();
  renderAllLines();
  adjustButtonTooltipsPositions();
});
navbarDimensionsChangeObserver.observe(navbar);

//
// Export file button
//
const exportFileButton = document.getElementById("export-file-button");
exportFileButton.addEventListener("click", async function () {
  await openExportFilePopupWindow();
});

//
// Import file button
//
const importFileButton = document.getElementById("import-file-button");
importFileButton.addEventListener("click", async function () {
  await openImportFilePopupWindow();
});

//
// Previous button
//
const previousButton = document.getElementById("previous-button");
previousButton.addEventListener("click", function () {
  getTopBlock().loadPreviousHistoricalState();
});

//
// Next button
//
const nextButton = document.getElementById("next-button");
nextButton.disabled = true;
nextButton.addEventListener("click", function () {
  getTopBlock().loadNextHistoricalState();
});

//
// Save & Load buttons
//
const displayAndInitSaveToAndLoadFromLocalStorageButtons = function () {
  const saveButton = document.getElementById("save-button");
  saveButton.classList.remove("hidden");
  saveButton.addEventListener("click", async function () {
    await openSaveToLocalStoragePopupWindow();
  });

  const loadButton = document.getElementById("load-button");
  loadButton.classList.remove("hidden");
  loadButton.addEventListener("click", async function () {
    await openLoadFromLocalStoragePopupWindow();
  });

  //Load button
  const circuitKeys = JSON.parse(localStorage.getItem("circuit-keys"));
  if (!circuitKeys) {
    loadButton.disabled = true;
  }
};

//
// Tf button
//
const tfButton = document.getElementById("tf-button");
tfButton.addEventListener("mousedown", function (e) {
  createNewTf(false);
});
if (isTouchScreenDevice) {
  tfButton.addEventListener("touchstart", function (e) {
    //touch events have precedence over mouse events -
    //preventDefault() prevents a mouse event from being invoked too
    e.preventDefault();
    createNewTf(true);
  });
}

//
// Adder button
//
const adderButton = document.getElementById("adder-button");
adderButton.addEventListener("mousedown", function (e) {
  createNewAdder(false);
});
if (isTouchScreenDevice) {
  adderButton.addEventListener("touchstart", function (e) {
    e.preventDefault();
    createNewAdder(true);
  });
}

//
// Connection button
//
const connectionButton = document.getElementById("connection-button");
connectionButton.addEventListener("click", function (e) {
  toggleNewConnectionMode();
});

//
// Ready-made tf button
//
const readyMadeTfButton = document.getElementById("ready-made-tf-button");

readyMadeTfButton.addEventListener("mousedown", async function () {
  await openNewReadyMadeTfPopupWindow(false);
});
if (isTouchScreenDevice) {
  readyMadeTfButton.addEventListener("touchstart", async function (e) {
    e.preventDefault();
    await openNewReadyMadeTfPopupWindow(true);
  });
}

//
// Delete button
//
const deleteButton = document.getElementById("delete-button");
deleteButton.disabled = true;
deleteButton.addEventListener("click", deleteExpandedOrSelectedElements);

//
// Delete all button
//
const deleteAllButton = document.getElementById("delete-all-button");
deleteAllButton.addEventListener("click", function (e) {
  closeElementAnalysisWindow();
  getTopBlock().clearState();
});

//
// Optimize Topology button
//
const optimizeTopologyButton = document.getElementById(
  "optimize-topology-button"
);
const optimizeTopologyIcon = document.getElementById("optimize-topology-icon");

optimizeTopologyButton.addEventListener("click", async function (e) {
  e.stopPropagation();
  optimizeTopologyIcon.classList.remove("bi-bounding-box-circles");
  optimizeTopologyIcon.classList.add("loading-spinner");
  await sleep(0); //needed for rendering the updated CSS before the computation below
  await optimizeTopology();
  optimizeTopologyIcon.classList.remove("loading-spinner");
  optimizeTopologyIcon.classList.add("bi-bounding-box-circles");
});

//
// Simplify Button
//
const simplifyButton = document.getElementById("simplify-button");

let simplificationStarted = false;
let pauseButtonDisplayed = false;
export let pauseButtonClicked = false;

const runButtonMarkup = `
  <i class="bi-play"></i>
  <p>Run</p>
  <div class="tooltip">
    <h5>Run simplification</h5>
    <p>
      Run a set of algorithms to simplify the circuit either
      completely (by replacing it with an equivalent total tf) or as
      much as possible
    </p>
    <p class="tooltip-expansion">
      Revert a simplifcation via the Prev button
    </p>
  </div>
`;
const pauseButtonMarkup = `
  <i class="bi-pause"></i>
  <p>Pause</p>
  <div class="tooltip">
    <h5>Pause simplification</h5>
    <p>
      Pause the simplification process
    </p>
  </div>
`;
const resumeButtonMarkup = `
  <i class="bi-play"></i>
  <p>Resume</p>
  <div class="tooltip">
    <h5>Resume simplification</h5>
    <p>
      Resume the simplification process
    </p>
  </div>
`;

simplifyButton.addEventListener("click", async function (e) {
  if (simplificationStarted === false) {
    // console.log("Simplify run button clicked");
    closeElementAnalysisWindow();
    simplificationStarted = true;
    simplifyButton.innerHTML = pauseButtonMarkup;
    adjustButtonTooltipsPositions();
    optimizeTopologyButton.disabled = true;
    previousButton.disabled = true;
    nextButton.disabled = true;
    pauseButtonDisplayed = true;

    const simplifiedBlockValue = await getSimplifiedBlockValue(getTopBlock());
    displayTf(simplifiedBlockValue);

    simplificationStarted = false;
    simplifyButton.innerHTML = runButtonMarkup;
    adjustButtonTooltipsPositions();
    if (getLineViewsNumber() > 0) {
      optimizeTopologyButton.disabled = false;
    }
    previousButton.disabled = false;
    pauseButtonDisplayed = false;
    pauseButtonClicked = false;
  } else {
    if (pauseButtonDisplayed) {
      if (pauseButtonClicked === false) {
        // console.log("Simplify pause button clicked");
        simplifyButton.innerHTML = resumeButtonMarkup;
        adjustButtonTooltipsPositions();
        pauseButtonClicked = true;
        pauseButtonDisplayed = false;
      }
    } else {
      // console.log("Simplify resume button clicked");
      simplifyButton.innerHTML = pauseButtonMarkup;
      adjustButtonTooltipsPositions();
      pauseButtonClicked = false;
      pauseButtonDisplayed = true;
    }
  }
});

//
// Animation Speed slider
//
export let animationSpeedCoeff;

export const setAnimationSpeedCoeff = (c) => {
  animationSpeedCoeff = c;
};

const animationSpeedSlider = document.getElementById("speed-slider");

animationSpeedSlider.addEventListener("input", function (e) {
  animationSpeedCoeff = (10 / e.target.value) ** 2;
});

//
// LogMode slider
//
const displayAndInitLogModeSlider = function () {
  const logModeSliderContainer = document.getElementById(
    "log-mode-slider-section"
  );
  logModeSliderContainer.classList.remove("hidden");

  const logModeSlider = document.getElementById("log-mode-slider");
  logModeSlider.addEventListener("input", function (e) {
    switch (e.target.value) {
      case "1":
        setLogMode("null");
        break;
      case "2":
        setLogMode("algorithms");
        break;
      case "3":
        setLogMode("simplifications");
        break;
      case "4":
        setLogMode("checkpoints");
        break;
    }
  });
  logModeSlider.value = 4;
};

//
// User guide button
//
const userGuideButton = document.getElementById("user-guide-button");

userGuideButton.addEventListener("click", async function () {
  await openUserGuidePopupWindow();
});

//
// Button tooltips
//
const tooltips = Array.from(document.getElementsByClassName("tooltip"));

/**
 * Adjusts the button tooltip positions according to available window area
 */
const adjustButtonTooltipsPositions = () => {
  tooltips.forEach((x, i) => {
    const boundRect = x.getBoundingClientRect();
    const parentBoundRect = x
      .closest(".button-with-tooltip")
      ?.getBoundingClientRect();
    if (boundRect.right > window.innerWidth) {
      x.style.left = "auto";
      x.style.right = "0px";
    } else if (
      parentBoundRect &&
      parentBoundRect.left + boundRect.width < window.innerWidth
    ) {
      x.style.left = "0px";
      x.style.right = "auto";
    }
  });
};

//
// Init
//
const init = function () {
  //Save & Load buttons
  if (isLocalStorageEnabled()) {
    displayAndInitSaveToAndLoadFromLocalStorageButtons();
  }

  if (isMobileDevice) {
    setLogMode("null");
  } else {
    //Delete all button
    deleteAllButton.classList.remove("hidden");

    //Log Mode slider
    displayAndInitLogModeSlider();
    setLogMode("checkpoints");
  }

  //Button tooltips
  adjustButtonTooltipsPositions();

  //Speed slider
  const defaultSpeedSliderValue = 5;
  animationSpeedSlider.value = defaultSpeedSliderValue;
  animationSpeedCoeff = (10 / defaultSpeedSliderValue) ** 2;
};

init();
