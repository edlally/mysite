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

// 1. Initial grayscale splats data
// Not needed anymore, using direct splats

'use strict';

// Define the pastel theme constants for use throughout the app
const PASTEL_THEME = {
    primary: '#FFD1DC',  // Soft pink
    light: '#FFF0F5',    // Lavender blush
    dark: '#F8BBD0',     // Darker pink
    r: 255/255,          // Red component
    g: 209/255,          // Green component
    b: 220/255,          // Blue component
};

// Function to apply the pastel theme to the application
function applyPastelTheme() {
    // Add a stylesheet with pastel color rules
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .dg.ac {
            border-color: ${PASTEL_THEME.primary} !important;
        }
        
        .dg.main .close-button {
            background-color: #FFF0F5 !important;
            color: #F48FB1 !important;
        }
        
        .dg.main .close-button:hover {
            background-color: #FFE4E8 !important;
        }
        
        .dg.main .close-button::after {
            color: #F48FB1 !important;
        }
        
        .dg li:not(.folder) {
            background: #FFF0F5 !important;
        }
        
        .dg li.title {
            background: #FFE4E8 !important;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Set document theme color for mobile browsers
    const themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#FFD1DC';
    document.head.appendChild(themeColorMeta);
}

// Call the function to apply the theme
applyPastelTheme();

// Define the lime green color theme constants at the top for use throughout the app
const LIME_GREEN = {
    primary: '#CCFF00',  // Main lime green color
    light: '#DDFF33',    // Lighter shade
    dark: '#99CC00',     // Darker shade
    r: 204/255,          // Red component
    g: 255/255,          // Green component
    b: 0/255,            // Blue component
};

// Define pastel color theme constants
const PASTEL_PALETTE = [
    { r: 255/255, g: 209/255, b: 220/255 }, // Pink
    { r: 246/255, g: 219/255, b: 231/255 }, // Light pink
    { r: 209/255, g: 232/255, b: 244/255 }, // Baby blue
    { r: 219/255, g: 228/255, b: 252/255 }, // Lavender blue
    { r: 230/255, g: 242/255, b: 234/255 }, // Mint
    { r: 253/255, g: 235/255, b: 208/255 }, // Peach
    { r: 241/255, g: 231/255, b: 254/255 }, // Light purple
    { r: 255/255, g: 224/255, b: 243/255 }  // Cotton candy
];

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
    DENSITY_DISSIPATION: 0.0, // No dissipation to keep the fluid intact
    VELOCITY_DISSIPATION: 0.9, // High value to make movement more viscous and slow
    PRESSURE: 0.6, // Decreased to reduce rapid movement
    PRESSURE_ITERATIONS: 40, // Increased for more stable cohesive behavior
    CURL: 0, // Add some curl for jelly-like rotation without too much turbulence
    SPLAT_RADIUS: 0.25, // Increased for more cohesive splats
    SPLAT_FORCE: 6000, // Increased force for more impact but controlled by viscosity
    SPLAT_VELOCITY: 10000, // Less velocity for auto-generated splats
    VISCOSITY: 10, // New parameter for explicit viscosity
    ELASTIC_FORCE: 0.8, // New parameter for jelly-like elasticity
    SURFACE_TENSION: 0.9, // New parameter for surface tension
    GRAVITY_FIELD: true, // Enable gravity for jelly-like behavior
    GRAVITY_STRENGTH: 0.6, // Moderate gravity for jelly movement
    GRAVITY_THRESHOLD: 0.01,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 100,
    PAUSED: false,
    BACK_COLOR: { r: 250/255, g: 250/255, b: 255/255 }, // Very light lavender
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0, // Increased to enhance color vibrancy
    BLOOM_THRESHOLD: 0.4, // Lowered to make more colors visible in bloom
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 0.2,
    PEARLESCENT: true, // Enable pearlescent effect
    PEARLESCENT_INTENSITY: 1, // Intensity of the pearlescent effect
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
        
        // Customize the GUI colors to match the pastel theme
        gui.domElement.style.setProperty('--background-color', '#FFF0F5');
        gui.domElement.style.setProperty('--text-color', '#F48FB1');
        gui.domElement.style.setProperty('--hover-color', '#FFD1DC');
        
        gui.add(config, 'DYE_RESOLUTION', { 'high': 1024, 'medium': 512, 'low': 256, 'very low': 128 }).name('quality').onFinishChange(initFramebuffers);
        gui.add(config, 'SIM_RESOLUTION', { '32': 32, '64': 64, '128': 128, '256': 256 }).name('sim resolution').onFinishChange(initFramebuffers);
        gui.add(config, 'DENSITY_DISSIPATION', 0, 4.0).name('density diffusion');
        gui.add(config, 'VELOCITY_DISSIPATION', 0, 20.0).name('velocity diffusion');
        gui.add(config, 'PRESSURE', 0.0, 1.0).name('pressure');
        gui.add(config, 'CURL', 0, 50).name('vorticity').step(1);
        gui.add(config, 'VISCOSITY', 0, 100).name('viscosity').step(1);
        gui.add(config, 'ELASTIC_FORCE', 0, 1.0).name('elasticity');
        gui.add(config, 'SURFACE_TENSION', 0, 1.0).name('surface tension');
        gui.add(config, 'GRAVITY_FIELD').name('interactive drag');
        gui.add(config, 'GRAVITY_STRENGTH', 0, 1.0).name('drag strength');
        gui.add(config, 'SPLAT_RADIUS', 0.01, 1.0).name('splat radius');
        gui.add(config, 'SHADING').name('shading').onFinishChange(updateKeywords);
        gui.add(config, 'COLORFUL').name('colorful');
        gui.add(config, 'PAUSED').name('paused').listen();

        gui.add({ fun: () => {
            splatStack.push(4 + Math.floor(Math.random() * 2)); // Will create either 4 or 5 splats
        } }, 'fun').name('Random splats');
        
        // Add reset button to manually trigger resplat
        gui.add({ fun: resetCanvas }, 'fun').name('Reset canvas');

        let bloomFolder = gui.addFolder('Bloom');
        bloomFolder.add(config, 'BLOOM').name('enabled').onFinishChange(updateKeywords);
        bloomFolder.add(config, 'BLOOM_INTENSITY', 0.1, 2.0).name('intensity');
        bloomFolder.add(config, 'BLOOM_THRESHOLD', 0.0, 1.0).name('threshold');

        let sunraysFolder = gui.addFolder('Sunrays');
        sunraysFolder.add(config, 'SUNRAYS').name('enabled').onFinishChange(updateKeywords);
        sunraysFolder.add(config, 'SUNRAYS_WEIGHT', 0.3, 1.0).name('weight');
        
        // Add Pearlescent effect controls
        let pearlescentFolder = gui.addFolder('Pearlescent');
        pearlescentFolder.add(config, 'PEARLESCENT').name('enabled').onFinishChange(updateKeywords);
        pearlescentFolder.add(config, 'PEARLESCENT_INTENSITY', 0.1, 1.0).name('intensity');
        pearlescentFolder.open(); // Open by default to highlight the new feature

        let captureFolder = gui.addFolder('Capture');
        captureFolder.addColor(config, 'BACK_COLOR').name('background color');
        captureFolder.add(config, 'TRANSPARENT').name('transparent');
        captureFolder.add({ fun: captureScreenshot }, 'fun').name('take screenshot');

        let github = gui.add({ fun : () => {
            window.open('https://github.com/PavelDoGreat/WebGL-Fluid-Simulation');
            sendGAEvent('send', 'event', 'link button', 'github');
        } }, 'fun').name('Github');
        github.__li.className = 'cr function bigFont';
        github.__li.style.borderLeft = '3px solid ' + PASTEL_THEME.primary;
        let githubIcon = document.createElement('span');
        github.domElement.parentElement.appendChild(githubIcon);
        githubIcon.className = 'icon github';

        let twitter = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'twitter');
            window.open('https://twitter.com/PavelDoGreat');
        } }, 'fun').name('Twitter');
        twitter.__li.className = 'cr function bigFont';
        twitter.__li.style.borderLeft = '3px solid ' + PASTEL_THEME.primary;
        let twitterIcon = document.createElement('span');
        twitter.domElement.parentElement.appendChild(twitterIcon);
        twitterIcon.className = 'icon twitter';

        let discord = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'discord');
            window.open('https://discordapp.com/invite/CeqZDDE');
        } }, 'fun').name('Discord');
        discord.__li.className = 'cr function bigFont';
        discord.__li.style.borderLeft = '3px solid ' + PASTEL_THEME.primary;
        let discordIcon = document.createElement('span');
        discord.domElement.parentElement.appendChild(discordIcon);
        discordIcon.className = 'icon discord';

        let app = gui.add({ fun : () => {
            sendGAEvent('send', 'event', 'link button', 'app');
            window.open('http://onelink.to/5b58bn');
        } }, 'fun').name('Check out mobile app');
        app.__li.className = 'cr function appBigFont';
        app.__li.style.borderLeft = '3px solid ' + PASTEL_THEME.primary;
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
    uniform float pearlescentIntensity;

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

    #ifdef PEARLESCENT
        // Calculate brightness of the pixel
        float brightness = max(c.r, max(c.g, c.b));
        
        // Only apply pearlescent effect to brighter areas (highlights)
        if (brightness > 0.3) {
            // Calculate pearlescent contribution based on brightness
            float pearlFactor = brightness * brightness * pearlescentIntensity;
            
            // Create color shifts based on UV coordinates and brightness
            // This creates a rainbow-like effect that shifts with viewing angle
            vec3 pearlColor;
            
            // Use a combination of position and brightness to create the iridescent shift
            float shiftX = vUv.x + brightness * 0.1;
            float shiftY = vUv.y - brightness * 0.07;
            
            // Create subtle color variations for the pearlescent effect
            pearlColor.r = 0.8 + 0.2 * sin(shiftX * 10.0);
            pearlColor.g = 0.8 + 0.2 * sin(shiftY * 12.0 + 1.0);
            pearlColor.b = 0.9 + 0.1 * sin(shiftX * shiftY * 14.0 + 2.0);
            
            // For high-definition look, add specular-like highlight
            float specularHighlight = pow(brightness, 4.0) * 0.5;
            pearlColor += specularHighlight;
            
            // Mix the original color with the pearlescent effect
            // Ensure brighter areas get more of the effect
            c = mix(c, c * pearlColor, pearlFactor);
        }
    #endif

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
    uniform sampler2D uDye;
    uniform vec2 point;
    uniform float strength;
    uniform float threshold;

    void main () {
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        vec3 dye = texture2D(uDye, vUv).rgb;
        
        // Only apply forces to areas with dye (the jelly)
        float fluidAmount = length(dye);
        
        if (fluidAmount > 0.05) {
        // Vector from current position to cursor
        vec2 distVector = point - vUv;
        
        // Distance falloff effect - stronger near cursor
        float dist = length(distVector);
            float influence = 1.0 / (1.0 + 10.0 * dist * dist);
        
        // Normalize direction vector
        vec2 direction = dist > 0.0 ? normalize(distVector) : vec2(0.0);
        
        // Calculate speed at cursor position by sampling velocity at cursor location
        vec2 cursorVelocity = texture2D(uVelocity, point).xy;
        float cursorSpeed = length(cursorVelocity);
        
            // Apply gravitational force - always attract for jelly-like behavior
            velocity += direction * influence * strength * fluidAmount;
            
            // Add a slight downward force to simulate gravity
            velocity.y -= 0.001 * fluidAmount;
        }
        
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const viscosityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform float viscosity;
    uniform vec2 texelSize;
    uniform float dt;

    void main() {
        vec2 c = texture2D(uVelocity, vUv).xy;
        vec2 l = texture2D(uVelocity, vL).xy;
        vec2 r = texture2D(uVelocity, vR).xy;
        vec2 t = texture2D(uVelocity, vT).xy;
        vec2 b = texture2D(uVelocity, vB).xy;

        // Laplacian for viscosity
        vec2 laplacian = l + r + t + b - 4.0 * c;
        
        // Apply viscosity effect
        vec2 newVelocity = c + viscosity * dt * laplacian;
        
        // Apply damping to slow down overall movement
        newVelocity *= 0.95;
        
        gl_FragColor = vec4(newVelocity, 0.0, 1.0);
    }
`);

const elasticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uDye;
    uniform float elasticForce;
    uniform vec2 texelSize;

    void main() {
        vec2 coord = vUv;
        vec2 vel = texture2D(uVelocity, coord).xy;
        vec3 dye = texture2D(uDye, coord).rgb;
        
        // Find the center of mass (use dye intensity as weight)
        float totalWeight = 0.0;
        vec2 centerOfMass = vec2(0.0);
        
        // Simple approximation of center using a small kernel
        for (float i = -2.0; i <= 2.0; i += 1.0) {
            for (float j = -2.0; j <= 2.0; j += 1.0) {
                vec2 sampleCoord = coord + vec2(i, j) * texelSize;
                float weight = length(texture2D(uDye, sampleCoord).rgb);
                centerOfMass += sampleCoord * weight;
                totalWeight += weight;
            }
        }
        
        if (totalWeight > 0.01) {
            centerOfMass /= totalWeight;
            
            // Vector from current position to center of mass
            vec2 toCenter = centerOfMass - coord;
            
            // Apply elastic force toward center of mass
            vel += toCenter * elasticForce * length(dye);
        }
        
        gl_FragColor = vec4(vel, 0.0, 1.0);
    }
`);

const surfaceTensionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uDye;
    uniform sampler2D uVelocity;
    uniform float tension;
    uniform vec2 texelSize;

    void main() {
        vec3 center = texture2D(uDye, vUv).rgb;
        vec3 left = texture2D(uDye, vL).rgb;
        vec3 right = texture2D(uDye, vR).rgb;
        vec3 top = texture2D(uDye, vT).rgb;
        vec3 bottom = texture2D(uDye, vB).rgb;
        
        // Calculate gradient of dye density
        float gx = length(right) - length(left);
        float gy = length(top) - length(bottom);
        
        // Detect interface (edge of fluid)
        float gradient = length(vec2(gx, gy));
        
        // Surface tension force points inward at interfaces
        vec2 force = vec2(0.0);
        if (gradient > 0.05) {
            force = -normalize(vec2(gx, gy)) * tension * gradient;
        }
        
        // Add force to velocity
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force;
        
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
let background;

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
const viscosityProgram      = new Program(baseVertexShader, viscosityShader);
const elasticityProgram     = new Program(baseVertexShader, elasticityShader);
const surfaceTensionProgram = new Program(baseVertexShader, surfaceTensionShader);

const displayMaterial = new Material(baseVertexShader, displayShaderSource);

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

    // 2. Background layer FBO for initial splats
    if (!background) {
      background = createFBO(
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        gl.LINEAR
      );
    } else {
      // resize on canvas change
      background = resizeFBO(
        background,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        rgba.internalFormat,
        rgba.format,
        texType,
        gl.LINEAR
      );
    }

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
    if (config.PEARLESCENT) displayKeywords.push("PEARLESCENT");
    displayMaterial.setKeywords(displayKeywords);
}

