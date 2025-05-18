// src/js/SceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { gsap } from 'gsap'; // Not used directly in this version of SceneManager

export default class SceneManager {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('3D scene container not found:', containerSelector); return;
        }
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000); // Aspect set in onWindowResize
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.gltfLoader = new GLTFLoader();
        this.pedestal = null;
        this.celluloseMolecule = null;
        this.clock = new THREE.Clock();
        this.controls = null;
        this.directionalLight = null; // Make it a class property
        this.isAnimating = false; // Flag for animation loop
        this.animationFrameId = null; // To store rAF ID
        this.showPedestal = false; // Default
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug_pedestal') === 'false') {
            this.showPedestal = false;
        }
    }

    initMainScene() {
        if (!this.container) return;
        console.log('[SceneManager] Initializing main scene.');

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Clear container before appending, important if re-initializing
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 1.8, 7); // Adjusted for better view
        this.camera.lookAt(0, 0.8, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directionalLight.position.set(4, 8, 6);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 20;
         // More focused shadow frustum
        this.directionalLight.shadow.camera.left = -5;
        this.directionalLight.shadow.camera.right = 5;
        this.directionalLight.shadow.camera.top = 5;
        this.directionalLight.shadow.camera.bottom = -5;
        this.scene.add(this.directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
        this.scene.add(hemisphereLight);
        
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
        const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = -0.05; // Slightly below pedestal base
        groundPlane.receiveShadow = true;
        this.scene.add(groundPlane);

        this.loadModels();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0.8, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.4;
        this.controls.enablePan = false; // Restrict panning for a cleaner look

        // Defer sizing and starting animation loop
        requestAnimationFrame(() => {
            console.log('[SceneManager] Deferred sizing and animation start.');
            this.onWindowResize();
            this.startAnimationLoop(); // Use a dedicated method to start loop
        });

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    loadModels() {

        if (this.showPedestal) {
        const pedestalGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32);
        const pedestalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a5568, // Darker grey
            metalness: 0.7, roughness: 0.5 
        });
        this.pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        this.pedestal.position.y = 0.2;
        this.pedestal.castShadow = true;
        this.pedestal.receiveShadow = true;
        this.scene.add(this.pedestal);
            } else {
        // If pedestal is hidden, molecule might need to be positioned lower
        // For now, let's assume it still "floats" where the pedestal top would be.
        // Or adjust molecule's Y position here if pedestal is off.
    }

        this.gltfLoader.load('/assets/models/cellulose.glb', (gltf) => {
            this.celluloseMolecule = gltf.scene;
            this.celluloseMolecule.scale.set(0.4, 0.4, 0.4);
            this.celluloseMolecule.position.y = 0.9; // Adjusted to sit on pedestal
            this.celluloseMolecule.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.metalness = 0.2; // Slightly less metallic
                    child.material.roughness = 0.7; // More diffuse
                }
            });
            this.scene.add(this.celluloseMolecule);
            console.log('[SceneManager] Cellulose molecule loaded.');
        }, undefined, (error) => {
            console.error('Error loading cellulose molecule:', error);
            const fallbackGeo = new THREE.SphereGeometry(0.6, 32, 16);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x255F38 });
            this.celluloseMolecule = new THREE.Mesh(fallbackGeo, fallbackMat);
            this.celluloseMolecule.position.y = 0.9;
            this.celluloseMolecule.castShadow = true;
            this.scene.add(this.celluloseMolecule);
            console.log('[SceneManager] Fallback molecule created.');
        });
    }
    
    startAnimationLoop() {
        if (this.isAnimating) return; // Prevent multiple loops
        this.isAnimating = true;
        this.animate();
        console.log('[SceneManager] Animation loop started.');
    }

    stopAnimationLoop() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        console.log('[SceneManager] Animation loop stopped.');
    }

    animate() {
        if (!this.isAnimating) return; // Guard to stop loop

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        // const deltaTime = this.clock.getDelta(); // deltaTime not used currently

        if (this.showPedestal && this.pedestal) { // Check if it exists before rotating
                this.pedestal.rotation.y += 0.003;
            }
        if (this.celluloseMolecule && this.celluloseMolecule.parent) { // Ensure it's added
            this.celluloseMolecule.rotation.x += 0.001;
            this.celluloseMolecule.rotation.y -= 0.004;
        }

        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container || this.container.clientWidth === 0 || this.container.clientHeight === 0) {
            console.warn('[SceneManager] onWindowResize called with zero/invalid dimensions for container.');
            return;
        }
        console.log(`[SceneManager] Resizing to: ${this.container.clientWidth}x${this.container.clientHeight}`);
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    updateLighting(progress) {
        if (!this.directionalLight) return;
        let startColorHex, endColorHex;
        const bodyStyle = document.body.style; // Used for CSS variables, not Three.js light color

        if (document.body.classList.contains('dark-mode')) {
            // Dark mode lighting: Subtle shifts, maybe cooler tones
            // Example: Slightly bluer light for "morning", neutral for "noon", warmer for "evening"
            // This needs careful tuning for dark backgrounds
            const baseIntensity = 0.8;
            const intensityVariation = 0.4;
            this.directionalLight.intensity = baseIntensity + Math.sin(progress * Math.PI) * intensityVariation;

            let hue = 200 + (progress * 60); // Shift hue from blueish (200) to greenish (260)
            this.directionalLight.color.setHSL(hue / 360, 0.5, 0.6); // Saturation, Lightness

            // For background gradient, use CSS vars directly
            if (progress < 0.33) { 
                bodyStyle.setProperty('--bg-gradient-start', 'var(--dm-bg-deep)'); 
                bodyStyle.setProperty('--bg-gradient-end', 'var(--dm-bg-medium)');
            } else if (progress < 0.66) {
                 bodyStyle.setProperty('--bg-gradient-start', 'var(--dm-bg-medium)'); 
                 bodyStyle.setProperty('--bg-gradient-end', '#2c3e50'); /* Example: slightly different dark */
            } else {
                 bodyStyle.setProperty('--bg-gradient-start', '#2c3e50'); 
                 bodyStyle.setProperty('--bg-gradient-end', 'var(--dm-bg-deep)');
            }

        } else { // Light Mode
            if (progress < 0.33) { startColorHex = 0xFFF5B5; endColorHex = 0xFFFFFF; } // Morning
            else if (progress < 0.66) { startColorHex = 0xFFFFFF; endColorHex = 0xD0FFD0; } // Noon (slightly greenish white)
            else { startColorHex = 0xD0FFD0; endColorHex = 0xFFE08C; } // Evening (soft gold-green)
            
            let lerpFactor = (progress % 0.33) / 0.33;
            if (progress >= 0.66) lerpFactor = (progress - 0.66) / 0.34;
            else if (progress >= 0.33) lerpFactor = (progress - 0.33) / 0.33;

            this.directionalLight.color.lerpColors(new THREE.Color(startColorHex), new THREE.Color(endColorHex), lerpFactor);
            this.directionalLight.intensity = 1.0 + Math.sin(progress * Math.PI) * 0.5;
            
            // CSS vars for light mode gradient
            if (progress < 0.33) { bodyStyle.setProperty('--bg-gradient-start', '#FFFACD'); bodyStyle.setProperty('--bg-gradient-end', '#F0E68C');}
            else if (progress < 0.66) { bodyStyle.setProperty('--bg-gradient-start', '#FFFFFF'); bodyStyle.setProperty('--bg-gradient-end', '#E6FFE6');}
            else { bodyStyle.setProperty('--bg-gradient-start', '#E6FFE6'); bodyStyle.setProperty('--bg-gradient-end', '#FFD700');}
        }
        // Update homepage hero background explicitly if needed
        const heroSection = document.getElementById('homepage-hero');
        if(heroSection && !document.body.classList.contains('dark-mode')) { // Only for light mode hero
            heroSection.style.background = `linear-gradient(135deg, ${bodyStyle.getPropertyValue('--bg-gradient-start')}, ${bodyStyle.getPropertyValue('--bg-gradient-end')})`;
        } else if (heroSection) {
            heroSection.style.background = 'var(--color-background)'; // Use solid themed bg for dark hero
        }
    }
}