/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / ElementService
 */

export const isElement = (element) =>
  element.isBlock() || element.isTf() || element.isAdder();

/**
 * Map storing the element for each elementId
 */
let elementsMap = new Map();

export const getElementFromElementId = (elementId) => {
  return elementsMap.get(elementId);
};

//
// Element id assigning service
//
let elementId = 0;

export const generateNewElementIdForElement = function (element) {
  elementId++;
  if (elementsMap.get(elementId)) {
    //skip already assigned ids (these may be present ex. if elements are imported/loaded)
    return generateNewElementIdForElement(element);
  }
  elementsMap.set(elementId, element);
  return elementId;
};

export const setElementIdForElement = function (elementId, element) {
  elementsMap.set(elementId, element);
};

/**
 * Remove element
 */
export const removeElementWithElementId = function (elementId) {
  elementsMap.delete(elementId);
};

/**
 * Reset the elementMap and elementId
 */
export const resetElementService = () => {
  elementsMap = new Map();
  elementId = 0;
};

/**
 * Delete element from block
 */
export const deleteElement = function (element) {
  const block = element.getBlock();
  if (element.hasInput()) {
    if (element.isAdder()) {
      const inputs = element.getInput();
      inputs.forEach((i) => {
        i.removeOutput(element);
        element.removeInput(i);
      });
    } else {
      const input = element.getInput();
      input.removeOutput(element);
      element.setInput(null);
    }
  }
  if (element.hasOutputs()) {
    const outputs = element.getOutputs();
    outputs.forEach((o) => {
      element.removeOutput(o);
      o.isAdder() ? o.removeInput(element) : o.setInput(null);
    });
  }
  if (element.isBlock()) {
    block.removeFromBlocks(element);
  } else if (element.isTf()) {
    block.removeFromTfs(element);
  } else {
    block.removeFromAdders(element);
  }
};