updateKeywords();
initFramebuffers();

// Create initial greyscale splats with movement
function initialGreyscaleSplats() {
    // Create multiple large blobs to cover the screen
    const numLargeBlobs = 9; // Create 9 large blobs to ensure coverage
    
    // Grid positions to ensure even coverage of the screen
    const positions = [
        {x: 0.2, y: 0.2},  // top-left
        {x: 0.5, y: 0.2},  // top-center
        {x: 0.8, y: 0.2},  // top-right
        {x: 0.2, y: 0.5},  // middle-left
        {x: 0.5, y: 0.5},  // center
        {x: 0.8, y: 0.5},  // middle-right
        {x: 0.2, y: 0.8},  // bottom-left
        {x: 0.5, y: 0.8},  // bottom-center
        {x: 0.8, y: 0.8}   // bottom-right
    ];
    
    // Create the large blobs
    for (let i = 0; i < numLargeBlobs; i++) {
        // Get a random pastel color for this blob
        const blobColor = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
        
        // Create the main blob at the grid position
        const pos = positions[i];
        
        // Add a small random offset for less rigid appearance
        const x = pos.x + (Math.random() - 0.5) * 0.05;
        const y = pos.y + (Math.random() - 0.5) * 0.05;
        
        // Create a large central splash with slightly randomized size (using splat radius)
        const originalRadius = config.SPLAT_RADIUS;
        config.SPLAT_RADIUS = 0.3 + Math.random() * 0.15; // Large blob
        
        // Create main blob
        splat(x, y, 0, 0, {
            r: blobColor.r,
            g: blobColor.g,
            b: blobColor.b
        });
            
        // Add 3-5 satellite splats around each main blob for more irregular shape
        const numSatellites = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < numSatellites; j++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.05 + Math.random() * 0.08; // Close to main blob
            const satX = x + Math.cos(angle) * distance;
            const satY = y + Math.sin(angle) * distance;
            
            // Small velocity toward main blob
            const dx = (x - satX) * 0.02;
            const dy = (y - satY) * 0.02;
            
            // Choose a color similar to main blob for cohesive look
            const variation = 0.9 + Math.random() * 0.2;
            
            // Smaller radius for satellite blobs
            config.SPLAT_RADIUS = 0.15 + Math.random() * 0.1;
            
            splat(satX, satY, dx, dy, {
                r: blobColor.r * variation,
                g: blobColor.g * variation,
                b: blobColor.b * variation
            });
        }
        
        // Restore original radius
        config.SPLAT_RADIUS = originalRadius;
    }
    
    // Add a few "bridge" splats to connect the large blobs for a more cohesive look
    const numBridgeSplats = 15;
    const bridgeColor = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    
    for (let i = 0; i < numBridgeSplats; i++) {
        // Pick two random positions from our grid
        const pos1 = positions[Math.floor(Math.random() * positions.length)];
        const pos2 = positions[Math.floor(Math.random() * positions.length)];
        
        // Create a splat somewhere between them
        const ratio = 0.3 + Math.random() * 0.4; // Between 30-70% of the way
        const x = pos1.x + (pos2.x - pos1.x) * ratio;
        const y = pos1.y + (pos2.y - pos1.y) * ratio;
        
        // Small velocity in a random direction to create more natural connections
        const angle = Math.random() * Math.PI * 2;
        const dx = Math.cos(angle) * 0.001;
        const dy = Math.sin(angle) * 0.001;
            
        // Medium size for bridge splats
        const originalRadius = config.SPLAT_RADIUS;
        config.SPLAT_RADIUS = 0.15 + Math.random() * 0.1;
        
        // Create bridge splat
        splat(x, y, dx, dy, {
            r: bridgeColor.r,
            g: bridgeColor.g,
            b: bridgeColor.b
        });
        
        // Restore original radius
        config.SPLAT_RADIUS = originalRadius;
    }
}

