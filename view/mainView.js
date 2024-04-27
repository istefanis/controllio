/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / MainView
 */

import { getTopBlock } from "../model/topBlockService.js";
import { isTouchScreenDevice } from "../util/uiService.js";
import { closePopupWindow } from "./popupWindowView.js";
import {
  startSelectionOrDrag,
  selectionOrDrag,
  endSelectionOrDrag,
  deleteExpandedOrSelectedElements,
  resetExpandedOrSelectedElements,
  copyExpandedOrSelectedElements,
} from "./services/core/elementSelectingAndDraggingService.js";

//
// Grid mouse/touch listeners
//
let grid = document.querySelector(".grid");

grid.addEventListener("mousedown", startSelectionOrDrag);
grid.addEventListener("mousemove", selectionOrDrag);
grid.addEventListener("mouseup", endSelectionOrDrag);

if (isTouchScreenDevice) {
  grid.addEventListener("touchstart", startSelectionOrDrag);
  grid.addEventListener("touchmove", selectionOrDrag);
  grid.addEventListener("touchend", endSelectionOrDrag);
}

//
// Keydown listener
//
document.addEventListener("keydown", function (e) {
  if (e.key === "Delete") {
    const deleteButton = document.getElementById("delete-button");
    if (deleteButton.disabled === false) {
      deleteExpandedOrSelectedElements();
    }
  } else if (e.key === "Escape") {
    const popupWindow = document.querySelector(".popup-window");
    if (!popupWindow.classList.contains("hidden")) {
      //popup window is displayed case
      closePopupWindow();
    } else {
      resetExpandedOrSelectedElements();
    }
  } else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
    const copyButton = document.getElementById("copy-button");
    if (copyButton.disabled === false) {
      copyExpandedOrSelectedElements();
    }
  } else if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
    const previousButton = document.getElementById("previous-button");
    if (previousButton.disabled === false) {
      getTopBlock().loadPreviousHistoricalState();
    }
  } else if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
    const nextButton = document.getElementById("next-button");
    if (nextButton.disabled === false) {
      getTopBlock().loadNextHistoricalState();
    }
  }
});
