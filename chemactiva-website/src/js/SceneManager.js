// src/js/SceneManager.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

export default class SceneManager {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('3D scene container not found:', containerSelector);
            return;
        }
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha true for transparent bg

        this.gltfLoader = new GLTFLoader();
        this.pedestal = null;
        this.celluloseMolecule = null;
        this.floatingFragments = [];

        this.clock = new THREE.Clock();
    }

    initMainScene() {
        if (!this.container) return;
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 1, 0);

     


        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
        this.container.appendChild(this.renderer.domElement);

        // this.camera.position.set(0, 2, 10); // Adjusted camera position
        // this.camera.lookAt(0, 1, 0); // Look at the center of the pedestal (approx)

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.directionalLight.position.set(5, 10, 7.5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.scene.add(this.directionalLight);

        // Optional: Hemisphere Light for softer fill
        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        this.scene.add(hemisphereLight);
        this.scene.add(this.directionalLight);
        
        // Create simple ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 }); // Receives shadows, but is transparent
        const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = 0; // Base of pedestal
        groundPlane.receiveShadow = true;
        this.scene.add(groundPlane);

        this.loadModels();
        // this.createFloatingFragments(); // Optional: add this later

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0); // Target the pedestal center
        this.controls.enableDamping = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;


           requestAnimationFrame(() => {
        console.log('[SceneManager] Deferred sizing and animation start.');
        this.onWindowResize(); // Call onWindowResize to set initial size correctly
        this.animate();        // Start the animation loop AFTER initial sizing
    });

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.animate();
    }

    loadModels() {
        // Pedestal (using a simple cylinder for now, or load GLTF)
        const pedestalGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.5, 32); // topRadius, bottomRadius, height, radialSegments
        const pedestalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555, // Dark gray, futuristic
            metalness: 0.8, 
            roughness: 0.4 
        });
        this.pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        this.pedestal.position.y = 0.25; // Half height, so it sits on the ground
        this.pedestal.castShadow = true;
        this.pedestal.receiveShadow = true;
        this.scene.add(this.pedestal);

        // Cellulose Molecule (load GLTF)
        this.gltfLoader.load('/assets/models/cellulose.glb', (gltf) => {
            this.celluloseMolecule = gltf.scene;
            this.celluloseMolecule.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
            this.celluloseMolecule.position.y = 1.5; // Position on top of pedestal
            
            this.celluloseMolecule.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Optional: Adjust material if needed
                    // child.material.metalness = 0.1;
                    // child.material.roughness = 0.8;
                }
            });
            this.scene.add(this.celluloseMolecule);
        }, undefined, (error) => {
            console.error('Error loading cellulose molecule:', error);
            // Fallback: create a simple sphere
            const fallbackGeo = new THREE.SphereGeometry(0.8, 32, 32);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            this.celluloseMolecule = new THREE.Mesh(fallbackGeo, fallbackMat);
            this.celluloseMolecule.position.y = 1.5;
            this.celluloseMolecule.castShadow = true;
            this.scene.add(this.celluloseMolecule);
        });
    }

    createFloatingFragments() {
        // Optional: Create subtle floating cellulose fragments in background
        const fragmentGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const fragmentMaterial = new THREE.MeshBasicMaterial({ color: 0xA8D5BA, transparent: true, opacity: 0.3 });
        for (let i = 0; i < 50; i++) {
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            fragment.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10 + 1, // Centered vertically around molecule
                (Math.random() - 0.5) * 10 - 5  // Behind main molecule
            );
            this.scene.add(fragment);
            this.floatingFragments.push({mesh: fragment, speed: Math.random() * 0.1 + 0.05});
        }
    }

    updateFloatingFragments(deltaTime) {
        this.floatingFragments.forEach(frag => {
            frag.mesh.position.y += frag.speed * deltaTime;
            if (frag.mesh.position.y > 6) { // Reset if it goes too high
                frag.mesh.position.y = -4;
                frag.mesh.position.x = (Math.random() - 0.5) * 20;
            }
        });
    }

    animate() {
            if (!this.isAnimating) {
        this.isAnimating = true; // Add a flag: private isAnimating = false; in constructor
    }
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();

        if (this.pedestal) {
            this.pedestal.rotation.y += 0.005; // Slow rotation
        }
        if (this.celluloseMolecule) {
            this.celluloseMolecule.rotation.y -= 0.008; // Counter-rotation or different speed
        }

        if (this.controls) this.controls.update();
        this.updateFloatingFragments(deltaTime);

        this.renderer.render(this.scene, this.camera);
        
    }

    onWindowResize() {
            if (!this.container || this.container.clientWidth === 0 || this.container.clientHeight === 0) {
        // Added a guard against zero dimensions which can happen during brief layout shifts
        console.warn('[SceneManager] onWindowResize called with zero dimensions for container. Postponing resize.');
         return;
    }

       console.log(`[SceneManager] Resizing to: ${this.container.clientWidth}x${this.container.clientHeight}`);

    // this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    // this.camera.updateProjectionMatrix();
    // this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    // Method to be called by ScrollTrigger for lighting changes
    updateLighting(progress) { // progress is 0 to 1
        // Morning (soft yellow) -> Noon (bright white) -> Evening (gold-green)
        // This is a simplified example. You might want to control multiple light properties.
        let color;
        const bodyStyle = document.body.style;

        if (progress < 0.33) { // Morning
            color = new THREE.Color().lerpColors(new THREE.Color(0xFFF5B5), new THREE.Color(0xFFFFFF), progress / 0.33);
            bodyStyle.setProperty('--bg-gradient-start', '#FFFACD'); // LemonChiffon
            bodyStyle.setProperty('--bg-gradient-end', '#F0E68C');   // Khaki
        } else if (progress < 0.66) { // Noon
            color = new THREE.Color().lerpColors(new THREE.Color(0xFFFFFF), new THREE.Color(0xB0E57C), (progress - 0.33) / 0.33);
             bodyStyle.setProperty('--bg-gradient-start', '#FFFFFF'); // White
            bodyStyle.setProperty('--bg-gradient-end', '#E0FFFF');   // LightCyan
        } else { // Evening
            color = new THREE.Color().lerpColors(new THREE.Color(0xB0E57C), new THREE.Color(0xDAA520), (progress - 0.66) / 0.34); // Gold-Green to Gold
             bodyStyle.setProperty('--bg-gradient-start', '#90EE90'); // LightGreen
            bodyStyle.setProperty('--bg-gradient-end', '#FFD700');   // Gold
        }
        this.directionalLight.color = color;
        // this.ambientLight.color = color; // Might make it too monochromatic, adjust intensity instead
        this.directionalLight.intensity = 1.0 + Math.sin(progress * Math.PI) * 0.8; // Intensity peaks at noon (progress=0.5)
        
        // Update CSS variables for body background gradient
        document.documentElement.style.setProperty('--current-bg-color', `linear-gradient(135deg, ${bodyStyle.getPropertyValue('--bg-gradient-start')}, ${bodyStyle.getPropertyValue('--bg-gradient-end')})`);
        // For solid color bg transition, update body.style.backgroundColor directly
    }
}