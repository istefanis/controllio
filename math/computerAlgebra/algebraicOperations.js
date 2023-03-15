/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Math / ComputerAlgebra / AlgebraicOperations
 */

/*
 * Reference for algorithms:
 *
 * Structure and Interpretation of Computer Programs second edition.
 * The MIT Press with the McGraw-Hill Book Company, 1996
 * Harold Abelson and Gerald Jay Sussman with Julie Sussman, foreword by Alan J. Perlis,
 *
 * noted below as 'SICP'
 */

/*
 * Prefix notation used extensively
 */

import {
  primitiveOperationsSymbols,
  isSymbol,
  isReal,
} from "../../util/commons.js";

/**
 * Map storing the available algebraic operations for all data types
 */
const algebraicOperationsMap = new Map();

export const set = (operationAndTypeTagsArray, fun) => {
  //creating a key by joining the array elements,
  //to achieve 'primitive type' equality
  const key = operationAndTypeTagsArray.join("-");
  algebraicOperationsMap.set(key, fun);
};

export const get = (operationAndTypeTagsArray) => {
  const key = operationAndTypeTagsArray.join("-");
  return algebraicOperationsMap.get(key);
};

/**
 * Attachment of a tag to a data object for indicating its data type (ex.: SICP 2.4.2)
 */
export const addTypeTag = (typeTag, content) =>
  typeTag === "real" ? content : [typeTag, content]; //no tag for reals

/**
 * Invocation of the appropriate operation for arguments of the respective data types
 */
const invokeOperation = function (operation, ...args) {
  //helper functions
  const containsSymbols = function (tree) {
    const traverseTreeForSymbols = (result, t) => {
      if (t === null) return result;
      return Array.isArray(t[0])
        ? traverseTreeForSymbols(result, t[0]) ||
            traverseTreeForSymbols(result, t[1])
        : (isSymbol(t[0]) && !primitiveOperationsSymbols.includes(t[0])) ||
            traverseTreeForSymbols(result, t.slice(1));
    };
    return traverseTreeForSymbols(false, tree);
  };

  const getTypeTag = function (obj) {
    if (Array.isArray(obj)) {
      return containsSymbols(obj) && primitiveOperationsSymbols.includes(obj[0])
        ? "symbol"
        : obj[0];
    }
    if (isReal(obj)) return "real";
    if (isSymbol(obj)) return "symbol";
    if (isSymbol(obj) && !primitiveOperationsSymbols.includes(obj))
      return "symbol";

    console.error("getTypeTag()", "Type tag extraction failed", obj);
    throw new Error("getTypeTag()");
  };

  const getContent = function (obj) {
    if (Array.isArray(obj)) {
      return containsSymbols(obj) && primitiveOperationsSymbols.includes(obj[0])
        ? obj
        : obj[1];
    }
    if (isReal(obj)) return obj;
    if (isSymbol(obj) && !primitiveOperationsSymbols.includes(obj)) return obj;

    console.error("getContent()", "Content extraction failed", obj);
    throw new Error("getContent()");
  };

  // console.log("args:", args);
  const typeTags = args.map(getTypeTag);
  const fun = get([operation].concat(typeTags));
  if (fun) return fun.apply("_", args.map(getContent));

  console.error(
    "invokeOperation()",
    "No operation for these data types",
    operation,
    typeTags
  );
  throw new Error("invokeOperation()");
};

//
// Generic operations (implementations for multiple or single data types
// stored in 'algebraicOperationsMap')
//
export const add = (x, y) => invokeOperation("add", x, y);
export const subtract = (x, y) => invokeOperation("subtract", x, y);
export const multiply = (x, y) => invokeOperation("multiply", x, y);
export const divide = (x, y) => invokeOperation("divide", x, y);

export const negate = (x) => invokeOperation("negate", x); // symbols, reals & polynomials
export const isZero = (x) => invokeOperation("isZero", x); // symbols & reals
// export const areEqual = (x, y) => invokeOperation("areEqual", x, y);

export const gcd = (x, y) => invokeOperation("gcd", x, y); // reals & polynomials
export const simplify = (r) => invokeOperation("simplify", r); // ratios
export const reduce = (p1, p2) => invokeOperation("reduce", p1, p2); // polynomials

export const getNumerator = (r) => invokeOperation("getNumerator", r); // ratios
export const getDenominator = (r) => invokeOperation("getDenominator", r); // ratios
export const getTermsArray = (p) => invokeOperation("getTermsArray", p); // polynomials
