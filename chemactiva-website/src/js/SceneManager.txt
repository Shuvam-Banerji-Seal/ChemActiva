// src/js/SceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const IS_MOBILE = window.innerWidth <= 768;

export default class SceneManager {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('3D scene container not found:', containerSelector); 
            return;
        }        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, alpha: true });

        this.gltfLoader = new GLTFLoader();
        this.pedestal = null;
        this.celluloseMolecule = null;
        this.clock = new THREE.Clock();
        this.controls = null;
        this.directionalLight = null;
        this.isAnimating = false;
        this.animationFrameId = null;
        
        this.showPedestal = false; 
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug_pedestal') === 'true') {
            this.showPedestal = true;
        }

        this.isVisible = true; // Assume initially visible
        this.intersectionObserver = null;
    }

    initMainScene() {
        if (!this.container) return;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = !IS_MOBILE; 
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(this.renderer.domElement);

        // WebGL Context Loss/Restored Listeners
        this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false);
        this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);

        this.camera.position.set(0, 1.8, 7);
        this.camera.lookAt(0, 0.8, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directionalLight.position.set(4, 8, 6);
        this.directionalLight.castShadow = !IS_MOBILE; 
        this.directionalLight.shadow.mapSize.width = IS_MOBILE ? 512 : 1024; 
        this.directionalLight.shadow.mapSize.height = IS_MOBILE ? 512 : 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 20;
        this.directionalLight.shadow.camera.left = -5;
        this.directionalLight.shadow.camera.right = 5;
        this.directionalLight.shadow.camera.top = 5;
        this.directionalLight.shadow.camera.bottom = -5;
        this.scene.add(this.directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
        this.scene.add(hemisphereLight);
        
        if (!IS_MOBILE) {
            const groundGeometry = new THREE.PlaneGeometry(20, 20);
            const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
            const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
            groundPlane.rotation.x = -Math.PI / 2;
            groundPlane.position.y = -0.05; 
            groundPlane.receiveShadow = true;
            this.scene.add(groundPlane);
        }

        this.loadModels();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0.8, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;
        this.controls.enablePan = false;

        this.setupVisibilityObserver(); // Setup observer

        requestAnimationFrame(() => {
            this.onWindowResize();
            if (this.isVisible) { // Start loop only if visible
                this.startAnimationLoop();
            }
        });

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    setupVisibilityObserver() {
        if (!this.container || typeof IntersectionObserver === 'undefined') return;
        const options = {
            root: null, 
            rootMargin: '0px',
            threshold: 0.01 // Trigger when 1% is visible/hidden
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target === this.container) { // Ensure it's our container
                    if (entry.isIntersecting) {
                        this.isVisible = true;
                        if (!this.isAnimating) {
                            // console.log('[SceneManager] Hero became visible, restarting animation loop.');
                            this.startAnimationLoop();
                        }
                    } else {
                        this.isVisible = false;
                        if (this.isAnimating) {
                            // console.log('[SceneManager] Hero became hidden, stopping animation loop.');
                            this.stopAnimationLoop();
                        }
                    }
                }
            });
        }, options);
        this.intersectionObserver.observe(this.container);
    }

    handleContextLost(event) {
        event.preventDefault();
        console.warn('[SceneManager] WebGL context lost. Halting animation.');
        this.stopAnimationLoop(); 
    }

    handleContextRestored() {
        console.log('[SceneManager] WebGL context restored. Attempting to restart animation if visible.');
        // Re-initialize renderer settings that might be lost
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = !IS_MOBILE; 
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Textures and materials might need re-uploading/re-compiling.
        // Three.js attempts to handle some of this, but complex scenes might need manual intervention.
        // For now, restarting the loop is the first step.
        if (this.isVisible) {
             this.startAnimationLoop();
        }
    }


    loadModels() {
        // ... (no changes to loadModels itself)
        if (this.showPedestal) {
            const pedestalGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32);
            const pedestalMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x4a5568, 
                metalness: 0.7, roughness: 0.5 
            });
            this.pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
            this.pedestal.position.y = 0.2;
            this.pedestal.castShadow = !IS_MOBILE;
            this.pedestal.receiveShadow = !IS_MOBILE;
            this.scene.add(this.pedestal);
        }

        this.gltfLoader.load('/assets/models/cellulose.glb', (gltf) => {
            this.celluloseMolecule = gltf.scene;
            this.celluloseMolecule.scale.set(0.4, 0.4, 0.4);
            this.celluloseMolecule.position.y = this.showPedestal ? 0.9 : 0.7;
            this.celluloseMolecule.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = !IS_MOBILE;
                    child.receiveShadow = !IS_MOBILE;
                    child.material.metalness = 0.2; 
                    child.material.roughness = 0.7; 
                }
            });
            this.scene.add(this.celluloseMolecule);
        }, undefined, (error) => {
            console.error('Error loading cellulose molecule:', error);
            const fallbackGeo = new THREE.SphereGeometry(0.6, 32, 16);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x255F38 });
            this.celluloseMolecule = new THREE.Mesh(fallbackGeo, fallbackMat);
            this.celluloseMolecule.position.y = this.showPedestal ? 0.9 : 0.7;
            this.celluloseMolecule.castShadow = !IS_MOBILE;
            this.scene.add(this.celluloseMolecule);
        });
    }
    
    startAnimationLoop() {
        if (this.isAnimating || !this.isVisible) return; // Also check visibility here
        this.isAnimating = true;
        this.animate();
    }

    stopAnimationLoop() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    animate() {
        if (!this.isAnimating || !this.isVisible) { // Double check visibility
            if(this.isAnimating) this.stopAnimationLoop(); // Ensure loop stops if it became invisible
            return;
        }

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.showPedestal && this.pedestal && this.pedestal.parent) { 
            this.pedestal.rotation.y += 0.003;
        }
        if (this.celluloseMolecule && this.celluloseMolecule.parent) { 
            this.celluloseMolecule.rotation.x += 0.001;
            this.celluloseMolecule.rotation.y -= 0.004;
        }

        if (this.controls) this.controls.update();
        if (this.renderer) this.renderer.render(this.scene, this.camera); // Check renderer exists
    }

    onWindowResize() {
        if (!this.container || this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            return;
        }
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        if (this.renderer) this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }



    updateLighting(progress) {
        if (!this.directionalLight || !this.renderer) return; 
        
        const heroSection = document.getElementById('homepage-hero');

        if (IS_MOBILE) { 
            // Simplified but slightly dynamic lighting for mobile
            if (document.body.classList.contains('dark-mode')) {
                this.directionalLight.intensity = 0.8 + Math.sin(progress * Math.PI) * 0.3; // Subtle intensity change
                this.directionalLight.color.setHSL((200 + progress * 40) / 360, 0.4, 0.5); // Subtle hue shift
                if(heroSection) heroSection.style.background = ''; // Use CSS var for dark mode hero bg
            } else { // Light mode mobile
                this.directionalLight.intensity = 1.0 + Math.sin(progress * Math.PI) * 0.4;
                // Keep light color fairly constant or a very simple lerp if desired
                this.directionalLight.color.set(0xffffff); // White light
                if(heroSection) { 
                    // For mobile, use the default CSS gradient or a simpler one to save performance
                    // The CSS :root defines a static gradient for light mode initially
                    // If you want it to match the desktop's dynamic gradient, you'd copy that logic here
                    // but it might be too performant heavy for mobile.
                    // Let's try a simplified version of the desktop gradient:
                    let gradStart, gradEnd;
                    if (progress < 0.5) { gradStart = '#FFFACD'; gradEnd = '#F5F5DC';} // Softer transition
                    else { gradStart = '#F5F5DC'; gradEnd = '#E6FFE6';}
                    heroSection.style.background = `linear-gradient(135deg, ${gradStart}, ${gradEnd})`;
                }
            }
            return; 
        }

        // --- DESKTOP complex lighting logic ---
        const bodyStyle = document.documentElement.style; 
        let startColorHex, endColorHex;

        if (document.body.classList.contains('dark-mode')) {
            const baseIntensity = 0.8;
            const intensityVariation = 0.4;
            this.directionalLight.intensity = baseIntensity + Math.sin(progress * Math.PI) * intensityVariation;
            let hue = 200 + (progress * 60); 
            this.directionalLight.color.setHSL(hue / 360, 0.5, 0.6); 
            
            // If dark mode hero should also have a dynamic gradient via JS, add it here.
            // Otherwise, ensure it uses the CSS variable.
            if(heroSection) {
                // Example: Dark mode dynamic gradient (uncomment and adapt if needed)
                /*
                let dmGradStart, dmGradEnd;
                if (progress < 0.33) { dmGradStart = 'var(--dm-bg-deep)'; dmGradEnd = 'var(--dm-bg-medium)'; }
                else if (progress < 0.66) { dmGradStart = 'var(--dm-bg-medium)'; dmGradEnd = '#1a2810'; } // Slightly different dark
                else { dmGradStart = '#1a2810'; dmGradEnd = 'var(--dm-bg-deep)'; }
                heroSection.style.background = `linear-gradient(135deg, ${dmGradStart}, ${dmGradEnd})`;
                */
               // By default, let CSS handle dark mode hero background
               heroSection.style.background = ''; // Reset to use CSS var(--color-background)
            }

        } else { // Light Mode Desktop
            if (progress < 0.33) { startColorHex = 0xFFF5B5; endColorHex = 0xFFFFFF; } // Morning
            else if (progress < 0.66) { startColorHex = 0xFFFFFF; endColorHex = 0xD0FFD0; } // Noon
            else { startColorHex = 0xD0FFD0; endColorHex = 0xFFE08C; } // Evening
            
            let lerpFactor = (progress % 0.33) / 0.33;
            if (progress >= 0.66) lerpFactor = (progress - 0.66) / 0.34;
            else if (progress >= 0.33) lerpFactor = (progress - 0.33) / 0.33;

            this.directionalLight.color.lerpColors(new THREE.Color(startColorHex), new THREE.Color(endColorHex), lerpFactor);
            this.directionalLight.intensity = 1.0 + Math.sin(progress * Math.PI) * 0.5;
            
            if(heroSection) { // Desktop light mode hero gradient
                let gradStart, gradEnd;
                if (progress < 0.33) { gradStart = '#FFFACD'; gradEnd = '#F0E68C';}
                else if (progress < 0.66) { gradStart = '#FFFFFF'; gradEnd = '#E6FFE6';}
                else { gradStart = '#E6FFE6'; gradEnd = '#FFD700';}
                heroSection.style.background = `linear-gradient(135deg, ${gradStart}, ${gradEnd})`;
            }
        }
    }
// ... (keep the rest of SceneManager.js the same)

    // Optional: Method to clean up resources if SceneManager instance is no longer needed
    dispose() {
        // console.log('[SceneManager] Disposing resources...');
        this.stopAnimationLoop();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        if (this.renderer) {
            this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost.bind(this));
            this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored.bind(this));
            this.renderer.dispose(); // Dispose of WebGL resources
            if (this.renderer.domElement.parentElement) {
                this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }
        if (this.scene) {
            // Traverse and dispose geometries, materials, textures
            this.scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                // if (object.texture) object.texture.dispose(); // Not typical, textures are on materials
            });
            this.scene = null;
        }
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        this.camera = null;
        this.celluloseMolecule = null;
        this.pedestal = null;
        this.directionalLight = null;
        // console.log('[SceneManager] Resources disposed.');
    }
}