/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / PopupWindowView
 */

import { makeElementHidden } from "../util/uiService.js";

const pageOverlay = document.querySelector(".page-overlay");
const popupWindow = document.querySelector(".popup-window");
const popupWindowHeader = document.querySelector(".popup-window-header");
const popupWindowContents = document.querySelector(".popup-window-contents");
const popupWindowCloseButton = document.querySelector(
  ".popup-window-close-button"
);

/**
 * Open a popup window, and manage its functionality, until it is closed
 *
 * @param {*} headerText The popup window's title
 * @param {*} contentsMarkup The HTML markup to be inserted as the popup window's contents. According to its contents, any event listeners will be attached to the respective elements
 * @param {*} buttonCallbackFunction A function to be called, if the first button included in the popup window's contents is clicked
 * @returns A promise resolved with null or with an array object. The latter occurs only in the case of a popup window containing elements to be selected. The array then contains data related to the element selected
 */
export const openPopupWindow = function (
  headerText,
  contentsMarkup,
  buttonCallbackFunction
) {
  //fill popup window
  popupWindowContents.innerHTML = "";
  popupWindowContents.insertAdjacentHTML("beforeend", contentsMarkup);
  popupWindowHeader.querySelector("p").innerText = headerText;

  //display popup window
  pageOverlay.classList.remove("hidden");
  popupWindow.classList.remove("hidden");
  popupWindowCloseButton.focus();

  //option 1: popup window with tabs
  const tabButtonsContainer = popupWindowContents.querySelector(
    ".popup-window-tab-buttons"
  );

  //option 2: popup window with selectable elements that can be returned, while making the popup window close
  const popupWindowCloseSelectionElements = popupWindowContents.querySelector(
    ".popup-window-selectable-content"
  );

  //option 3: popup window with regular buttons
  const regularButton = popupWindowContents.querySelector(
    "#popup-window-regular-button"
  );

  //option 4: popup window with input button
  const inputButton = popupWindowContents.querySelector(
    "#popup-window-input-button"
  );

  //return a Promise resolved according to where the user has clicked
  return new Promise((resolve) => {
    //
    // Callback functions for event listeners
    //
    const cancelCase1Callback = function () {
      removePopupWindowEventListeners();
      closePopupWindow();
      resolve(null);
    };

    const cancelCase2Callback = function () {
      removePopupWindowEventListeners();
      closePopupWindow();
      resolve(null);
    };

    const selectionElementsCaseCallback = function (e) {
      const content = e.target.closest(".popup-window-selectable-content");
      const elementBoundRect = content
        .querySelector(".measured")
        ?.getBoundingClientRect();

      removePopupWindowEventListeners();
      closePopupWindow();
      resolve([
        +content.dataset.contentId,
        e.clientX,
        e.clientY,
        elementBoundRect,
      ]);
    };

    const tabButtons = Array.from(
      popupWindowContents.getElementsByClassName("tab-button")
    );
    const tabcontent = Array.from(
      popupWindowContents.getElementsByClassName("tab-content")
    );
    const tabButtonsCaseCallback = function (e) {
      let currentTabButton = e.target.closest(".tab-button");
      if (currentTabButton) {
        tabcontent.forEach((x) => (x.style.display = "none"));
        tabButtons.forEach((x) => x.classList.remove("active"));

        document.getElementById(
          `popup-window-tab-content-${currentTabButton.dataset.tabId}`
        ).style.display = "block";
        currentTabButton.classList.add("active");
      }
    };

    const regularButtonCaseCallback = function () {
      buttonCallbackFunction();
      removePopupWindowEventListeners();
      closePopupWindow();
      resolve(null);
    };

    const inputButtonCaseCallback = async function (e) {
      await buttonCallbackFunction(e);
      removePopupWindowEventListeners();
      closePopupWindow();
      resolve(null);
    };

    /**
     * Add event listeners, when the popup window has been opened
     */
    const addPopupWindowEventListeners = function () {
      pageOverlay.addEventListener("click", cancelCase1Callback);
      popupWindowCloseButton.addEventListener("click", cancelCase2Callback);
      if (tabButtonsContainer) {
        tabButtonsContainer.addEventListener("click", tabButtonsCaseCallback);

        //set first tab as active by default
        document.getElementById(`popup-window-tab-content-1`).style.display =
          "block";
        document
          .getElementById(`popup-window-tab-button-1`)
          .classList.add("active");
      }
      if (popupWindowCloseSelectionElements) {
        popupWindowContents.addEventListener(
          "click",
          selectionElementsCaseCallback
        );
      }
      if (regularButton) {
        regularButton.addEventListener("click", regularButtonCaseCallback);
      }
      if (inputButton) {
        inputButton.addEventListener("change", async function (e) {
          await inputButtonCaseCallback(e);
        });
      }
    };
    addPopupWindowEventListeners();

    /**
     * Remove event listeners, after the popup window has been closed
     */
    const removePopupWindowEventListeners = function () {
      pageOverlay.removeEventListener("click", cancelCase1Callback);
      popupWindowCloseButton.removeEventListener("click", cancelCase2Callback);
      if (tabButtonsContainer) {
        tabButtonsContainer.removeEventListener(
          "click",
          tabButtonsCaseCallback
        );
      }
      if (popupWindowCloseSelectionElements) {
        popupWindowContents.removeEventListener(
          "click",
          selectionElementsCaseCallback
        );
      }
      if (regularButton) {
        regularButton.removeEventListener("click", regularButtonCaseCallback);
      }
      if (inputButton) {
        inputButton.removeEventListener("change", inputButtonCaseCallback);
      }
    };
  });
};

export const closePopupWindow = function () {
  popupWindowContents.innerHTML = "";
  makeElementHidden(pageOverlay);
  makeElementHidden(popupWindow);
};
