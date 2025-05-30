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
        // Set up page visibility handling
        setupVisibilityHandling();
        clearInterval(checkInterval);
      } 
      else if (attempts >= maxAttempts) {
        console.warn('Fluid simulation not detected within timeout period');
        clearInterval(checkInterval);
      }
    }, CHECK_INTERVAL_MS);
  }
  
  // Set up page visibility API to pause simulation when tab is inactive
  function setupVisibilityHandling() {
    // Store original multipleSplats function
    if (typeof window.multipleSplats === 'function') {
      window._originalMultipleSplats = window.multipleSplats;
      
      // Replace with visibility-aware version
      window.multipleSplats = function(amount) {
        // Only run if page is visible
        if (!document.hidden) {
          window._originalMultipleSplats(amount);
        } else {
          console.log('Skipping multipleSplats while page is hidden');
        }
      };
      
      console.log('Added visibility control to multipleSplats');
    }
    
    // Set up pause flag
    window.fluidSimPaused = document.hidden;
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      window.fluidSimPaused = document.hidden;
      console.log('Fluid simulation ' + (document.hidden ? 'paused' : 'resumed'));
      
      // If coming back to visible and there's a pending animation frame
      if (!document.hidden && window.update) {
        window.update();
      }
    });
    
    // Patch the update function if it exists
    if (typeof window.update === 'function') {
      const originalUpdate = window.update;
      
      window.update = function() {
        if (!window.fluidSimPaused) {
          originalUpdate();
        }
      };
      console.log('Added visibility control to update loop');
    }
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
      'updatePointerUpData',
      'update'
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