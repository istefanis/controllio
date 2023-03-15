/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * View / Services / Feature / ExportAndImportFileService
 */

import { getTopBlock } from "../../../script.js";
import { exportFile, importFile } from "../../../util/ioService.js";
import { closeElementAnalysisWindow } from "../../elementAnalysisWindowView.js";
import { openPopupWindow } from "../../popupWindowView.js";

let exportFileContentsMarkup;
let importFileContentsMarkup;
let importFileErrorWrongFormatContentsMarkup;
let importFileErrorGenericContentsMarkup;

export const openExportFilePopupWindow = async function () {
  await openPopupWindow("Export file", exportFileContentsMarkup, function () {
    const fileNameInput = document.getElementById("popup-window-input");
    const fileName = String(fileNameInput.value) + ".json";
    exportFile(
      JSON.stringify(getTopBlock().getState()),
      "application/json",
      fileName
    );
  });
};

export const openImportFilePopupWindow = async function () {
  await openPopupWindow(
    "Import file",
    importFileContentsMarkup,
    async function (e) {
      const contents = await importFile(e);

      try {
        const state = JSON.parse(contents);

        //check format
        if (state.blocks && state.tfs && state.adders && state.connections) {
          closeElementAnalysisWindow();
          getTopBlock().clearState();
          getTopBlock().clearStateHistory();
          getTopBlock().setState(state);
        } else {
          console.error(
            "openImportFilePopupWindow()",
            "JSON file has a wrong format."
          );

          await openPopupWindow(
            "Import file error",
            importFileErrorWrongFormatContentsMarkup
          );
        }
      } catch (e) {
        console.error(
          "openImportFilePopupWindow()",
          "JSON file parsing failed."
        );

        await openPopupWindow(
          "Import file error",
          importFileErrorGenericContentsMarkup
        );
      }
    }
  );
};

//
// Init
//
const init = function () {
  exportFileContentsMarkup = `
    <section class="popup-window-text-content">
      <p>The current state will be exported as a .json file:</p>
      <div class="flex-row-center">
        <p>Filename:</p>
        <input
          type="text"
          value="circuit"
          id="popup-window-input"
          class="popup-window-input"
        />
        <p>.json</p>
      </div>
      <div class="flex-row-center">
        <button id="popup-window-regular-button">Export</button>
      </div>
    </section>
  `;
  importFileContentsMarkup = `
    <section class="popup-window-text-content">
      <p>The state contained in the .json file imported will replace the current state:</p>
      <div class="popup-window-row-container">
        <i class="bi-exclamation-triangle"></i>
        <p>Import only .json files directly exported by Controllio, or manually crafted .json files of the same format!</p>
      </div>
      <div class="flex-row-center">
        <label for="popup-window-input-button">
          <p>Import</p>
        </label>
        <input type="file" id="popup-window-input-button"/>
      </div>
    </section>
  `;

  importFileErrorWrongFormatContentsMarkup = `
    <section class="popup-window-text-content">
      <div class="popup-window-row-container">
        <i class="bi-exclamation-triangle red"></i>
        <p>Error while importing the .json file! The file has a wrong format.</p>
      </div>
    </section>
  `;

  importFileErrorGenericContentsMarkup = `
    <section class="popup-window-text-content">
      <div class="popup-window-row-container">
        <i class="bi-exclamation-triangle red"></i>
        <p>Error while importing the file! The file could not be parsed.</p>
      </div>
    </section>
    `;
};

init();