// Modify multipleSplats to create splats gradually over time for a smoother, natural appearance
function multipleSplats(amount) {
    // Create a sequence of splats over time instead of all at once
    let splatsCreated = 0;
            
    // Function to create a single splat with natural appearance
    function createSmoothSplat() {
        if (splatsCreated >= amount) return;
        
        // Get a random color from our palette
        const color = generateColor();
        
        // Position strategy: 
        // 1. Often place near existing fluid (detected via pointer position)
        // 2. Sometimes place near screen edges for expansion
        // 3. Occasionally place randomly
        
        let x, y, dx, dy;
        const rand = Math.random();
            
        // 60% of the time, place near existing fluid or pointer position
        if (rand < 0.6 && pointers[0].moved) {
            // Create near the last pointer position
            const spreadRadius = 0.2; // Area around pointer
            x = pointers[0].texcoordX + (Math.random() - 0.5) * spreadRadius;
            y = pointers[0].texcoordY + (Math.random() - 0.5) * spreadRadius;
            
            // Constrain within canvas
            x = Math.max(0.05, Math.min(0.95, x));
            y = Math.max(0.05, Math.min(0.95, y));
            
            // Velocity slightly toward pointer position for more natural merging
            dx = (pointers[0].texcoordX - x) * 0.01;
            dy = (pointers[0].texcoordY - y) * 0.01;
        } 
        // 30% of the time, create near edges
        else if (rand < 0.9) {
            // Determine which edge
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            
            switch(edge) {
                case 0: // top
                    x = Math.random() * 0.8 + 0.1;
                    y = Math.random() * 0.15 + 0.05;
                    dy = 0.005 + Math.random() * 0.01; // Move slightly downward
                    dx = (0.5 - x) * 0.005; // Move toward center horizontally
                    break;
                case 1: // right
                    x = Math.random() * 0.15 + 0.8;
                    y = Math.random() * 0.8 + 0.1;
                    dx = -(0.005 + Math.random() * 0.01); // Move slightly leftward
                    dy = (0.5 - y) * 0.005; // Move toward center vertically
                    break;
                case 2: // bottom
                    x = Math.random() * 0.8 + 0.1;
                    y = Math.random() * 0.15 + 0.8;
                    dy = -(0.005 + Math.random() * 0.01); // Move slightly upward
                    dx = (0.5 - x) * 0.005; // Move toward center horizontally
                    break;
                case 3: // left
                    x = Math.random() * 0.15 + 0.05;
                    y = Math.random() * 0.8 + 0.1;
                    dx = 0.005 + Math.random() * 0.01; // Move slightly rightward
                    dy = (0.5 - y) * 0.005; // Move toward center vertically
                    break;
            }
        } 
        // 10% of the time, create randomly on screen
        else {
            x = Math.random() * 0.9 + 0.05;
            y = Math.random() * 0.9 + 0.05;
            dx = (0.5 - x) * 0.005; // Gentle movement toward center
            dy = (0.5 - y) * 0.005;
        }
        
        // Size transition effect: start smaller and gradually create larger splats
        const baseSize = 0.1;
        const maxAdditionalSize = 0.3;
        const progress = splatsCreated / amount; // 0 to 1
        
        // Size increases as sequence progresses
        const sizeMultiplier = baseSize + maxAdditionalSize * Math.min(1, progress * 1.5);
        
        // Save original radius
        const originalRadius = config.SPLAT_RADIUS;
        
        // Apply size with slight randomness
        config.SPLAT_RADIUS = sizeMultiplier * (0.8 + Math.random() * 0.4);
        
        // Create the splat
        splat(x, y, dx, dy, color);
        
        // Restore original radius
        config.SPLAT_RADIUS = originalRadius;
        
        // Increment counter
        splatsCreated++;
        
        // Schedule next splat with natural timing
        // Timing starts faster, then slows down (easing out)
        const baseDelay = 40; // Base milliseconds between splats
        const additionalDelay = 60; // Maximum additional delay
        
        // Curve that starts fast and slows down
        const easingCurve = Math.pow(progress, 0.5); // Square root for natural easing
        const delay = baseDelay + additionalDelay * easingCurve;
        
        // Schedule next splat
        if (splatsCreated < amount) {
            setTimeout(createSmoothSplat, delay);
        }
    }
    
    // Start the sequence
    createSmoothSplat();
}

