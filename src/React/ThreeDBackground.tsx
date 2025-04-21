'use client';

declare global {
  interface Window {
    setThreeDTheme?: (opts: { color?: string; emission?: string }) => void;
  }
}

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ThreeDBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameIdRef = useRef<number | NodeJS.Timeout | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const opacityRef = useRef<number>(1); // Start fully visible
  const fadeStateRef = useRef<'visible' | 'fadeOut' | 'fadeIn'>('visible');
  const animDurationRef = useRef<number>(0);
  const startFrameRef = useRef<number>(400);
  const isLoopingRef = useRef<boolean>(false);
  const cameraOrbitRef = useRef({
    radius: 0,
    targetAngle: 0,
    currentAngle: 0,
    height: 0,
    targetHeight: 0
  });
  // Default to true to ensure initial rendering
  const [isInViewport, setIsInViewport] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);
  const lastRenderTimeRef = useRef<number>(0);
  const renderIntervalRef = useRef<number>(33); // Faster initial renders (30fps)
  const isInitializedRef = useRef<boolean>(false);

  // Visibility change handler
  const handleVisibilityChange = useCallback(() => {
    setIsTabActive(!document.hidden);
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Intersection Observer for viewport visibility
  useEffect(() => {
    if (!mountRef.current) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsInViewport(entry.isIntersecting);
      });
    }, options);

    observer.observe(mountRef.current);

    return () => {
      if (mountRef.current) {
        observer.unobserve(mountRef.current);
      }
    };
  }, []);

  // Main initialization effect
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Set initialization flag - ensure we don't re-initialize if effect reruns
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    console.log("Initializing 3D Background"); // Debug log
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - using original settings
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    // Renderer with balanced performance settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable antialias for performance
      alpha: true, // Keep alpha for transparency
      powerPreference: 'high-performance',
      precision: 'lowp', // Low precision for performance
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Standard lighting to ensure visibility
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // Animation clock
    clockRef.current = new THREE.Clock();
    clockRef.current.start();

    // Load model
    const loader = new GLTFLoader();
    
    // Initial placeholder render to show something immediately
    renderer.render(scene, camera);
    
    loader.load(
      "/models/dadras.glb",
      (gltf) => {
        scene.add(gltf.scene);
        modelRef.current = gltf.scene;
        
        // Make materials transparent but fully visible initially
        modelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                material.transparent = true;
                material.opacity = 1;
                material.flatShading = true;
                material.needsUpdate = true;
              });
            } else {
              object.material.transparent = true;
              object.material.opacity = 1;
              object.material.flatShading = true;
              object.material.needsUpdate = true;
            }
          }
        });
        
        // Force opacity update at start
        opacityRef.current = 1;
        
        // Center model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.x = -center.x;
        gltf.scene.position.y = -center.y;
        gltf.scene.position.z = -center.z;
        
        // Fit camera
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = size / Math.tan((60 * Math.PI) / 180 / 2);
        camera.position.set(0, 0, distance * 1.5);
        // Set initial camera orbit radius
        cameraOrbitRef.current.radius = distance * 1.5;
        camera.updateProjectionMatrix();
        
        // Force an initial render
        renderer.render(scene, camera);
        
        // Animation
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(gltf.scene);
          const frameRate = 24;
          const startTimeInSeconds = startFrameRef.current / frameRate;
          
          gltf.animations.forEach((clip) => {
            const action = mixerRef.current!.clipAction(clip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.play();
          });
          
          // Set the mixer time to frame 400
          mixerRef.current.setTime(startTimeInSeconds);
          
          // Store animation duration for fading calculations
          if (gltf.animations[0]) {
            animDurationRef.current = gltf.animations[0].duration;
          }

          // Add event listener for animation finished
          mixerRef.current.addEventListener('finished', () => {
            if (mixerRef.current && !isLoopingRef.current) {
              isLoopingRef.current = true;
              // Reset animation to frame 400
              const frameRate = 24;
              const startTimeInSeconds = startFrameRef.current / frameRate;
              
              // Reset opacity and state
              opacityRef.current = 0;
              fadeStateRef.current = 'fadeIn';
              
              // Restart all animations from frame 400
              mixerRef.current.stopAllAction();
              
              gltf.animations.forEach((clip) => {
                const action = mixerRef.current!.clipAction(clip);
                action.reset();
                action.play();
              });
              
              mixerRef.current.setTime(startTimeInSeconds);
              
              // Allow looping again after a short delay
              setTimeout(() => {
                isLoopingRef.current = false;
              }, 100);
            }
          });
        }
        
        // Ensure animation starts
        if (!animationFrameIdRef.current) {
          animate();
        }
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Scroll handler with optimized throttling
    let lastScrollTime = 0;
    const scrollThrottle = 50;
    
    const handleScroll = () => {
      if (!cameraRef.current) return;
      
      const now = performance.now();
      if (now - lastScrollTime < scrollThrottle) return;
      lastScrollTime = now;
      
      // Calculate how far down the page the user has scrolled as a percentage
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
      
      // Map the scroll percentage to a full orbit (2π radians)
      cameraOrbitRef.current.targetAngle = scrollPercentage * Math.PI * 2;
      
      // Add slight vertical movement
      cameraOrbitRef.current.targetHeight = scrollPercentage * 2 - 1; // Range from -1 to 1
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Call once to initialize
    handleScroll();

    // Function to check and update fade state
    const checkFadeState = () => {
      if (!mixerRef.current || animDurationRef.current === 0) return;
      
      const fadeOutThreshold = 0.8; // Start fading out at 80% of animation
      const time = mixerRef.current.time % animDurationRef.current;
      const normalizedTime = time / animDurationRef.current;
      
      // Handle fade states
      if (normalizedTime < 0.1 && fadeStateRef.current !== 'fadeIn') {
        // Start of animation - fade in
        fadeStateRef.current = 'fadeIn';
      } else if (normalizedTime > fadeOutThreshold && fadeStateRef.current === 'visible') {
        // End of animation - fade out
        fadeStateRef.current = 'fadeOut';
      }
      
      // Update opacity based on fade state
      if (fadeStateRef.current === 'fadeOut') {
        // Calculate how far we are into the fade out (0 to 1)
        const fadeProgress = (normalizedTime - fadeOutThreshold) / (1 - fadeOutThreshold);
        opacityRef.current = 1 - fadeProgress;
      } else if (fadeStateRef.current === 'fadeIn') {
        // Calculate how far we are into the fade in (0 to 1)
        const fadeProgress = normalizedTime / 0.1; // First 10% of animation
        opacityRef.current = Math.min(1, fadeProgress);
      } else {
        opacityRef.current = 1; // Fully visible
      }
      
      // Reset to visible when fade in completes
      if (fadeStateRef.current === 'fadeIn' && normalizedTime > 0.1) {
        fadeStateRef.current = 'visible';
      }
    };

    // Optimized animation loop
    const lastOpacityRef = {current: -1};
    function animate() {
      // Reduced animation rate when not visible
      if (!isInViewport || !isTabActive) {
        animationFrameIdRef.current = setTimeout(() => {
          requestAnimationFrame(animate);
        }, 250);
        return;
      }
      
      const now = performance.now();
      if (now - lastRenderTimeRef.current < renderIntervalRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }
      lastRenderTimeRef.current = now;

      if (mixerRef.current && clockRef.current) {
        const delta = clockRef.current.getDelta();
        const cappedDelta = Math.min(delta, 1/30);
        mixerRef.current.update(cappedDelta);
        checkFadeState();
      }

      // Update camera position
      if (cameraRef.current) {
        const angleDiff = cameraOrbitRef.current.targetAngle - cameraOrbitRef.current.currentAngle;
        cameraOrbitRef.current.currentAngle += angleDiff * 0.05;
        
        const heightDiff = cameraOrbitRef.current.targetHeight - cameraOrbitRef.current.height;
        cameraOrbitRef.current.height += heightDiff * 0.05;
        
        const x = Math.sin(cameraOrbitRef.current.currentAngle) * cameraOrbitRef.current.radius;
        const z = Math.cos(cameraOrbitRef.current.currentAngle) * cameraOrbitRef.current.radius;
        const y = cameraOrbitRef.current.height * 2;
        
        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Update model opacity with threshold
      if (modelRef.current && Math.abs(lastOpacityRef.current - opacityRef.current) > 0.05) {
        const newOpacity = opacityRef.current;
        
        modelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                material.opacity = newOpacity;
              });
            } else {
              object.material.opacity = newOpacity;
            }
          }
        });
        lastOpacityRef.current = newOpacity;
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }

    // Start animation immediately
    animate();

    // Resize handler with throttling
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        if (!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        
        // Force a render on resize
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }, 100);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Theme switching
    window.setThreeDTheme = function({ color, emission }) {
      if (!modelRef.current) return;
      const targetColor = new THREE.Color(color || '#CCFF00');
      const targetEmission = new THREE.Color(emission || '#CCFF00');
      let start = null;
      let duration = 1000;
      let meshMaterials = [];
      
      modelRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => meshMaterials.push(mat));
          } else {
            meshMaterials.push(object.material);
          }
        }
      });
      
      const initialColors = meshMaterials.map(mat => mat.color ? mat.color.clone() : null);
      const initialEmissions = meshMaterials.map(mat => mat.emissive ? mat.emissive.clone() : null);
      
      function animateTheme(ts) {
        if (!start) start = ts;
        let t = Math.min((ts - start) / duration, 1);
        meshMaterials.forEach((mat, i) => {
          if (mat.color && initialColors[i]) {
            mat.color.lerpColors(initialColors[i], targetColor, t);
            mat.needsUpdate = true;
          }
          if (mat.emissive && initialEmissions[i]) {
            mat.emissive.lerpColors(initialEmissions[i], targetEmission, t);
            mat.needsUpdate = true;
          }
        });
        if (t < 1) {
          requestAnimationFrame(animateTheme);
        }
      }
      requestAnimationFrame(animateTheme);
    };

    // Check model visibility
    const checkVisibility = () => {
      if (modelRef.current) {
        let needsUpdate = false;
        
        modelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => {
                if (!material.visible) {
                  material.visible = true;
                  needsUpdate = true;
                }
                if (material.opacity <= 0) {
                  material.opacity = 1;
                  needsUpdate = true;
                }
              });
            } else {
              if (!object.material.visible) {
                object.material.visible = true;
                needsUpdate = true;
              }
              if (object.material.opacity <= 0) {
                object.material.opacity = 1;
                needsUpdate = true;
              }
            }
            
            if (!object.visible) {
              object.visible = true;
              needsUpdate = true;
            }
          }
        });
        
        if (needsUpdate && rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };
    
    // Check visibility after loading
    setTimeout(checkVisibility, 1000);
    
    // Schedule regular visibility checks
    const visibilityInterval = setInterval(checkVisibility, 5000);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      
      if (animationFrameIdRef.current) {
        if (typeof animationFrameIdRef.current === 'number') {
          cancelAnimationFrame(animationFrameIdRef.current);
        } else {
          clearTimeout(animationFrameIdRef.current);
        }
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
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      clearInterval(visibilityInterval);
    };
  }, []); // Remove dependencies to prevent reinitializing

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        zIndex: "-1",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        overflow: "hidden",
        background: "transparent"
      }}
      aria-hidden="true"
    />
  );
};

export default ThreeDBackground; 