/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Util / PrettyPrintingService
 */

import {
  getNumerator,
  getDenominator,
  getTermsArray,
} from "../math/computerAlgebra/algebraicOperations.js";
import {
  primitiveOperationsSymbols,
  isSymbol,
  roundDecimal,
} from "./commons.js";

const makeSpaceLine = (length) => " ".repeat(length);
const makeRatioLine = (length) => "―".repeat(length); //horizontal bar
// const makeRatioLine = (length) => "-".repeat(length); //minus

/**
 * Transform a polynomial TermsArray into a polynomial string representation in HTML markup
 * @param {Array} termsArray
 * @returns {String} an HTML markup string
 */
export const polynomialTermsArrayToMarkup = function (termsArray) {
  // console.log("polynomialTermsArrayToMarkup()", termsArray);

  //rounding
  termsArray = termsArray.map((x) =>
    Number.isFinite(x) ? roundDecimal(x, 3) : x
  );

  const termsArrayOrder = termsArray.length - 1;

  const loop = (a) => {
    if (!Number.isFinite(a[0]) && !isSymbol(a[0])) {
      a[0] = toInfixNotation(a[0]);
    }

    const order = a.length - 1;
    const sign = !Number.isFinite(a[0]) ? "+" : a[0] > 0 ? "+" : "-";
    const simpleCoeff = !Number.isFinite(a[0])
      ? isSymbol(a[0])
        ? `${a[0]}*`
        : `(${a[0]})*`
      : a[0] !== 1
      ? `${a[0]}*`
      : "";
    const simpleCoeffAbs = !Number.isFinite(a[0])
      ? isSymbol(a[0])
        ? `${a[0]}*`
        : `(${a[0]})*`
      : a[0] !== 1
      ? `${Math.abs(a[0])}*`
      : "";
    const exponent = order > 1 ? `<sup>${order}</sup>` : "";

    // console.log(order, sign, simpleCoeff, simpleCoeffAbs, exponent);

    //case1
    // console.log("case1");
    if (order === termsArrayOrder && order === 0) return `${a[0]}`;

    //case2
    // console.log("case2");
    if (order === termsArrayOrder)
      return `${simpleCoeff}s${exponent}` + loop(a.slice(1));

    //case3
    // console.log("case3");
    if (order === 0)
      return !Number.isFinite(a[0])
        ? isSymbol(a[0])
          ? ` ${sign} ${a[0]}`
          : ` ${sign} (${a[0]})`
        : a[0] !== 0
        ? ` ${sign} ${Math.abs(a[0])}`
        : "";

    //case4
    // console.log("case4");
    return (
      (!Number.isFinite(a[0])
        ? isSymbol(a[0])
          ? ` ${sign} ${simpleCoeffAbs}s${exponent}`
          : ` ${sign} ${simpleCoeffAbs}s${exponent}`
        : a[0] !== 0
        ? ` ${sign} ${simpleCoeffAbs}s${exponent}`
        : "") + loop(a.slice(1))
    );
  };
  return loop(termsArray);
};

/**
 * Transform a prefix-notation array expression containing symbols,
 * to an infix-notation string
 */
