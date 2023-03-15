/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / IOService
 */

export const exportFile = function (content, contentType, fileName) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type: contentType }));
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
};

export const importFile = async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.readAsText(file);

  return new Promise((resolve, reject) => {
    fileReader.addEventListener(
      "load",
      async function (e) {
        try {
          const contents = e.target.result;
          resolve(contents);
        } catch (error) {
          reject(error);
        }
      },
      { once: true }
    );
  });
};

export const isLocalStorageEnabled = function () {
  try {
    let storage = window["localStorage"];
    const t = "test";
    storage.setItem(t, t);
    storage.removeItem(t);
    return true;
  } catch (e) {
    return false;
  }
};
