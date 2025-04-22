/**
 * Fluid Interaction Helper
 * This script forwards mouse events to the fluid simulation even when content is covering the canvas.
 */

(function() {
  // Configuration
  const settings = {
    // How often to forward events (ms)
    throttleInterval: 16,
    // Minimum mouse movement to create a splat (pixels)
    minMovement: 3, // Reduced for more responsiveness
    // Whether to track velocity for splats
    trackVelocity: true,
    // Colors to use for splats (HSV format)
    colors: [
      { h: 0.7, s: 1, v: 1 },  // Blue-ish
      { h: 0.5, s: 1, v: 1 },  // Cyan/Green
      { h: 0.3, s: 1, v: 1 },  // Lime
    ],
    // Whether to use random colors
    randomizeColors: true,
    // Scale factor for splat velocity 
    velocityScale: 10,
    // Whether to create splats on click
    splatOnClick: true,
    // Whether to create splats on move
    splatOnMove: true,
    // Whether to create splats on touch
    splatOnTouch: true
  };

  // Internal state
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let colorIndex = 0;
  let isInitialized = false;
  let mouseVelocityX = 0;
  let mouseVelocityY = 0;
  let lastSplatTime = 0;
  
  // Initialize the fluid interaction
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    // Add the event listeners to the document body
    document.body.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.body.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.body.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.body.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // Directly add listeners to the fluid background for better tracking
    const fluidBackground = document.querySelector('.fluid-background');
    if (fluidBackground) {
      fluidBackground.addEventListener('mousemove', handleMouseMove, { passive: true });
      fluidBackground.addEventListener('mousedown', handleMouseDown, { passive: true });
      fluidBackground.addEventListener('touchmove', handleTouchMove, { passive: true });
      fluidBackground.addEventListener('touchstart', handleTouchStart, { passive: true });
    }
    
    // Add velocity tracker
    if (settings.trackVelocity) {
      setInterval(updateVelocity, 16);
    }
    
    console.log('Fluid interaction initialized');
  }
  
  // Helper function to throttle function calls
  function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    };
  }
  
  // Helper function to update mouse velocity
  function updateVelocity() {
    // Apply friction to slow down movement
    mouseVelocityX *= 0.98;
    mouseVelocityY *= 0.98;
    
    // Reset if very small
    if (Math.abs(mouseVelocityX) < 0.01) mouseVelocityX = 0;
    if (Math.abs(mouseVelocityY) < 0.01) mouseVelocityY = 0;
  }
  
  // Create a splat at the specified position
  function createSplat(clientX, clientY, deltaX, deltaY) {
    // Get the canvas and check if it exists
    const canvas = document.getElementById('fluid-simulation');
    if (!canvas) return;
    
    // Calculate normalized coordinates
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    
    // Ensure coordinates are within canvas bounds
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    
    // Set velocity based on tracked values or provided deltas
    const dx = deltaX !== undefined ? deltaX : mouseVelocityX;
    const dy = deltaY !== undefined ? deltaY : mouseVelocityY;
    
    // Get or generate color
    let color;
    if (settings.randomizeColors) {
      // Generate a random color
      color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
    } else {
      // Use predefined colors
      const hsv = settings.colors[colorIndex];
      colorIndex = (colorIndex + 1) % settings.colors.length;
      
      // Convert HSV to RGB
      const h = hsv.h;
      const s = hsv.s;
      const v = hsv.v;
      
      // HSV to RGB conversion
      let r, g, b;
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
      }
      
      color = [r, g, b];
    }
    
    // Create splat using available method
    if (window.splat) {
      window.splat(x, y, dx * settings.velocityScale, dy * settings.velocityScale, color);
    } else if (window.splatPointer) {
      const pointer = {
        texcoordX: x,
        texcoordY: y,
        deltaX: dx * settings.velocityScale,
        deltaY: dy * settings.velocityScale,
        color: color
      };
      window.splatPointer(pointer);
    } else {
      console.warn('No splat function available');
    }
  }
  
  // Check if the target element should receive pointer events
  function shouldPassEventToFluid(e) {
    // Elements that should handle their own events
    const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [onclick], label, .interactive';
    
    // Check if the target is in our content wrapper
    const isInContentWrapper = e.target.closest('.content-wrapper');
    
    // Check if the target is an interactive element
    const isInteractive = e.target.closest(interactiveSelectors);
    
    // Pass events to fluid simulation if:
    // 1. Not in content wrapper OR
    // 2. In content wrapper but not on an interactive element
    return !isInContentWrapper || (isInContentWrapper && !isInteractive);
  }
  
  // Handle mouse movement
  const handleMouseMove = throttle((e) => {
    // Only process if this event should be handled by fluid
    if (!shouldPassEventToFluid(e)) return;
    
    // Calculate delta movement
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    
    // Update velocity
    if (settings.trackVelocity) {
      const now = Date.now();
      const dt = Math.max(1, now - lastTime);
      
      mouseVelocityX = deltaX / dt;
      mouseVelocityY = deltaY / dt;
      
      lastTime = now;
    }
    
    // Create a splat if moved significantly
    if (settings.splatOnMove && 
        (Math.abs(deltaX) > settings.minMovement || 
         Math.abs(deltaY) > settings.minMovement)) {
      
      // Limit splat frequency
      const now = Date.now();
      if (now - lastSplatTime > 20) { // Max 50 splats per second
        createSplat(e.clientX, e.clientY, deltaX / 10, deltaY / 10);
        lastSplatTime = now;
      }
    }
    
    // Update last position
    lastX = e.clientX;
    lastY = e.clientY;
  }, settings.throttleInterval);
  
  // Handle mouse clicks
  const handleMouseDown = throttle((e) => {
    // Only process if this event should be handled by fluid
    if (!shouldPassEventToFluid(e)) return;
    
    if (settings.splatOnClick) {
      // Create a splat at the clicked position
      createSplat(e.clientX, e.clientY, 0, 0);
    }
  }, 50);
  
  // Handle touch movement
  const handleTouchMove = throttle((e) => {
    // Only process if this event should be handled by fluid
    if (!shouldPassEventToFluid(e)) return;
    
    if (settings.splatOnTouch && e.touches && e.touches[0]) {
      const touch = e.touches[0];
      
      // Calculate delta movement
      const deltaX = touch.clientX - lastX;
      const deltaY = touch.clientY - lastY;
      
      // Create a splat if moved significantly
      if (Math.abs(deltaX) > settings.minMovement || 
          Math.abs(deltaY) > settings.minMovement) {
        createSplat(touch.clientX, touch.clientY, deltaX / 10, deltaY / 10);
      }
      
      // Update last position
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
  }, settings.throttleInterval);
  
  // Handle touch start
  const handleTouchStart = throttle((e) => {
    // Only process if this event should be handled by fluid
    if (!shouldPassEventToFluid(e)) return;
    
    if (settings.splatOnTouch && e.touches && e.touches[0]) {
      const touch = e.touches[0];
      
      // Create a splat at the touch position
      createSplat(touch.clientX, touch.clientY, 0, 0);
      
      // Initialize last position
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
  }, 50);
  
  // Initialize after the page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the fluid simulation to initialize
    setTimeout(init, 1000);
  });
})(); 