const toInfixNotation = (expr) => {
  if (Number.isFinite(expr)) {
    return roundDecimal(expr, 3);
  }
  // console.log(expr);
  if (primitiveOperationsSymbols.includes(expr[0])) {
    if (expr.length === 2) {
      if (Number.isFinite(expr[1])) {
        if (expr[0] === "-") return -toInfixNotation(expr[1]);
      } else {
        return `-${toInfixNotation(expr[1])}`;
      }
    } else if (expr.length === 3) {
      if (Number.isFinite(expr[1]) && Number.isFinite(expr[2])) {
        if (expr[0] === "+") return toInfixNotation(expr[1] + expr[2]);
        if (expr[0] === "-") return toInfixNotation(expr[1] - expr[2]);
        if (expr[0] === "*") return toInfixNotation(expr[1] * expr[2]);
        if (expr[0] === "/") return toInfixNotation(expr[1] / expr[2]);
      }
      if (isSymbol(expr[1]) && Number.isFinite(expr[2])) {
        if (expr[0] === "+") {
          return `(${toInfixNotation(expr[2])}${expr[0]}${toInfixNotation(
            expr[1]
          )})`;
        } else if (expr[0] === "*") {
          return `${toInfixNotation(expr[2])}${expr[0]}${toInfixNotation(
            expr[1]
          )}`;
        } else {
          return `(${toInfixNotation(expr[1])} ${expr[0]} ${toInfixNotation(
            expr[2]
          )})`;
        }
      }
      if (Array.isArray(expr[2]) && Number.isFinite(expr[1])) {
        if (expr[0] === "+") {
          return `(${toInfixNotation(expr[2])} ${expr[0]} ${toInfixNotation(
            expr[1]
          )})`;
        }
      }
      return `(${toInfixNotation(expr[1])} ${expr[0]} ${toInfixNotation(
        expr[2]
      )})`;
    }
  }
  return expr;
};

/**
 * Remove any \<sup> HTML tags from an HTML markup string
 */
export const removeSupTagsFromMarkup = (markupString) =>
  markupString.replaceAll("<sup>", "").replaceAll("</sup>", "");

/**
 * Transform a polynomial TermsArray into a polynomial string representation
 * @param {Array} termsArray
 * @returns {String} a string
 */
export const polynomialTermsArrayToStringWithCoeffs = (termsArray) => {
  return polynomialTermsArrayToMarkup(termsArray)
    .replaceAll("<sup>", "^")
    .replaceAll("</sup>", "");
};

export const polynomialTermsArrayToStringWithoutCoeffs = (termsArray) => {
  return "[" + String(termsArray).replaceAll(",", ", ") + "]";
};

/**
 * Compute an array of 3 equal-length strings (numerator, horizontalLine, denominator),
 * padded with empty spaces from the start & the end
 * @returns {Array} [n, h, d]
 */
export const computePaddedTfStrings = function (numString, denString) {
  const l1 = numString.length;
  const l2 = denString.length;
  const maxLength = Math.max(l1, l2);
  let n; //numerator
  let h; //horizontal line
  let d; //denominator
  if (maxLength > 40) {
    n = numString;
    h = makeRatioLine(maxLength);
    d = denString;
  } else {
    const maxL1 = maxLength - l1;
    const maxL2 = maxLength - l2;
    n = `${makeSpaceLine(Math.round(maxL1 / 2))}${numString}`.padEnd(maxLength);
    h = `${makeRatioLine(maxLength)}`;
    d = `${makeSpaceLine(Math.round(maxL2 / 2))}${denString}`.padEnd(maxLength);
  }
  return [n, h, d];
};

/**
 * Display a tf (in ratio form), to the console
 */
export const displayTf = function (ratio) {
  //rounding
  const numString = polynomialTermsArrayToStringWithCoeffs(
    getTermsArray(getNumerator(ratio)).map((x) =>
      Number.isFinite(x) ? roundDecimal(x, 3) : x
    )
  );
  const denString = polynomialTermsArrayToStringWithCoeffs(
    getTermsArray(getDenominator(ratio)).map((x) =>
      Number.isFinite(x) ? roundDecimal(x, 3) : x
    )
  );

  const [n, h, d] = computePaddedTfStrings(numString, denString);
  const l1 = numString.length;
  const l2 = denString.length;
  const maxLength = Math.max(l1, l2);
  if (maxLength > 40) {
    console.log(["tf:", n, makeRatioLine(20), d].join("\n"));
  } else {
    console.log([`      ${n}`, `tf:   ${h}`, `      ${d}`].join("\n"));
  }
};

export const printElementValues = (elements) =>
  elements.map((x) => "'" + x.getValue() + "'").join(", ");
