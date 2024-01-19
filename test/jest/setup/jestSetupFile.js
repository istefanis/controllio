/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / Jest / Setup / JestSetupFile
 */

// Import various missing dependencies
import { TextEncoder, TextDecoder } from "util";
import ResizeObserver from "resize-observer-polyfill";
import "jest-canvas-mock";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ResizeObserver = ResizeObserver;
