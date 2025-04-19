import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface ThreeDShowcaseProps {
  modelPath?: string;
}

const ThreeDShowcase = ({ modelPath }: ThreeDShowcaseProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(true);
  
  // Using refs to preserve these instances across renders
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#141414");
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Initialize clock for animation
    clockRef.current = new THREE.Clock();
    lastTimeRef.current = clockRef.current.getElapsedTime();

    // Load the Dadras GLB model by default
    const defaultModelPath = "/models/dadras.glb";
    loadModel(modelPath || defaultModelPath);

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        // Only update controls (auto-rotation) when not paused
        if (!isPausedRef.current) {
          controlsRef.current.update();
        }
      }
      
      // Update animations mixer if exists and not paused
      if (mixerRef.current && clockRef.current && !isPausedRef.current) {
        mixerRef.current.update(clockRef.current.getDelta());
      } else if (clockRef.current && isPausedRef.current) {
        // If paused, we still need to update the clock's delta without using it
        // This prevents a big jump in animation when resuming
        clockRef.current.getDelta();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameIdRef.current = window.requestAnimationFrame(animate);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Function to load a custom model
  const loadModel = (path: string) => {
    if (!sceneRef.current) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);

    // Remove previous model if exists
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Create a new GLTF loader
    const loader = new GLTFLoader();
    
    // Load the model with progress tracking
    loader.load(
      path,
      (gltf) => {
        if (!sceneRef.current) return;
        
        // Add the loaded model to the scene
        sceneRef.current.add(gltf.scene);
        modelRef.current = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        // Auto-adjust camera position to fit the model
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = size / Math.tan((75 * Math.PI) / 180 / 2);
        
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 0, distance * 2.0);
          cameraRef.current.updateProjectionMatrix();
        }

        // Set up animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(gltf.scene);
          
          // Play all animations starting at frame 500
          gltf.animations.forEach((clip) => {
            const action = mixerRef.current?.clipAction(clip);
            if (action) {
              // Calculate time at frame 500 (assuming 24fps)
              const startTimeInSeconds = 400 / 24;
              // Set the animation to loop and restart from the specified frame
              action.setLoop(THREE.LoopRepeat, Infinity);
              // Add an event listener to reset to frame 500 on each loop
              mixerRef.current?.addEventListener('loop', () => {
                mixerRef.current?.setTime(startTimeInSeconds);
              });
              action.play();
              mixerRef.current?.setTime(startTimeInSeconds);
            }
          });
        }
        
        setIsLoading(false);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const progressPercent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingProgress(progressPercent);
        }
      },
      (error) => {
        console.error('Error loading model:', error);
        setError('Failed to load the 3D model');
        setIsLoading(false);
      }
    );
  };

  // Effect to load a new model when modelPath changes
  useEffect(() => {
    if (modelPath) {
      loadModel(modelPath);
    }
  }, [modelPath]);

  // Interactive hover effects
  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowHelp(true);
    isPausedRef.current = false;
    
    // Clear any existing timeout
    if (helpTimeoutRef.current) {
      clearTimeout(helpTimeoutRef.current);
    }
    
    // Set timeout to hide the help text after 1.5 seconds
    helpTimeoutRef.current = setTimeout(() => {
      setShowHelp(false);
    }, 1500);
    
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 3.0;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowHelp(false);
    isPausedRef.current = true;
    
    // Clear the timeout when mouse leaves
    if (helpTimeoutRef.current) {
      clearTimeout(helpTimeoutRef.current);
    }
    
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 1.0;
    }
  };

  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (helpTimeoutRef.current) {
        clearTimeout(helpTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: "100%", 
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: isHovered ? "0 0 20px rgba(204, 255, 0, 0.3)" : "none",
        transition: "box-shadow 0.3s ease",
        cursor: "grab",
        position: "relative"
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => {
        if (mountRef.current) {
          mountRef.current.style.cursor = "grabbing";
        }
      }}
      onMouseUp={() => {
        if (mountRef.current) {
          mountRef.current.style.cursor = "grab";
        }
      }}
    >
      {/* Interaction indicator overlay */}
      {!isHovered && !isLoading && !error && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          zIndex: 10,
          opacity: 0.7,
          transition: "opacity 0.3s ease",
          pointerEvents: "none"
        }}>
          <div style={{
            color: "rgba(204, 255, 0, 0.8)",
            textAlign: "center",
            border: "2px solid rgba(204, 255, 0, 0.4)",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
            boxShadow: "0 0 15px rgba(204, 255, 0, 0.3)",
            animation: "pulse 2s infinite ease-in-out"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <style>{`
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Navigation help overlay */}
      {showHelp && (
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "8px 12px",
          backgroundColor: "transparent",
          color: "white",
          fontSize: "12px",
          zIndex: 10,
          opacity: 1,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
          textShadow: "0px 0px 2px rgba(0, 0, 0, 0.8), 0px 0px 4px rgba(0, 0, 0, 0.6)"
        }}>
          <p style={{ margin: "0 0 4px 0" }}>Left click + drag: Rotate</p>
          <p style={{ margin: "0 0 4px 0" }}>Right click + drag: Pan</p>
          <p style={{ margin: "0" }}>Scroll: Zoom in/out</p>
        </div>
      )}
      
      {isLoading && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10
        }}>
          <div style={{
            color: "white",
            textAlign: "center"
          }}>
            Loading Model: {loadingProgress}%
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10
        }}>
          <div style={{
            color: "red",
            textAlign: "center"
          }}>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDShowcase; 