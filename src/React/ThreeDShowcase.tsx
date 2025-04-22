import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Model options with their paths and display names
const modelOptions = [
  { id: "default", name: "Default", path: "/models/dadras.glb" },
  { id: "arneodo", name: "Arneodo", path: "/models/arneodo_lite.gltf" },
  { id: "thomas", name: "Thomas", path: "/models/thomas.gltf" }
];

const ThreeDShowcase = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelCenterRef = useRef<THREE.Vector3 | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  
  // State to track help text visibility
  const [helpTextVisible, setHelpTextVisible] = useState(false);
  // State to track the currently selected model
  const [selectedModel, setSelectedModel] = useState(modelOptions[0].id);
  // State to track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  // State to track if the component is visible in the viewport
  const [isInViewport, setIsInViewport] = useState(true);
  // State to track if the tab is active
  const [isTabActive, setIsTabActive] = useState(true);

  // Function to load a model
  const loadModel = (modelPath: string) => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    // Remove existing model if there is one
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      modelRef.current = null;
    }
    
    // Stop any existing animation
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    
    // Check if mobile for model simplification
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Load the new model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        sceneRef.current?.add(gltf.scene);
        modelRef.current = gltf.scene;
        
        // Simplify model geometries on mobile
        if (isMobile) {
          modelRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              // Skip LOD reduction for very small meshes
              if (object.geometry.attributes.position.count < 100) return;
              
              // Simplify geometry on mobile devices
              // Reduce triangle count by approx. 60%
              if (object.geometry.index) {
                const indices = object.geometry.index.array;
                const reduceRatio = 0.4; // Keep 40% of triangles
                const newIndicesCount = Math.floor(indices.length * reduceRatio);
                const newIndices = new Uint32Array(newIndicesCount);
                
                for (let i = 0; i < newIndicesCount; i += 3) {
                  // Keep only every 2.5th triangle (40%)
                  const srcIdx = Math.floor(i * (1/reduceRatio));
                  if (srcIdx + 2 < indices.length) {
                    newIndices[i] = indices[srcIdx];
                    newIndices[i+1] = indices[srcIdx+1];
                    newIndices[i+2] = indices[srcIdx+2];
                  }
                }
                
                // Replace indices with simplified version
                object.geometry.setIndex(new THREE.BufferAttribute(newIndices, 1));
              }
            }
          });
        }
        
        // Center model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        modelCenterRef.current = center.clone();
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        // Update orbit controls target to model center
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
        
        // Fit camera to container
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = size / Math.tan((60 * Math.PI) / 180 / 2);
        cameraRef.current?.position.set(0, 0, distance * 1.2);
        cameraRef.current?.updateProjectionMatrix();
        
        // Set initial rotation for better view
        if (cameraRef.current) {
          cameraRef.current.position.x = distance * 0.3;
          cameraRef.current.position.y = distance * 0.2;
        }
        controlsRef.current?.update();
        
        // Animation
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(gltf.scene);
          const startTimeInSeconds = 400 / 24;
          gltf.animations.forEach((clip) => {
            const action = mixerRef.current!.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          });
          // Set the mixer time to frame 400
          mixerRef.current.setTime(startTimeInSeconds);
          // On each loop, reset to frame 400
          mixerRef.current.addEventListener('loop', () => {
            if (mixerRef.current) {
              mixerRef.current.setTime(startTimeInSeconds);
            }
          });
        }
      },
      undefined,
      () => {}
    );
  };

  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    const selectedOption = modelOptions.find(option => option.id === modelId);
    if (selectedOption) {
      setSelectedModel(modelId);
      loadModel(selectedOption.path);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    
    containerRef.current = mountRef.current;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Renderer
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable antialias on mobile
      alpha: true,
      powerPreference: 'high-performance',
      precision: isMobile ? 'lowp' : 'mediump', // Use low precision on mobile
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Lower pixel ratio cap
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);
    
    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.enablePan = true; // Enable panning with right mouse button
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // Animation clock
    clockRef.current = new THREE.Clock();

    // Load the default model
    const defaultModel = modelOptions.find(option => option.id === selectedModel);
    if (defaultModel) {
      loadModel(defaultModel.path);
    }

    // Auto rotation when not interacting
    let lastInteractionTime = 0;
    const autoRotationTimeout = 3000; // ms before auto rotation resumes
    
    const checkInteraction = () => {
      const currentTime = Date.now();
      if (controlsRef.current) {
        controlsRef.current.autoRotate = (currentTime - lastInteractionTime > autoRotationTimeout);
      }
    };

    // Add event listeners for disabling auto-rotation on interaction
    const handleInteraction = () => {
      lastInteractionTime = Date.now();
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
    };
    
    renderer.domElement.addEventListener('mousedown', handleInteraction);
    renderer.domElement.addEventListener('wheel', handleInteraction);
    renderer.domElement.addEventListener('touchstart', handleInteraction);

    // Animation loop
    const animate = () => {
      // Only animate if visible in viewport and tab is active
      if (isInViewport && isTabActive) {
        // Update animation mixer with fixed delta for consistent performance
        if (mixerRef.current && clockRef.current) {
          // Use fixed delta for better performance
          const fixedDelta = 1/60; // 60fps target
          mixerRef.current.update(fixedDelta);
        }
        
        // Auto-rotate the camera when idle - but only update camera if needed
        checkInteraction();
        
        // Update controls - but only if camera is moving or rotating
        if (controlsRef.current && controlsRef.current.autoRotate) {
          controlsRef.current.update();
        }
        
        // Render - use a throttling technique to avoid excessive renders
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
      
      // Request next frame but with throttling if not visible
      if (!isInViewport || !isTabActive) {
        // Use a less frequent update when not visible
        setTimeout(() => {
          animationFrameIdRef.current = window.requestAnimationFrame(animate);
        }, 250); // Only update 4 times per second when hidden
      } else {
        animationFrameIdRef.current = window.requestAnimationFrame(animate);
      }
    };
    
    animate();

    // Intersection Observer for viewport visibility
    let observer: IntersectionObserver | null = null;
    if (mountRef.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsInViewport(true);
          } else {
            setIsInViewport(false);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(mountRef.current);
    }

    // Page Visibility API
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = containerWidth / containerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerWidth, containerHeight);
    };
    
    window.addEventListener("resize", handleResize);

    // Setup hover handler for help text
    const handleMouseEnter = () => {
      // Clear any existing timeout to prevent hiding while hovering
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      
      // Show the help text
      setHelpTextVisible(true);
      
      // Set a timeout to hide the help text after 1.5 seconds, even if still hovering
      hideTimeoutRef.current = window.setTimeout(() => {
        setHelpTextVisible(false);
        hideTimeoutRef.current = null;
      }, 1500);
    };
    
    const handleMouseLeave = () => {
      // Hide immediately on mouse leave
      setHelpTextVisible(false);
      
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
    
    // Add hover event listeners
    if (mountRef.current) {
      mountRef.current.addEventListener('mouseenter', handleMouseEnter);
      mountRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    // Add window resize handler for responsive design
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleWindowResize);
    handleWindowResize(); // Initial call

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      
      if (mountRef.current) {
        mountRef.current.removeEventListener('mouseenter', handleMouseEnter);
        mountRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.removeEventListener('mousedown', handleInteraction);
        rendererRef.current.domElement.removeEventListener('wheel', handleInteraction);
        rendererRef.current.domElement.removeEventListener('touchstart', handleInteraction);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
      
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }
      
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }

      window.removeEventListener('resize', handleWindowResize);

      if (observer && mountRef.current) {
        observer.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedModel]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: windowWidth <= 768 ? "column" : "row"
      }}
    >
      {/* Main 3D viewer container */}
      <div
        ref={mountRef}
        style={{
          position: "relative",
          width: windowWidth <= 768 ? "100%" : "100%",
          height: windowWidth <= 768 ? "calc(100% - 40px)" : "100%",
          borderRadius: "8px",
          overflow: "hidden",
          cursor: "grab",
          backgroundColor: "#1414149c",
          touchAction: "none",
          zIndex: 1
        }}
        aria-label="Interactive 3D Model"
      >
        {/* Help text overlay */}
        <div 
          className="overlay-instructions" 
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "rgba(255,255,255,0.8)",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            opacity: helpTextVisible ? 0.9 : 0,
            transition: "opacity 0.3s ease",
            zIndex: 2
          }}
        >
          Drag to rotate • Right-click to pan • Scroll to zoom
        </div>
      </div>

      {/* Model selector that sticks out from the right side (or below on mobile) */}
      <div
        className="model-selector"
        style={{
          position: "absolute",
          top: windowWidth <= 768 ? "unset" : "50%",
          left: windowWidth <= 768 ? "50%" : "unset",
          right: windowWidth <= 768 ? "unset" : "-22px",
          bottom: windowWidth <= 768 ? "-22px" : "unset",
          transform: windowWidth <= 768
            ? "translateX(-50%)"
            : "translateY(-50%)",
          display: "flex",
          flexDirection: windowWidth > 768 ? "column" : "row",
          gap: "8px",
          zIndex: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          padding: windowWidth <= 768 ? "0 10px" : "10px 0",
          justifyContent: windowWidth <= 768 ? "center" : "flex-start",
          background: "none"
        }}
      >
        {modelOptions.map((model) => (
          <button
            key={model.id}
            onClick={() => handleModelSelect(model.id)}
            title={model.name}
            aria-label={`Select ${model.name} model`}
            style={{
              width: windowWidth <= 768 ? "28px" : "32px",
              height: windowWidth <= 768 ? "28px" : "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: selectedModel === model.id
                ? "2px solid var(--white-icon-tr)"
                : "1.5px solid var(--white-icon-tr)",
              backgroundColor: selectedModel === model.id 
                ? "rgba(40, 40, 40, 0.85)" 
                : "rgba(20, 20, 20, 0.6)",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              padding: 0,
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
            }}
          >
            {/* Icon only, no text */}
            <svg 
              width={windowWidth <= 768 ? "16" : "18"}
              height={windowWidth <= 768 ? "16" : "18"}
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                opacity: selectedModel === model.id ? 1 : 0.45,
                color: selectedModel === model.id ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)"
              }}
            >
              <path 
                d="M21 16.61V7.39c0-.77-.62-1.39-1.39-1.39h-7.22c-.77 0-1.39.62-1.39 1.39v9.22c0 .77.62 1.39 1.39 1.39h7.22c.77 0 1.39-.62 1.39-1.39zM12 2H4.5C3.12 2 2 3.12 2 4.5v15C2 20.88 3.12 22 4.5 22H12" 
                stroke="currentColor" 
                strokeWidth="1.75"
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThreeDShowcase; 