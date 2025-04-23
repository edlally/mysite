/**
 * Fluid Simulation Visibility Controller
 * Handles pausing and resuming the simulation when tab visibility changes
 */

(function() {
  // Configuration
  const config = {
    // How long to wait before attempting to patch the simulation
    initDelay: 1000,
    // How often to check if simulation is ready
    checkInterval: 200,
    // Debug messages
    debug: true
  };

  // Internal state
  let isPageVisible = !document.hidden;
  let animationFrameId = null;
  let originalUpdate = null;
  let originalMultipleSplats = null;
  let checkIntervalId = null;
  let isInitialized = false;

  // Log utility
  function log(...args) {
    if (config.debug) {
      console.log('[FluidVisibility]', ...args);
    }
  }

  // Initialize the visibility controller
  function init() {
    if (isInitialized) return;
    
    log('Initializing visibility controller');
    
    // Set up page visibility listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start with current visibility state
    isPageVisible = !document.hidden;
    
    // Begin checking for the simulation functions
    checkIntervalId = setInterval(checkAndPatchSimulation, config.checkInterval);
    
    isInitialized = true;
  }
  
  // Check if simulation functions exist and patch them
  function checkAndPatchSimulation() {
    // Check for update function
    if (typeof window.update === 'function' && !originalUpdate) {
      patchUpdateFunction();
    }
    
    // Check for multipleSplats function
    if (typeof window.multipleSplats === 'function' && !originalMultipleSplats) {
      patchMultipleSplatsFunction();
    }
    
    // If both patched, clear the interval
    if (originalUpdate && originalMultipleSplats) {
      clearInterval(checkIntervalId);
      log('Successfully patched all simulation functions');
    }
  }
  
  // Patch the main update loop
  function patchUpdateFunction() {
    log('Patching update function');
    
    // Store original update function
    originalUpdate = window.update;
    
    // Replace with visibility-aware version
    window.update = function() {
      if (isPageVisible) {
        // When visible, run the update normally
        originalUpdate();
      } else {
        // When hidden, don't schedule next frame
        cancelAnimationFrame(animationFrameId);
      }
    };
  }
  
  // Patch the multipleSplats function
  function patchMultipleSplatsFunction() {
    log('Patching multipleSplats function');
    
    // Store original function
    originalMultipleSplats = window.multipleSplats;
    
    // Replace with visibility-aware version
    window.multipleSplats = function(amount) {
      if (isPageVisible) {
        originalMultipleSplats(amount);
      } else {
        log('Skipped multipleSplats while page is hidden');
      }
    };
  }
  
  // Handle visibility change
  function handleVisibilityChange() {
    const wasVisible = isPageVisible;
    isPageVisible = !document.hidden;
    
    log('Page visibility changed:', isPageVisible ? 'visible' : 'hidden');
    
    // Resume simulation if becoming visible
    if (isPageVisible && !wasVisible) {
      resumeSimulation();
    }
    
    // Pause simulation if becoming hidden
    if (!isPageVisible && wasVisible) {
      pauseSimulation();
    }
  }
  
  // Pause the simulation
  function pauseSimulation() {
    log('Pausing simulation');
    
    // Cancel any pending animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Inform the simulation it's paused (for other components)
    window.fluidSimPaused = true;
  }
  
  // Resume the simulation
  function resumeSimulation() {
    log('Resuming simulation');
    
    // Clear the paused flag
    window.fluidSimPaused = false;
    
    // Restart the animation loop if it exists
    if (originalUpdate) {
      window.update();
    }
  }
  
  // Start initialization after a delay to ensure other scripts have loaded
  setTimeout(init, config.initDelay);
})(); 