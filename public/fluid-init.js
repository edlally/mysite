// Initialize fluid simulation with custom parameters
window.initFluidSimulation = function(customConfig = {}) {
  // Check if canvas exists
  const canvas = document.getElementById('fluid-simulation');
  if (!canvas) {
    console.error('Canvas element with ID fluid-simulation not found');
    return;
  }
  
  // Function to handle window resize
  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
  
  // Call resize initially and on window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Set default config values
  window.fluidConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 4,
    VELOCITY_DISSIPATION: 4,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 2,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0.039, g: 0.039, b: 0.039 }, // #101010
    TRANSPARENT: true,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.025,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
  };
  
  // Override defaults with custom config
  Object.assign(window.fluidConfig, customConfig);
  
  // Set theme colors to match site theme
  const LIME_GREEN = {
    primary: '#CCFF00',
    light: '#DDFF33',
    dark: '#99CC00',
    r: 204/255,
    g: 255/255,
    b: 0/255,
  };
  
  // Set a flag indicating initialization is complete
  window.fluidInitialized = true;
}; 