// Adjust config to ensure the fluid never fades away
config.VELOCITY_DISSIPATION = 0.99; // Lower this value to make velocity persist longer

// Create initial grayscale splats
initialGreyscaleSplats();

// Also keep the regular colorful splats at the start 
multipleSplats(4 + Math.floor(Math.random() * 2)); // 4 or 5 initial splats

// Setup continuous stream of splats rather than periodic resets
const CONTINUOUS_SPLAT_INTERVAL = 200; // Create new splats every 200ms
setInterval(() => {
    // Add 1-2 random splats continuously
    multipleSplats(1 + Math.floor(Math.random() * 2));
}, CONTINUOUS_SPLAT_INTERVAL);

let lastUpdateTime = Date.now();
let colorUpdateTimer = 0.0;
update();

// Function to clear the dye buffer (reset the canvas)
function clearDye() {
    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, dye.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, 0);
    blit(dye.write);
    dye.swap();
}

function update () {
    const dt = calcDeltaTime();
    if (resizeCanvas())
        initFramebuffers();
    updateColors(dt);
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

    // Apply viscosity effect
    viscosityProgram.bind();
    gl.uniform2f(viscosityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(viscosityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1f(viscosityProgram.uniforms.viscosity, config.VISCOSITY);
    gl.uniform1f(viscosityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // Apply surface tension (creates cohesive behavior)
    surfaceTensionProgram.bind();
    gl.uniform2f(surfaceTensionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(surfaceTensionProgram.uniforms.uDye, dye.read.attach(0));
    gl.uniform1i(surfaceTensionProgram.uniforms.uVelocity, velocity.read.attach(1));
    gl.uniform1f(surfaceTensionProgram.uniforms.tension, config.SURFACE_TENSION);
    blit(velocity.write);
    velocity.swap();

    // Apply elasticity for jelly-like behavior
    elasticityProgram.bind();
    gl.uniform2f(elasticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(elasticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(elasticityProgram.uniforms.uDye, dye.read.attach(1));
    gl.uniform1f(elasticityProgram.uniforms.elasticForce, config.ELASTIC_FORCE);
    blit(velocity.write);
    velocity.swap();

    // Apply curl/vorticity - reduced effect for jelly behavior
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

    // Apply gravity field effect for jelly-like dragging behavior
    if (config.GRAVITY_FIELD) {
        gravityFieldProgram.bind();
        gl.uniform1i(gravityFieldProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(gravityFieldProgram.uniforms.uDye, dye.read.attach(1));
        gl.uniform2f(gravityFieldProgram.uniforms.point, pointers[0].texcoordX, pointers[0].texcoordY);
        gl.uniform1f(gravityFieldProgram.uniforms.strength, config.GRAVITY_STRENGTH);
        gl.uniform1f(gravityFieldProgram.uniforms.threshold, config.GRAVITY_THRESHOLD);
        blit(velocity.write);
        velocity.swap();
    }

    // Continue with the existing pressure and advection steps
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
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
        gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
        let scale = getTextureScale(ditheringTexture, width, height);
        gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS)
        gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    if (config.PEARLESCENT && displayMaterial.uniforms.pearlescentIntensity)
        gl.uniform1f(displayMaterial.uniforms.pearlescentIntensity, config.PEARLESCENT_INTENSITY);
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

// Override the splatPointer function to use black as an eraser with larger radius
function splatPointer (pointer) {
  // Save original splat radius
  const originalRadius = config.SPLAT_RADIUS;
  
  // Use a consistent radius for better control with continuous splats
  config.SPLAT_RADIUS = 0.08; // Slightly smaller than before 
  
  // Reduce velocity from mouse movement but keep enough for effective erasing
  const dx = pointer.deltaX * config.SPLAT_FORCE * 0.5; // Moderate reduction (was 1.2, then 0.1)
  const dy = pointer.deltaY * config.SPLAT_FORCE * 0.5;
  
  // [0,0,0] = total absence of dye (black eraser)
  splat(pointer.texcoordX, pointer.texcoordY, dx, dy, {r: 0, g: 0, b: 0});
  
  // Restore original radius
  config.SPLAT_RADIUS = originalRadius;
}

function splat (x, y, dx, dy, color) {
    // Reduce velocity impact for more controlled movement
    dx *= 0.2;
    dy *= 0.2;
    
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
    // Select a random soft pastel color from our palette
    const pastelColor = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    
    // Get current pointer for velocity
    let totalVelocity = 0;
    if (pointers.length > 0 && pointers[0]) {
        // Calculate velocity magnitude (speed)
        totalVelocity = Math.sqrt(
            pointers[0].deltaX * pointers[0].deltaX + 
            pointers[0].deltaY * pointers[0].deltaY
        );
    }
    
    // Apply a subtle variation based on velocity
    // Faster movement = slightly more saturated colors
    const velocityFactor = Math.min(Math.max(totalVelocity * 10, 0), 1);
    const brightness = 0.75 + (velocityFactor * 0.25);
    
    return {
        r: pastelColor.r * brightness,
        g: pastelColor.g * brightness,
        b: pastelColor.b * brightness
    };
}

function HSVtoRGB (h, s, v) {
    // Modified to always return a pastel color
    // Select a random pastel from our palette instead of using HSV conversion
    const pastelColor = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
    
    // Use the v (value/brightness) parameter to adjust intensity
    return {
        r: pastelColor.r * v,
        g: pastelColor.g * v,
        b: pastelColor.b * v
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

// Function to reset the canvas with new splats
function resetCanvas() {
    // Visual feedback - brief flash effect
    const originalBackColor = {...config.BACK_COLOR};
    
    // Flash to white
    config.BACK_COLOR = { r: 1.0, g: 1.0, b: 1.0 };
    
    // Clear the canvas by resetting the dye buffer
    clearDye();
    
    // Return to original background color after a short delay
    setTimeout(() => {
        config.BACK_COLOR = originalBackColor;
        
        // Recreate the initial splat pattern but with fewer splats to avoid overwhelming
        // the continuous stream that will be adding more splats
        
        // Add a few random splats immediately after reset
        multipleSplats(5 + Math.floor(Math.random() * 3));
    }, 100); // 100ms delay for the flash effect
}