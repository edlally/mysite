/**
 * Fluid Simulation Bridge
 * This script exposes key fluid simulation functions to the global scope
 * so they can be called from outside the simulation.
 */

(function() {
  // Wait for the fluid simulation to initialize
  function checkFluidInitialized() {
    const TIMEOUT_MS = 5000; // 5 seconds timeout
    const CHECK_INTERVAL_MS = 100; // Check every 100ms
    
    let attempts = 0;
    const maxAttempts = TIMEOUT_MS / CHECK_INTERVAL_MS;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Check for various indicators that the fluid simulation is loaded
      if (window.pointers || window.splatStack || window.gl || window.splat) {
        console.log('Fluid simulation detected, exposing functions');
        
        // Expose key functions globally for external use
        exposeFluidFunctions();
        clearInterval(checkInterval);
      } 
      else if (attempts >= maxAttempts) {
        console.warn('Fluid simulation not detected within timeout period');
        clearInterval(checkInterval);
      }
    }, CHECK_INTERVAL_MS);
  }
  
  // Expose the needed fluid functions to the global scope
  function exposeFluidFunctions() {
    // List of functions we want to expose
    const functionsToExpose = [
      'splat',
      'splatPointer',
      'multipleSplats',
      'updatePointerMoveData',
      'updatePointerDownData',
      'updatePointerUpData'
    ];
    
    // Expose them if they exist
    functionsToExpose.forEach(fnName => {
      if (typeof window[fnName] === 'function') {
        // Function already exposed
        console.log(`Function ${fnName} already exposed`);
      } else {
        // Search for the function in the global scope
        for (const key in window) {
          if (typeof window[key] === 'object' && window[key] !== null) {
            if (typeof window[key][fnName] === 'function') {
              window[fnName] = window[key][fnName];
              console.log(`Exposed function ${fnName}`);
              break;
            }
          }
        }
      }
    });
    
    // Create a synthetic event handler if needed functions aren't found
    if (!window.splatPointer) {
      console.log('Creating synthetic splat handler');
      
      window.splatPointer = function(pointer) {
        if (window.splat && pointer) {
          window.splat(
            pointer.texcoordX || 0.5, 
            pointer.texcoordY || 0.5,
            pointer.deltaX || 0,
            pointer.deltaY || 0,
            pointer.color || [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2]
          );
        }
      };
    }
  }
  
  // Start checking for the fluid simulation
  document.addEventListener('DOMContentLoaded', checkFluidInitialized);
})(); 