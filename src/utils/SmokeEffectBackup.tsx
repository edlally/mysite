import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * SmokeEffect - A beautiful 3D smoke effect using Three.js
 * 
 * This component creates a responsive ethereal smoke effect that
 * uses the site's theme color. It can be added back to any page
 * by importing and adding <SmokeEffect client:only="react" />.
 */
const SmokeEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let smokeParticles: THREE.Mesh[] = [];
    let clock: THREE.Clock;
    
    // Initialize the scene
    const init = () => {
      // Create clock for timing
      clock = new THREE.Clock();
      
      // Create renderer with proper alpha handling
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        premultipliedAlpha: false  // Important for correct alpha blending
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0); // Ensure transparent background
      containerRef.current?.appendChild(renderer.domElement);
      
      // Create scene
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.0008); // Add fog for smoother edges
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        1, 
        10000
      );
      camera.position.z = 1000;
      scene.add(camera);
      
      // Create ambient light
      const ambientLight = new THREE.AmbientLight(0x222222);
      scene.add(ambientLight);
      
      // Create directional light
      const light = new THREE.DirectionalLight(0xffffff, 0.5);
      light.position.set(-1, 0, 1);
      scene.add(light);
      
      // Get theme color from CSS variables for smoke color
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--sec')
        .trim();
      
      // Use theme color if available, fallback to cyan
      const smokeColor = themeColor ? themeColor : '#00dddd';
      
      // Create smoke particles
      const loader = new THREE.TextureLoader();
      // Make the loader crossOrigin to load from external URLs
      loader.crossOrigin = 'anonymous';
      
      // Load smoke texture
      loader.load(
        'https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png',
        (smokeTexture) => {
          // Ensure the texture has proper alpha handling
          smokeTexture.premultiplyAlpha = false;
          
          // Use AdditiveBlending for more ethereal effect
          const smokeMaterial = new THREE.MeshLambertMaterial({
            color: new THREE.Color(smokeColor),
            map: smokeTexture,
            transparent: true,
            opacity: 0.4,  // Lower base opacity
            blending: THREE.AdditiveBlending,  // Use additive blending for better transparency
            depthWrite: false,  // Disable depth writing for proper blending
            side: THREE.DoubleSide  // Render both sides of the plane
          });
          
          const smokeGeo = new THREE.PlaneGeometry(300, 300);
          
          // Create multiple smoke particles with varying sizes
          for (let p = 0; p < 150; p++) {
            const particle = new THREE.Mesh(smokeGeo, smokeMaterial.clone());
            
            // Random position in a wider area
            particle.position.set(
              Math.random() * 1000 - 500,
              Math.random() * 800 - 400,
              Math.random() * 1000 - 200
            );
            
            // Random rotation
            particle.rotation.z = Math.random() * Math.PI * 2;
            
            // Random scale with more variation
            const scale = Math.random() * 0.8 + 0.2;
            particle.scale.set(scale, scale, scale);
            
            // Store original position for reference
            (particle as any).originalY = particle.position.y;
            (particle as any).originalX = particle.position.x;
            (particle as any).originalZ = particle.position.z;
            (particle as any).randomSpeed = Math.random() * 0.5 + 0.5;
            
            scene.add(particle);
            smokeParticles.push(particle);
          }
          
          // After smoke is loaded, start animation
          animate();
        }
      );
      
      // Update renderer and camera when window is resized
      window.addEventListener('resize', onWindowResize);
    };
    
    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    // Animate smoke particles
    const evolveSmoke = (delta: number) => {
      const sp = smokeParticles.length;
      for (let i = 0; i < sp; i++) {
        const particle = smokeParticles[i];
        
        // Get custom properties
        const randomSpeed = (particle as any).randomSpeed || 1;
        
        // Rotate at different speeds with variation
        particle.rotation.z += delta * 0.1 * randomSpeed;
        
        // Add more natural floating movement based on sine waves
        const time = clock.elapsedTime;
        const originalY = (particle as any).originalY || 0;
        const originalX = (particle as any).originalX || 0;
        const originalZ = (particle as any).originalZ || 0;
        
        // Create more organic movement with multiple sine waves
        particle.position.y = originalY + Math.sin(time * 0.1 * randomSpeed + i) * 10;
        particle.position.x = originalX + Math.cos(time * 0.1 * randomSpeed + i * 0.7) * 10;
        particle.position.z = originalZ + Math.sin(time * 0.05 * randomSpeed + i * 0.3) * 20;
        
        // Change opacity for a subtle pulsing effect
        if (particle.material instanceof THREE.MeshLambertMaterial) {
          // More subtle opacity changes
          const opacityBase = 0.3 + (i % 3) * 0.1; // Vary base opacity
          const opacityVariation = Math.sin(time * 0.2 + i * 0.5) * 0.15;
          particle.material.opacity = Math.max(0.1, opacityBase + opacityVariation);
        }
      }
    };
    
    // Animation loop
    const animate = () => {
      const delta = clock.getDelta();
      
      // Listen for theme changes in CSS variables
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--sec')
        .trim();
      
      // Update smoke color if theme changes
      if (themeColor) {
        for (let i = 0; i < smokeParticles.length; i++) {
          const particle = smokeParticles[i];
          if (particle.material instanceof THREE.MeshLambertMaterial) {
            particle.material.color.set(themeColor);
          }
        }
      }
      
      evolveSmoke(delta);
      
      // Slowly rotate camera in a more interesting pattern
      const time = clock.elapsedTime;
      camera.position.x = Math.sin(time * 0.05) * 150;
      camera.position.y = Math.cos(time * 0.07) * 120;
      camera.position.z = 1000 + Math.sin(time * 0.03) * 100;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    // Initialize the scene
    init();
    
    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', onWindowResize);
      
      // Dispose of all resources
      smokeParticles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        if (particle.material instanceof THREE.MeshLambertMaterial) {
          particle.material.map?.dispose();
          particle.material.dispose();
        }
      });
      
      renderer.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default SmokeEffect; 