/*
 * Controllio · Open source web drafting table for studying control systems
 */

/*
 * Model / TopBlockService
 */

//
// Top block definition (the circuit elements are stored inside this block)
//
let topBlock;
export const getTopBlock = () => topBlock;
export const setTopBlock = (newTopBlock) => {
  topBlock = newTopBlock;
};
