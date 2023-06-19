/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / SaveToAndLoadFromLocalStorageService
 */

import { getTopBlock } from "../../../script.js";
import { closeElementAnalysisWindow } from "../../elementAnalysisWindowView.js";
import { openPopupWindow } from "../../popupWindowView.js";

let saveToLocalStorageContentsMarkup;
let loadFromLocalStorageContentsMarkup1;
let loadFromLocalStorageContentsMarkup2;
let loadFromLocalStorageWrongFormatContentsMarkup;

const loadButton = document.getElementById("load-button");

export const openSaveToLocalStoragePopupWindow = async function () {
  await openPopupWindow(
    "Save state",
    saveToLocalStorageContentsMarkup,
    //save button clicked
    function () {
      const state = getTopBlock().getState();

      //add new localStorage item
      const newCircuitKey = "circuit-" + new Date().toISOString();
      localStorage.setItem(newCircuitKey, JSON.stringify(state));

      //update existing localStorage item that stores all item keys
      let circuitKeys = JSON.parse(localStorage.getItem("circuit-keys"));
      localStorage.setItem(
        "circuit-keys",
        !circuitKeys
          ? JSON.stringify([newCircuitKey])
          : JSON.stringify([newCircuitKey].concat(circuitKeys))
      );

      loadButton.disabled = false;
    }
  );
};

export const openLoadFromLocalStoragePopupWindow = async function () {
  //create the popup window contents markup
  const circuitKeys = JSON.parse(localStorage.getItem("circuit-keys"));
  const contentsMarkup =
    loadFromLocalStorageContentsMarkup1 +
    circuitKeys
      .map(
        (x, i) =>
          `<a class="popup-window-selectable-content" data-content-id='${i}'>
          <i class="bi-arrow-counterclockwise"></i>
          <p>${x}</p>
        </a>`
      )
      .join("") +
    loadFromLocalStorageContentsMarkup2;

  const result = await openPopupWindow(
    "Load state",
    contentsMarkup,
    //delete button clicked
    function () {
      //remove localStorage items
      let circuitKeys = JSON.parse(localStorage.getItem("circuit-keys"));

      if (circuitKeys) {
        circuitKeys.forEach((x) => localStorage.removeItem(x));
        localStorage.removeItem("circuit-keys");
      }

      loadButton.disabled = true;
    }
  );

  if (result !== null) {
    const [selectedContentId] = result;
    const state = JSON.parse(
      localStorage.getItem(circuitKeys[selectedContentId])
    );

    //check format
    if (state.blocks && state.tfs && state.adders && state.connections) {
      closeElementAnalysisWindow();
      getTopBlock().clearState();
      getTopBlock().clearStateHistory();
      getTopBlock().setState(state);
    } else {
      console.error(
        "openLoadFromLocalStoragePopupWindow()",
        "Loaded state has a wrong format."
      );

      await openPopupWindow(
        "Load state error",
        loadFromLocalStorageWrongFormatContentsMarkup
      );
    }
  }
};

//
// Init
//
const init = function () {
  saveToLocalStorageContentsMarkup = `
    <section class="popup-window-text-content">
      <p>Save the current state to the browser's local storage. Data there will persist after 
      the page is reloaded or the browser is closed:</p>
      <div class="flex-row-center">
        <button id="popup-window-regular-button">Save</button>
      </div>
      <p>State data can be deleted from 'Load state'.</p>
    </section>
  `;

  loadFromLocalStorageContentsMarkup1 = `
    <section class="popup-window-text-content">
      <p>Load a saved state, and replace the current:</p>
    </section>`;

  loadFromLocalStorageContentsMarkup2 = `
  <section class="popup-window-text-content">
    <div class="flex-row-center">
      <button id="popup-window-regular-button">Delete saved states</button>
    </div>
  </section>`;

  loadFromLocalStorageWrongFormatContentsMarkup = `
    <section class="popup-window-text-content">
      <div class="popup-window-row-container">
        <i class="bi-exclamation-triangle red"></i>
        <p>Error while loading the state from local storage! The state has a wrong format.</p>
      </div>
    </section>
  `;
};

init();
