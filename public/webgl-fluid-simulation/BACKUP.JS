/*
MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

// Define the lime green color theme constants at the top for use throughout the app
const LIME_GREEN = {
    primary: '#CCFF00',  // Main lime green color
    light: '#DDFF33',    // Lighter shade
    dark: '#99CC00',     // Darker shade
    r: 204/255,          // Red component
    g: 255/255,          // Green component
    b: 0/255,            // Blue component
};

// Store the original display material for brightness control
let originalDisplayMaterial = null;
let brightnessMultiplier = 1.0;  // Default multiplier (full brightness)

// Audio analyzer configuration
const AUDIO = {
    ENABLED: true,           // Toggle for audio reactivity (enabled by default)
    FFT_SIZE: 1024*8,          // Size of FFT (larger = more detail)
    BASS_RANGE: [0, 10],     // Bass frequency range index
    MID_RANGE: [10, 100],    // Mid frequency range index
    HIGH_RANGE: [100, 300],  // High frequency range index
    BASS_MULTIPLIER: 4.0,    // Bass impact multiplier
    MID_MULTIPLIER: 2.5,     // Mid frequency impact multiplier
    HIGH_MULTIPLIER: 2.0,    // High frequency impact multiplier (increased for Flume)
    THRESHOLD: 0.12,         // Minimum amplitude to trigger a reaction (lower for Flume)
    SMOOTHING: 0.8,          // How much to smooth the frequency data
    AUTO_KICK: false,        // Generate periodic kicks when no strong bass is detected
    AUDIO_FILE: '../audio/dead_prez_-_Hip_Hop_Digital_Video.mp3', // Path to audio file
    KICK_DETECTION: {
        ENABLED: true,
        THRESHOLD: 0.22,     // Energy threshold to detect a kick (lower for Flume)
        DECAY: 0.95,         // How quickly the threshold decays (faster for electronic music)
        MIN_INTERVAL: 0,   // Minimum time between kicks (ms) (shorter for Flume)
    }
};

// Audio analyzer class to process audio input
class AudioAnalyser {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.audioSource = null;
        this.dataArray = null;
        this.initialized = false;
        
        // Energy levels for different frequency bands
        this.bassEnergy = 0;
        this.midEnergy = 0;
        this.highEnergy = 0;
        
        // Smoothed values for more pleasing visuals
        this.smoothedBass = 0;
        this.smoothedMid = 0;
        this.smoothedHigh = 0;
        
        // Kick detection
        this.kickDetected = false;
        this.lastKickTime = 0;
        this.kickThreshold = 0;
        this.lastBassValue = 0;
        
        // Audio element
        this.audioElement = null;
    }
    
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyzer
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = AUDIO.FFT_SIZE;
            this.analyser.smoothingTimeConstant = AUDIO.SMOOTHING;
            
            // Create audio element for the audio file
            this.audioElement = document.createElement('audio');
            this.audioElement.src = AUDIO.AUDIO_FILE;
            this.audioElement.loop = true;
            this.audioElement.crossOrigin = 'anonymous';
            document.body.appendChild(this.audioElement);
            
            // Create source from audio element
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Create buffer for frequency data
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.initialized = true;
            console.log('Audio analyzer initialized with audio file');
            
            // Add visual indicator that audio is enabled
            this.addAudioIndicator();
            
            // Add audio controls
            this.addAudioControls();
            
            // Play the audio
            this.playAudio();
            
            return true;
        } catch (error) {
            console.error('Error initializing audio analyzer:', error);
            return false;
        }
    }
    
    playAudio() {
        if (this.audioElement) {
            // Start audio playback
            this.audioElement.play().catch(e => {
                console.error('Error playing audio:', e);
                // Display a message to the user
                const message = document.createElement('div');
                message.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: ${LIME_GREEN.primary};
                    padding: 15px;
                    border-radius: 5px;
                    font-family: Arial, sans-serif;
                    z-index: 1000;
                    text-align: center;
                    border: 1px solid ${LIME_GREEN.primary};
                `;
                message.innerHTML = `
                    Click anywhere to start audio<br>
                    <small>(Browser requires user interaction to play audio)</small>
                `;
                document.body.appendChild(message);
                
                // Add click listener to start audio
                const startAudio = () => {
                    this.audioContext.resume().then(() => {
                        this.audioElement.play();
                        document.body.removeChild(message);
                        document.removeEventListener('click', startAudio);
                    });
                };
                document.addEventListener('click', startAudio);
            });
        }
    }
    
    addAudioControls() {
        // Create audio controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'audio-controls';
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: ${LIME_GREEN.primary};
            padding: 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            z-index: 1000;
            display: flex;
            align-items: center;
            border: 1px solid ${LIME_GREEN.primary};
        `;
        
        // Create play/pause button
        const playButton = document.createElement('button');
        playButton.innerHTML = '⏸️';
        playButton.title = 'Pause/Play';
        playButton.style.cssText = `
            background-color: transparent;
            color: ${LIME_GREEN.primary};
            border: none;
            font-size: 24px;
            cursor: pointer;
            margin-right: 10px;
            outline: none;
        `;
        playButton.addEventListener('click', () => {
            if (this.audioElement.paused) {
                this.audioElement.play();
                playButton.innerHTML = '⏸️';
            } else {
                this.audioElement.pause();
                playButton.innerHTML = '▶️';
            }
        });
        
        // Volume slider
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 1;
        volumeSlider.step = 0.01;
        volumeSlider.value = 0.7; // Default volume
        volumeSlider.style.cssText = `
            width: 80px;
            accent-color: ${LIME_GREEN.primary};
        `;
        this.audioElement.volume = volumeSlider.value;
        volumeSlider.addEventListener('input', () => {
            this.audioElement.volume = volumeSlider.value;
        });
        
        // Add controls to container
        controlsContainer.appendChild(playButton);
        controlsContainer.appendChild(volumeSlider);
        document.body.appendChild(controlsContainer);
    }
    
    addAudioIndicator() {
        // Create audio active indicator
        const indicator = document.createElement('div');
        indicator.className = 'audio-active';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: ${LIME_GREEN.primary};
            opacity: 0.8;
            box-shadow: 0 0 5px ${LIME_GREEN.primary};
            z-index: 1000;
        `;
        document.body.appendChild(indicator);
        
        // Create pulsing animation
        setInterval(() => {
            indicator.style.opacity = this.kickDetected ? '1' : '0.5';
            indicator.style.boxShadow = `0 0 ${5 + this.bassEnergy * 15}px ${LIME_GREEN.primary}`;
            
            // Make indicator larger when kick is detected
            indicator.style.width = this.kickDetected ? '15px' : '10px';
            indicator.style.height = this.kickDetected ? '15px' : '10px';
            
            // Reset kick detection flag for visual purposes
            this.kickDetected = false;
        }, 50);
    }
    
    update() {
        if (!this.initialized || !this.audioElement || this.audioElement.paused) return;
        
        // Check if audio context is suspended (browser may auto-suspend it)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate energy in different frequency bands
        this.bassEnergy = this.calculateBandEnergy(AUDIO.BASS_RANGE[0], AUDIO.BASS_RANGE[1]);
        this.midEnergy = this.calculateBandEnergy(AUDIO.MID_RANGE[0], AUDIO.MID_RANGE[1]);
        this.highEnergy = this.calculateBandEnergy(AUDIO.HIGH_RANGE[0], AUDIO.HIGH_RANGE[1]);
        
        // Apply smoothing for more pleasing visual transitions
        this.smoothedBass = this.smoothedBass * AUDIO.SMOOTHING + this.bassEnergy * (1 - AUDIO.SMOOTHING);
        this.smoothedMid = this.smoothedMid * AUDIO.SMOOTHING + this.midEnergy * (1 - AUDIO.SMOOTHING);
        this.smoothedHigh = this.smoothedHigh * AUDIO.SMOOTHING + this.highEnergy * (1 - AUDIO.SMOOTHING);
        
        // Detect kick drum using energy differential
        this.detectKick();
    }
    
    calculateBandEnergy(startIndex, endIndex) {
        let sum = 0;
        for (let i = startIndex; i < endIndex && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / ((endIndex - startIndex) * 255); // Normalize to 0-1
    }
    
    detectKick() {
        // Skip if kick detection is disabled
        if (!AUDIO.KICK_DETECTION.ENABLED) return false;
        
        const now = Date.now();
        
        // Adaptive threshold for kick detection
        this.kickThreshold = Math.max(
            AUDIO.KICK_DETECTION.THRESHOLD,
            this.kickThreshold * AUDIO.KICK_DETECTION.DECAY
        );
        
        // Calculate bass differential - the rate of change in bass energy
        // This helps detect sudden bass spikes which are typical of kick drums
        const bassDiff = this.bassEnergy - this.lastBassValue;
        this.lastBassValue = this.bassEnergy;
        
        // Detect kick when:
        // 1. Bass energy exceeds threshold
        // 2. There's a significant increase in bass energy
        // 3. Enough time has passed since the last kick
        if (
            this.bassEnergy > this.kickThreshold &&
            bassDiff > 0.02 &&
            now - this.lastKickTime > AUDIO.KICK_DETECTION.MIN_INTERVAL
        ) {
            this.kickDetected = true;
            this.lastKickTime = now;
            
            // Update threshold based on this kick's energy
            this.kickThreshold = Math.max(this.bassEnergy, AUDIO.KICK_DETECTION.THRESHOLD);
            
            return true;
        }
        
        return false;
    }
    
    hasKick() {
        return this.kickDetected;
    }
}

// Function to apply the lime green theme to the application
function applyLimeGreenTheme() {
    // Add a stylesheet with lime green color rules
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .dg.ac {
            border-color: ${LIME_GREEN.primary} !important;
        }
        
        .dg.main .close-button {
            background-color: #101010 !important;
            color: ${LIME_GREEN.primary} !important;
        }
        
        .dg.main .close-button:hover {
            background-color: #202020 !important;
        }
        
        .dg.main .close-button::after {
            color: ${LIME_GREEN.primary} !important;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Set document theme color for mobile browsers
    const themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#101010';
    document.head.appendChild(themeColorMeta);
}

// Create a global audio analyzer instance
const audioAnalyser = new AudioAnalyser();

// Call the function to apply the theme
applyLimeGreenTheme();

// Initialize audio analyzer when the page is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (AUDIO.ENABLED) {
        await audioAnalyser.initialize();
    }
});

// Mobile promo section
let promoPopup;
let promoPopupClose;

// Check if elements exist before trying to use them
const hasPromo = document.getElementsByClassName('promo').length > 0;
if (hasPromo) {
    promoPopup = document.getElementsByClassName('promo')[0];
    promoPopupClose = document.getElementsByClassName('promo-close')[0];

    if (isMobile()) {
        setTimeout(() => {
            promoPopup.style.display = 'table';
        }, 20000);
    }

    promoPopupClose.addEventListener('click', e => {
        promoPopup.style.display = 'none';
    });

    const appleLink = document.getElementById('apple_link');
    if (appleLink) {
        appleLink.addEventListener('click', e => {
            if (typeof ga !== 'undefined') {
                ga('send', 'event', 'link promo', 'app');
            }
            window.open('https://apps.apple.com/us/app/fluid-simulation/id1443124993');
        });
    }

    const googleLink = document.getElementById('google_link');
    if (googleLink) {
        googleLink.addEventListener('click', e => {
            if (typeof ga !== 'undefined') {
                ga('send', 'event', 'link promo', 'app');
            }
            window.open('https://play.google.com/store/apps/details?id=games.paveldogreat.fluidsimfree');
        });
    }
}

// Simulation section

// Use the specific canvas element with ID 'fluid-simulation' instead of the first canvas
const canvas = document.getElementById('fluid-simulation');
if (!canvas) {
    console.error('Canvas element with ID fluid-simulation not found');
}
resizeCanvas();

let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 4,
    VELOCITY_DISSIPATION: 3.6,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 2,
    SPLAT_RADIUS: 0.07,
    SPLAT_FORCE: 6000,
    GRAVITY_FIELD: true,        // Enable gravity field
    GRAVITY_STRENGTH: 1.0,      // Default strength of gravity effect
    GRAVITY_THRESHOLD: 0.01,    // Speed threshold for gravity direction
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 100,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.3,
    BLOOM_THRESHOLD: 0.7,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
}

function pointerPrototype () {
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
}

let pointers = [];
let splatStack = [];
pointers.push(new pointerPrototype());

const { gl, ext } = getWebGLContext(canvas);

if (isMobile()) {
    config.DYE_RESOLUTION = 512;
}
if (!ext.supportLinearFiltering) {
    config.DYE_RESOLUTION = 512;
    config.SHADING = false;
    config.BLOOM = false;
    config.SUNRAYS = false;
}

startGUI();

function getWebGLContext (canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
        gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2)
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    // Send GA event only if GA is available
    function sendGAEvent() {
        if (typeof ga !== 'undefined') {
            ga.apply(null, arguments);
        }
    }

    // Check if WebGL2 is supported and send analytics event
    if (typeof ga !== 'undefined') {
        const isWebGL2 = !!gl;
        const formatSupported = ext.formatRGBA != null ? 'supported' : 'not supported';
        sendGAEvent('send', 'event', isWebGL2 ? 'webgl2' : 'webgl', formatSupported);
    }

    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };
}

function getSupportedFormat (gl, internalFormat, format, type)
{
    if (!supportRenderTextureFormat(gl, internalFormat, format, type))
    {
        switch (internalFormat)
        {
            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }
    }

    return {
        internalFormat,
        format
    }
}

function supportRenderTextureFormat (gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
}

function startGUI () {
    try {
        var gui = new dat.GUI({ width: 300 });
        
        // Customize the GUI colors to match the lime green theme
        gui.domElement.style.setProperty('--background-color', '#101010');
        gui.domElement.style.setProperty('--text-color', LIME_GREEN.primary);
        gui.domElement.style.setProperty('--hover-color', LIME_GREEN.light);
        
        gui.add(config, 'DYE_RESOLUTION', { 'high': 1024, 'medium': 512, 'low': 256, 'very low': 128 }).name('quality').onFinishChange(initFramebuffers);
        gui.add(config, 'SIM_RESOLUTION', { '32': 32, '64': 64, '128': 128, '256': 256 }).name('sim resolution').onFinishChange(initFramebuffers);
        gui.add(config, 'DENSITY_DISSIPATION', 0, 4.0).name('density diffusion');
        gui.add(config, 'VELOCITY_DISSIPATION', 0, 4.0).name('velocity diffusion');
        gui.add(config, 'PRESSURE', 0.0, 1.0).name('pressure');
        gui.add(config, 'CURL', 0, 50).name('vorticity').step(1);
        gui.add(config, 'SPLAT_RADIUS', 0.01, 1.0).name('splat radius');
        
        // Add gravity field controls
        let gravityFolder = gui.addFolder('Gravity Field');
        gravityFolder.add(config, 'GRAVITY_FIELD').name('enabled');
        gravityFolder.add(config, 'GRAVITY_STRENGTH', 0.1, 5.0).name('strength');
        
        gui.add(config, 'SHADING').name('shading').onFinishChange(updateKeywords);
        gui.add(config, 'COLORFUL').name('colorful');
        gui.add(config, 'PAUSED').name('paused').listen();

        gui.add({ fun: () => {
            splatStack.push(4 + Math.floor(Math.random() * 2)); // Will create either 4 or 5 splats
        } }, 'fun').name('Random splats');
        
        // Audio reactivity controls
        let audioFolder = gui.addFolder('Audio Reactivity');
        audioFolder.add(AUDIO, 'ENABLED').name('enabled').onChange(async (value) => {
            if (value && !audioAnalyser.initialized) {
                await audioAnalyser.initialize();
            }
        });
        audioFolder.add(AUDIO, 'BASS_MULTIPLIER', 0, 10).name('bass impact');
        audioFolder.add(AUDIO, 'MID_MULTIPLIER', 0, 10).name('mid impact');
        audioFolder.add(AUDIO, 'HIGH_MULTIPLIER', 0, 10).name('high impact');
        audioFolder.add(AUDIO, 'THRESHOLD', 0, 1).name('sensitivity');
        audioFolder.add(AUDIO, 'AUTO_KICK').name('auto kick');

        let bloomFolder = gui.addFolder('Bloom');
        bloomFolder.add(config, 'BLOOM').name('enabled').onFinishChange(updateKeywords);
        bloomFolder.add(config, 'BLOOM_INTENSITY', 0.1, 2.0).name('intensity');
        bloomFolder.add(config, 'BLOOM_THRESHOLD', 0.0, 1.0).name('threshold');

        let sunraysFolder = gui.addFolder('Sunrays');
        sunraysFolder.add(config, 'SUNRAYS').name('enabled').onFinishChange(updateKeywords);
        sunraysFolder.add(config, 'SUNRAYS_WEIGHT', 0.3, 1.0).name('weight');

        let captureFolder = gui.addFolder('Capture');
        captureFolder.addColor(config, 'BACK_COLOR').name('background color');
        captureFolder.add(config, 'TRANSPARENT').name('transparent');
        captureFolder.add({ fun: captureScreenshot }, 'fun').name('take screenshot');

        let github = gui.add({ fun : () => {
            window.open('https://github.com/PavelDoGreat/WebGL-Fluid-Simulation');
            sendGAEvent('send', 'event', 'link button', 'github');
        } }, 'fun').name('Github');
        github.__li.className = 'cr function bigFont';
        github.__li.style.borderLeft = '3px solid ' + LIME_GREEN.primary;
        let githubIcon = document.createElement('span');
        github.domElement.parentElement.appendChild(githubIcon);
        githubIcon.className = 'icon github';

        let twitter = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'twitter');
            window.open('https://twitter.com/PavelDoGreat');
        } }, 'fun').name('Twitter');
        twitter.__li.className = 'cr function bigFont';
        twitter.__li.style.borderLeft = '3px solid ' + LIME_GREEN.primary;
        let twitterIcon = document.createElement('span');
        twitter.domElement.parentElement.appendChild(twitterIcon);
        twitterIcon.className = 'icon twitter';

        let discord = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'discord');
            window.open('https://discordapp.com/invite/CeqZDDE');
        } }, 'fun').name('Discord');
        discord.__li.className = 'cr function bigFont';
        discord.__li.style.borderLeft = '3px solid ' + LIME_GREEN.primary;
        let discordIcon = document.createElement('span');
        discord.domElement.parentElement.appendChild(discordIcon);
        discordIcon.className = 'icon discord';

        let app = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'app');
            window.open('http://onelink.to/5b58bn');
        } }, 'fun').name('Check out mobile app');
        app.__li.className = 'cr function appBigFont';
        app.__li.style.borderLeft = '3px solid ' + LIME_GREEN.primary;
        let appIcon = document.createElement('span');
        app.domElement.parentElement.appendChild(appIcon);
        appIcon.className = 'icon app';

        if (isMobile())
            gui.close();
    } catch (e) {
        console.error('Error initializing GUI:', e);
    }
}

function isMobile () {
    return /Mobi|Android/i.test(navigator.userAgent);
}

function captureScreenshot () {
    let res = getResolution(config.CAPTURE_RESOLUTION);
    let target = createFBO(res.width, res.height, ext.formatRGBA.internalFormat, ext.formatRGBA.format, ext.halfFloatTexType, gl.NEAREST);
    render(target);

    let texture = framebufferToTexture(target);
    texture = normalizeTexture(texture, target.width, target.height);

    let captureCanvas = textureToCanvas(texture, target.width, target.height);
    let datauri = captureCanvas.toDataURL();
    downloadURI('fluid.png', datauri);
    URL.revokeObjectURL(datauri);
}

function framebufferToTexture (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    let length = target.width * target.height * 4;
    let texture = new Float32Array(length);
    gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, texture);
    return texture;
}

function normalizeTexture (texture, width, height) {
    let result = new Uint8Array(texture.length);
    let id = 0;
    for (let i = height - 1; i >= 0; i--) {
        for (let j = 0; j < width; j++) {
            let nid = i * width * 4 + j * 4;
            result[nid + 0] = clamp01(texture[id + 0]) * 255;
            result[nid + 1] = clamp01(texture[id + 1]) * 255;
            result[nid + 2] = clamp01(texture[id + 2]) * 255;
            result[nid + 3] = clamp01(texture[id + 3]) * 255;
            id += 4;
        }
    }
    return result;
}

function clamp01 (input) {
    return Math.min(Math.max(input, 0), 1);
}

function textureToCanvas (texture, width, height) {
    let captureCanvas = document.createElement('canvas');
    let ctx = captureCanvas.getContext('2d');
    captureCanvas.width = width;
    captureCanvas.height = height;

    let imageData = ctx.createImageData(width, height);
    imageData.data.set(texture);
    ctx.putImageData(imageData, 0, 0);

    return captureCanvas;
}

function downloadURI (filename, uri) {
    let link = document.createElement('a');
    link.download = filename;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

class Material {
    constructor (vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
    }

    setKeywords (keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null)
        {
            let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
    }

    bind () {
        gl.useProgram(this.activeProgram);
    }
}

class Program {
    constructor (vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
    }

    bind () {
        gl.useProgram(this.program);
    }
}

function createProgram (vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.trace(gl.getProgramInfoLog(program));

    return program;
}

function getUniforms (program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}

function compileShader (type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.trace(gl.getShaderInfoLog(shader));

    return shader;
};

function addKeywords (source, keywords) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach(keyword => {
        keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
}

const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const blurVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const blurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
    }
`);

const copyShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`);

const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`);

const colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`);

const checkerboardShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float aspectRatio;

    #define SCALE 25.0

    void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
    }
`);

const displayShaderSource = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uSunrays;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;
    uniform float brightnessMultiplier; // Brightness adjustment

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

    #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
    #endif

    #ifdef SUNRAYS
        float sunrays = texture2D(uSunrays, vUv).r;
        c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
    #endif

    #ifdef BLOOM
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
    #endif

        // Apply brightness multiplier
        c *= brightnessMultiplier;

        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
    }
`;

const bloomPrefilterShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`);

const bloomBlurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`);

const bloomFinalShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`);

const sunraysMaskShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec4 c = texture2D(uTexture, vUv);
        float br = max(c.r, max(c.g, c.b));
        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
        gl_FragColor = c;
    }
`);

const sunraysShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float weight;

    #define ITERATIONS 16

    void main () {
        float Density = 0.3;
        float Decay = 0.95;
        float Exposure = 0.7;

        vec2 coord = vUv;
        vec2 dir = vUv - 0.5;

        dir *= 1.0 / float(ITERATIONS) * Density;
        float illuminationDecay = 1.0;

        float color = texture2D(uTexture, vUv).a;

        for (int i = 0; i < ITERATIONS; i++)
        {
            coord -= dir;
            float col = texture2D(uTexture, coord).a;
            color += col * illuminationDecay * weight;
            illuminationDecay *= Decay;
        }

        gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
    }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`,
    ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
);

const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`);

const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`);

const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`);

const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const gravityFieldShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform vec2 point;
    uniform float strength;
    uniform float threshold;

    void main () {
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        
        // Vector from current position to cursor
        vec2 distVector = point - vUv;
        
        // Distance falloff effect - stronger near cursor
        float dist = length(distVector);
        float influence = 1.0 / (1.0 + 20.0 * dist * dist);
        
        // Normalize direction vector
        vec2 direction = dist > 0.0 ? normalize(distVector) : vec2(0.0);
        
        // Calculate speed at cursor position by sampling velocity at cursor location
        vec2 cursorVelocity = texture2D(uVelocity, point).xy;
        float cursorSpeed = length(cursorVelocity);
        
        // Determine if gravity should pull or push based on cursor speed
        // Higher speeds create an attractive force, lower speeds create repulsive force
        float factor = cursorSpeed > threshold ? 1.0 : -1.0;
        
        // Apply gravitational force
        velocity += direction * influence * strength * factor;
        
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (target, clear = false) => {
        if (target == null)
        {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        else
        {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear)
        {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        // CHECK_FRAMEBUFFER_STATUS();
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
})();

function CHECK_FRAMEBUFFER_STATUS () {
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE)
        console.trace("Framebuffer error: " + status);
}

let dye;
let velocity;
let divergence;
let curl;
let pressure;
let bloom;
let bloomFramebuffers = [];
let sunrays;
let sunraysTemp;

let ditheringTexture = createTextureAsync('LDR_LLL1_0.png');

const blurProgram            = new Program(blurVertexShader, blurShader);
const copyProgram            = new Program(baseVertexShader, copyShader);
const clearProgram           = new Program(baseVertexShader, clearShader);
const colorProgram           = new Program(baseVertexShader, colorShader);
const checkerboardProgram    = new Program(baseVertexShader, checkerboardShader);
const bloomPrefilterProgram  = new Program(baseVertexShader, bloomPrefilterShader);
const bloomBlurProgram       = new Program(baseVertexShader, bloomBlurShader);
const bloomFinalProgram      = new Program(baseVertexShader, bloomFinalShader);
const sunraysMaskProgram     = new Program(baseVertexShader, sunraysMaskShader);
const sunraysProgram         = new Program(baseVertexShader, sunraysShader);
const splatProgram           = new Program(baseVertexShader, splatShader);
const advectionProgram       = new Program(baseVertexShader, advectionShader);
const divergenceProgram      = new Program(baseVertexShader, divergenceShader);
const curlProgram            = new Program(baseVertexShader, curlShader);
const vorticityProgram       = new Program(baseVertexShader, vorticityShader);
const pressureProgram        = new Program(baseVertexShader, pressureShader);
const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
const gravityFieldProgram    = new Program(baseVertexShader, gravityFieldShader);

// Original displayMaterial declaration
let displayMaterial;

// Initialize the displayMaterial
function initDisplayMaterial() {
    // Initialize the displayMaterial with the display shader
    displayMaterial = new Material(baseVertexShader, displayShaderSource);
    
    // Set default brightness multiplier to 1.0 (full brightness)
    displayMaterial.setKeywords([]);  // Initialize with no keywords
    displayMaterial.bind();
    
    if (displayMaterial.uniforms.brightnessMultiplier !== undefined) {
        gl.uniform1f(displayMaterial.uniforms.brightnessMultiplier, 1.0);
    }
    
    // Then update the keywords
    updateKeywords();
}

function initFramebuffers () {
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba    = ext.formatRGBA;
    const rg      = ext.formatRG;
    const r       = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (dye == null)
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    else
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

    if (velocity == null)
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    else
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

    divergence = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    curl       = createFBO      (simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    pressure   = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

    initBloomFramebuffers();
    initSunraysFramebuffers();
}

function initBloomFramebuffers () {
    let res = getResolution(config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);

    bloomFramebuffers.length = 0;
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++)
    {
        let width = res.width >> (i + 1);
        let height = res.height >> (i + 1);

        if (width < 2 || height < 2) break;

        let fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
        bloomFramebuffers.push(fbo);
    }
}

function initSunraysFramebuffers () {
    let res = getResolution(config.SUNRAYS_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    sunrays     = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
    sunraysTemp = createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering);
}

function createFBO (w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

function createDoubleFBO (w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read () {
            return fbo1;
        },
        set read (value) {
            fbo1 = value;
        },
        get write () {
            return fbo2;
        },
        set write (value) {
            fbo2 = value;
        },
        swap () {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}

function resizeFBO (target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO);
    return newFBO;
}

function resizeDoubleFBO (target, w, h, internalFormat, format, type, param) {
    if (target.width == w && target.height == h)
        return target;
    target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
}

function createTextureAsync (url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

    let obj = {
        texture,
        width: 1,
        height: 1,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };

    let image = new Image();
    image.onload = () => {
        obj.width = image.width;
        obj.height = image.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
    image.src = url;

    return obj;
}

function updateKeywords () {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    if (config.SUNRAYS) displayKeywords.push("SUNRAYS");
    
    if (displayMaterial) {
        displayMaterial.setKeywords(displayKeywords);
    }
}

// Update the initialization order in the main code
initFramebuffers();
multipleSplats(4 + Math.floor(Math.random() * 2)); // 4 or 5 initial splats

let lastUpdateTime = Date.now();
let colorUpdateTimer = 0.0;

// Initialize displayMaterial first
initDisplayMaterial();
update();

function update () {
    const dt = calcDeltaTime();
    if (resizeCanvas())
        initFramebuffers();
    updateColors(dt);
    
    // Update audio analyzer if enabled
    if (AUDIO.ENABLED) {
        audioAnalyser.update();
        processAudioReactions();
    }
    
    applyInputs();
    if (!config.PAUSED)
        step(dt);
    render(null);
    requestAnimationFrame(update);
}

function calcDeltaTime () {
    let now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
}

function resizeCanvas () {
    let width = scaleByPixelRatio(canvas.clientWidth);
    let height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

function updateColors (dt) {
    if (!config.COLORFUL) return;

    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach(p => {
            p.color = generateColor();
        });
    }
}

function applyInputs () {
    if (splatStack.length > 0)
        multipleSplats(splatStack.pop());

    pointers.forEach(p => {
        // With hover, we process any pointer movement
        if (p.moved) {
            // Reset moved flag after processing
            p.moved = false;
            // Only create splats if there's enough movement to be visible
            // This prevents tiny cursor movements from creating effects
            if (Math.abs(p.deltaX) > 0.001 || Math.abs(p.deltaY) > 0.001) {
                splatPointer(p);
            }
        }
    });
}

function step (dt) {
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // Apply gravity field effect if enabled
    if (config.GRAVITY_FIELD && pointers[0].moved) {
        gravityFieldProgram.bind();
        gl.uniform1i(gravityFieldProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform2f(gravityFieldProgram.uniforms.point, pointers[0].texcoordX, pointers[0].texcoordY);
        gl.uniform1f(gravityFieldProgram.uniforms.strength, config.GRAVITY_STRENGTH);
        gl.uniform1f(gravityFieldProgram.uniforms.threshold, config.GRAVITY_THRESHOLD);
        blit(velocity.write);
        velocity.swap();
    }

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
}

function render (target) {
    if (config.BLOOM)
        applyBloom(dye.read, bloom);
    if (config.SUNRAYS) {
        applySunrays(dye.read, dye.write, sunrays);
        blur(sunrays, sunraysTemp, 1);
    }

    if (target == null || !config.TRANSPARENT) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }
    else {
        gl.disable(gl.BLEND);
    }

    if (!config.TRANSPARENT)
        drawColor(target, normalizeColor(config.BACK_COLOR));
    if (target == null && config.TRANSPARENT)
        drawCheckerboard(target);
    drawDisplay(target);
}

function drawColor (target, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(target);
}

function drawCheckerboard (target) {
    checkerboardProgram.bind();
    gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    blit(target);
}

function drawDisplay (target) {
    let width = target == null ? gl.drawingBufferWidth : target.width;
    let height = target == null ? gl.drawingBufferHeight : target.height;

    displayMaterial.bind();
    if (config.SHADING)
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
    
    // Apply brightness adjustment
    if (displayMaterial.uniforms.brightnessMultiplier)
        gl.uniform1f(displayMaterial.uniforms.brightnessMultiplier, brightnessMultiplier);
    
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
        gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
        let scale = getTextureScale(ditheringTexture, width, height);
        gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS)
        gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    blit(target);
}

function applyBloom (source, destination) {
    if (bloomFramebuffers.length < 2)
        return;

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    blit(last);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
        let dest = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        blit(dest);
        last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
        let baseTex = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        gl.viewport(0, 0, baseTex.width, baseTex.height);
        blit(baseTex);
        last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    blit(destination);
}

function applySunrays (source, mask, destination) {
    gl.disable(gl.BLEND);
    sunraysMaskProgram.bind();
    gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    blit(mask);

    sunraysProgram.bind();
    gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
    gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
    blit(destination);
}

function blur (target, temp, iterations) {
    blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
        gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
        gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
        blit(temp);

        gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
        gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
        blit(target);
    }
}

function splatPointer (pointer) {
    let dx = pointer.deltaX * config.SPLAT_FORCE * 0.5;
    let dy = pointer.deltaY * config.SPLAT_FORCE * 0.5;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
}

function multipleSplats (amount) {
    // Instead of creating all splats at once, we'll create them with a small delay
    let i = 0;
    
    function createNextSplat() {
        if (i >= amount) return;
        
        // Generate an x,y coordinate
        const x = Math.random();
        const y = Math.random();
        
        // Northern Lights color palette (in order of layers - deep to surface)
        const auroraColors = [
            { r: 0x01, g: 0x21, b: 0x3a }, // #01213a - deepest layer
            { r: 0x01, g: 0x41, b: 0x1f }, // #01411f
            { r: 0x00, g: 0x5d, b: 0x55 }, // #005d55
            { r: 0x08, g: 0xaf, b: 0xa8 }, // #08afa8
            { r: 0xcc, g: 0xff, b: 0x00 }  // #ccff00 - surface layer
        ];
        
        // Use y-position to select color layer
        // Bottom of screen = deeper colors, top = brighter colors
        const colorIndex = Math.min(
            Math.floor(y * auroraColors.length),
            auroraColors.length - 1
        );
        const baseColor = auroraColors[colorIndex];
        
        // Vary brightness slightly
        const brightness = 0.7 + Math.random() * 0.3;
        const color = {
            r: (baseColor.r / 255) * brightness,
            g: (baseColor.g / 255) * brightness,
            b: (baseColor.b / 255) * brightness
        };
        
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
        
        // Schedule the next splat with a small random delay
        i++;
        setTimeout(createNextSplat, 20 + Math.random() * 40); // Random delay between 20-60ms
    }
    
    // Start the sequence
    createNextSplat();
}

function splat (x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
}

function correctRadius (radius) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1)
        radius *= aspectRatio;
    return radius;
}

canvas.addEventListener('mousedown', e => {
    let posX = scaleByPixelRatio(e.offsetX);
    let posY = scaleByPixelRatio(e.offsetY);
    let pointer = pointers.find(p => p.id == -1);
    if (pointer == null)
        pointer = new pointerPrototype();
    updatePointerDownData(pointer, -1, posX, posY);
});

canvas.addEventListener('mousemove', e => {
    let pointer = pointers[0];
    let posX = scaleByPixelRatio(e.offsetX);
    let posY = scaleByPixelRatio(e.offsetY);
    updatePointerMoveData(pointer, posX, posY);
    pointer.moved = true;
});

window.addEventListener('mouseup', () => {
    updatePointerUpData(pointers[0]);
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    while (touches.length >= pointers.length)
        pointers.push(new pointerPrototype());
    for (let i = 0; i < touches.length; i++) {
        let posX = scaleByPixelRatio(touches[i].pageX);
        let posY = scaleByPixelRatio(touches[i].pageY);
        updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touches = e.targetTouches;
    for (let i = 0; i < touches.length; i++) {
        let pointer = pointers[i + 1];
        let posX = scaleByPixelRatio(touches[i].pageX);
        let posY = scaleByPixelRatio(touches[i].pageY);
        updatePointerMoveData(pointer, posX, posY);
        pointer.moved = true;
    }
}, false);

window.addEventListener('touchend', e => {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++)
    {
        let pointer = pointers.find(p => p.id == touches[i].identifier);
        if (pointer == null) continue;
        updatePointerUpData(pointer);
    }
});

window.addEventListener('keydown', e => {
    if (e.code === 'KeyP')
        config.PAUSED = !config.PAUSED;
    if (e.key === ' ')
        splatStack.push(4 + Math.floor(Math.random() * 2)); // 4 or 5 splats
    if (e.code === 'KeyA') {
        AUDIO.ENABLED = !AUDIO.ENABLED;
        if (AUDIO.ENABLED && !audioAnalyser.initialized) {
            audioAnalyser.initialize();
        }
    }
});

function updatePointerDownData (pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
}

function updatePointerMoveData (pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    
    // Always consider the pointer moved if there's any delta
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

function updatePointerUpData (pointer) {
    pointer.down = false;
}

function correctDeltaX (delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
}

function correctDeltaY (delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
}

function generateColor () {
    // Northern Lights color palette (in order of layers - deep to surface)
    const auroraColors = [
        { r: 0x01, g: 0x21, b: 0x3a }, // #01213a - deepest layer
        { r: 0x01, g: 0x41, b: 0x1f }, // #01411f
        { r: 0x00, g: 0x5d, b: 0x55 }, // #005d55
        { r: 0x08, g: 0xaf, b: 0xa8 }, // #08afa8
        { r: 0xcc, g: 0xff, b: 0x00 }  // #ccff00 - surface layer
    ];
    
    // Get current pointer for velocity
    let totalVelocity = 0;
    if (pointers.length > 0 && pointers[0]) {
        // Calculate velocity magnitude (speed)
        totalVelocity = Math.sqrt(
            pointers[0].deltaX * pointers[0].deltaX + 
            pointers[0].deltaY * pointers[0].deltaY
        );
    }
    
    // Map velocity to color index - faster movement uses brighter surface colors
    // Normalize velocity to be between 0 and 1, then scale to our color range
    let velocityFactor = Math.min(Math.max(totalVelocity * 50, 0), 1);
    let colorIndex = Math.floor(velocityFactor * (auroraColors.length - 1));
    
    // Add a slight random factor for natural variation
    if (Math.random() < 0.3) {
        colorIndex = Math.max(0, Math.min(auroraColors.length - 1, 
            colorIndex + (Math.random() < 0.5 ? -1 : 1)));
    }
    
    const base = auroraColors[colorIndex];
    
    // Vary brightness slightly for more natural look
    const brightness = 0.7 + Math.random() * 0.3;
    
    return {
        r: (base.r / 255) * brightness,
        g: (base.g / 255) * brightness,
        b: (base.b / 255) * brightness
    };
}

function HSVtoRGB (h, s, v) {
    // Modified to always return a shade of lime green
    // Ignoring the h,s,v inputs and just varying the brightness
    
    // Use the v (value/brightness) parameter to adjust intensity
    // But keep the color ratio the same
    return {
        r: LIME_GREEN.r * v,
        g: LIME_GREEN.g * v,
        b: LIME_GREEN.b * v
    };
}

function normalizeColor (input) {
    let output = {
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255
    };
    return output;
}

function wrap (value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return (value - min) % range + min;
}

function getResolution (resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight)
        return { width: max, height: min };
    else
        return { width: min, height: max };
}

function getTextureScale (texture, width, height) {
    return {
        x: width / texture.width,
        y: height / texture.height
    };
}

function scaleByPixelRatio (input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function hashCode (s) {
    if (s.length == 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

canvas.addEventListener('mouseenter', e => {
    let posX = scaleByPixelRatio(e.offsetX);
    let posY = scaleByPixelRatio(e.offsetY);
    let pointer = pointers.find(p => p.id == -1);
    if (pointer == null)
        pointer = new pointerPrototype();
    pointer.id = -1;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
});

canvas.addEventListener('mouseleave', () => {
    updatePointerUpData(pointers[0]);
});

// Process audio reactions and trigger visual effects
function processAudioReactions() {
    // Calculate overall audio energy for global effects
    const totalEnergy = (audioAnalyser.smoothedBass + audioAnalyser.smoothedMid + audioAnalyser.smoothedHigh) / 3;
    
    // EFFECT 0: GLOBAL BRIGHTNESS MODULATION
    // Adjust brightness based on total energy, but never exceeding current max
    
    // Enhanced brightness modulation:
    // 1. Respond to audio volume (totalEnergy)
    // 2. Quick increase on energy peaks, slower decay
    // 3. Keep minimum brightness level to avoid full darkness
    
    // Weighted energy calculation (bass has more influence on brightness)
    const weightedEnergy = 
        (audioAnalyser.smoothedBass * 0.5) + 
        (audioAnalyser.smoothedMid * 0.3) + 
        (audioAnalyser.smoothedHigh * 0.2);
    
    // Target brightness based on audio
    const minBrightness = 0.3; // Don't let it get too dark
    const targetBrightness = minBrightness + weightedEnergy * (1.0 - minBrightness);
    
    // Asymmetric smoothing - quick brighten, slow dim
    if (targetBrightness > brightnessMultiplier) {
        // Quick increase (immediate response to beats)
        brightnessMultiplier = brightnessMultiplier * 0.8 + targetBrightness * 0.2;
    } else {
        // Slow decrease (gentle fadeout)
        brightnessMultiplier = brightnessMultiplier * 0.95 + targetBrightness * 0.05;
    }
    
    // EFFECT 1: Kick drum detection - create big, centered splats
    if (audioAnalyser.kickDetected) {
        // Always create a strong central splat for kicks
        const centerSplat = {
            x: 0.5,
            y: 0.5,
            dx: 1000 * (Math.random() * 2 - 1) * audioAnalyser.bassEnergy,
            dy: 1000 * (Math.random() * 2 - 1) * audioAnalyser.bassEnergy,
            color: {
                r: LIME_GREEN.r * 0.9,
                g: LIME_GREEN.g * 1.1,
                b: LIME_GREEN.b * 0.4
            },
            radius: config.SPLAT_RADIUS * (2.5 + audioAnalyser.bassEnergy * AUDIO.BASS_MULTIPLIER)
        };
        
        // Create 2-3 additional splats on kicks for more impact
        const additionalSplats = Math.floor(1 + audioAnalyser.bassEnergy * 2);
        
        // Apply the main center splat
        const originalRadius = config.SPLAT_RADIUS;
        config.SPLAT_RADIUS = centerSplat.radius;
        splat(centerSplat.x, centerSplat.y, centerSplat.dx, centerSplat.dy, centerSplat.color);
        
        // Create additional splats in a circular pattern around the center
        for (let i = 0; i < additionalSplats; i++) {
            const angle = (i / additionalSplats) * Math.PI * 2;
            const distance = 0.2 + Math.random() * 0.1;
            
            const x = 0.5 + Math.cos(angle) * distance;
            const y = 0.5 + Math.sin(angle) * distance;
            
            // Vary the colors slightly for visual interest
            const colorShift = Math.random() * 0.3;
            const color = {
                r: LIME_GREEN.r * (0.7 + colorShift),
                g: LIME_GREEN.g * (0.9 + colorShift * 0.2),
                b: LIME_GREEN.b * (0.2 + colorShift)
            };
            
            // Use a slightly smaller radius for the surrounding splats
            config.SPLAT_RADIUS = originalRadius * (1.5 + audioAnalyser.bassEnergy * 2);
            
            splat(x, y, 
                centerSplat.dx * (0.7 + Math.random() * 0.6), 
                centerSplat.dy * (0.7 + Math.random() * 0.6), 
                color);
        }
        
        // Reset the radius
        config.SPLAT_RADIUS = originalRadius;
        
        // Temporarily increase curl on kick for more dynamic movement
        const originalCurl = config.CURL;
        config.CURL = originalCurl * (1 + audioAnalyser.bassEnergy * 2);
        
        // Reset curl after a short delay
        setTimeout(() => {
            config.CURL = originalCurl;
        }, 100);
    }
    
    // EFFECT 2: LOW-FREQ BASS → GRAVITY FIELD PULSES & VELOCITY DISSIPATION
    const bassOnly = audioAnalyser.smoothedBass - audioAnalyser.smoothedMid;
    if (bassOnly > AUDIO.THRESHOLD) {
        // Temporarily boost gravity strength
        const originalStrength = config.GRAVITY_STRENGTH;
        config.GRAVITY_STRENGTH = originalStrength + bassOnly * AUDIO.BASS_MULTIPLIER;
        
        // Make gravity repel or attract based on bass intensity pattern
        // Use the current timestamp to create alternating patterns
        const timePattern = (Date.now() % 4000) / 4000; // 0-1 over 4 seconds
        if (timePattern < 0.5) {
            // Invert gravity direction for half the time to create dynamic push/pull effect
            config.GRAVITY_THRESHOLD = -0.01;
        } else {
            config.GRAVITY_THRESHOLD = 0.01;
        }
        
        // NEW: Modulate velocity dissipation based on bass frequencies
        // Lower values = fluid moves longer/farther, higher values = faster decay
        // Map bass energy to velocity dissipation
        const originalDissipation = 3.6; // Default value
        
        // INVERTED: Strong bass INCREASES dissipation (fluid decays faster)
        // This creates more rapid, instant reactions when bass hits
        config.VELOCITY_DISSIPATION = Math.min(8.0, originalDissipation * (1 + bassOnly * AUDIO.BASS_MULTIPLIER * 0.8));
        
        // Reset after a short moment
        setTimeout(() => { 
            config.GRAVITY_STRENGTH = originalStrength; 
            config.GRAVITY_THRESHOLD = 0.01; // Reset to default
            config.VELOCITY_DISSIPATION = originalDissipation; // Reset velocity dissipation
        }, 150); // Slightly longer to let the fluid movement stabilize
    }
    
    // EFFECT 3: HIGH-FREQ SPARKLES → BLUE SMALL SPLATS
    const highEnergy = audioAnalyser.smoothedHigh;
    if (highEnergy > AUDIO.THRESHOLD) {
        // Spawn N little sparkles
        const count = Math.ceil(highEnergy * 10);
        const originalRadius = config.SPLAT_RADIUS;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random();
            const y = Math.random();
            const radius = Math.max(0.005, config.SPLAT_RADIUS * highEnergy * 0.5);
            config.SPLAT_RADIUS = radius; // Small radius
            
            // NEW: Blue sparks instead of white-lime
            // Create blue sparkles with varying intensity/brightness
            const blueIntensity = 0.5 + highEnergy * 0.5; // 0.5-1.0 based on energy
            const sparkleColor = {
                r: 0.1 * blueIntensity,                // Very little red
                g: 0.4 * blueIntensity,                // Some green for cyan tint
                b: 0.9 * blueIntensity                 // Strong blue component
            };
            
            // Add a touch of white to the brightest parts for a glow effect
            if (Math.random() < highEnergy * 0.3) {
                sparkleColor.r += 0.2;
                sparkleColor.g += 0.2;
                sparkleColor.b += 0.1;
            }
            
            splat(x, y,
                (Math.random() - 0.5) * 500 * highEnergy,
                (Math.random() - 0.5) * 500 * highEnergy,
                sparkleColor);
        }
        
        // Restore splat radius to default
        config.SPLAT_RADIUS = originalRadius;
    }
    
    // Global fluid dynamics modifications based on overall audio energy
    if (totalEnergy > AUDIO.THRESHOLD) {
        // Fluid dynamics respond to overall energy
        // NOTE: We're no longer modifying velocity dissipation here since it's handled by bass
        config.DENSITY_DISSIPATION = Math.max(1, 4 * (1 - totalEnergy * 0.2));
        
        // Subtle modulation of parameters to avoid completely static fluid when no kicks
        config.PRESSURE = 0.8 * (1 + totalEnergy * 0.05);
        config.CURL = Math.max(2, 2 * (1 + totalEnergy));
    } else {
        // Reset to default values during quiet parts
        config.VELOCITY_DISSIPATION = 3.6;
        config.DENSITY_DISSIPATION = 4;
        config.PRESSURE = 0.8;
        config.CURL = 2;
    }
}