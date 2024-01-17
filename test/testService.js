/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Test / TestService
 */

/**
 * Set the preferred test mode value, in terms of the following options:
 * - "null": run no tests (default)
 * - "jest": run all tests using the Jest framework, by executing the command 'npm test' from the terminal.
 *   NPM is required ('npm install' must be executed first if needed), but no code changes must be done (as if deployment was done with CDN)
 * - "custom-start": run all tests using a simple custom test service at app start. Open the browser's console to see the results
 * - "custom-manual": run all tests manually using a simple custom test service from the browser's console, by executing there "runAllTests()"
 */
const testModes = ["null", "jest", "custom-start", "custom-manual"];
export let testMode = "null";
export const getTestMode = () => testMode;
