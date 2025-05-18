// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';

const IS_MOBILE = window.innerWidth <= 760;

export default class HeroLoader {
    constructor(loaderSelector) {
        // console.log('[HeroLoader] Constructor called.');
        this.loaderElement = document.querySelector(loaderSelector);
        if (!this.loaderElement) {
            console.error('[HeroLoader] Loader element NOT FOUND:', loaderSelector); 
            return;
        }
        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        if (!this.backgroundElement) console.error('[HeroLoader] Loader background element NOT FOUND');
        
        this.contentElement = this.loaderElement.querySelector('#loader-content');
        if (!this.contentElement) console.error('[HeroLoader] Loader content element NOT FOUND');

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Aspect ratio set in initThreeScene
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !IS_MOBILE });
        
        this.particles = null;
        this.particleMaterial = null;
        this.isAnimatingParticles = false;
        this.animationFrameId = null;
        // console.log('[HeroLoader] Constructor finished.');
    }

    initThreeScene() {
        // console.log('[HeroLoader] initThreeScene for particles.');
        if (!this.contentElement) {
            console.error("[HeroLoader] contentElement is null in initThreeScene.");
            return;
        }
        
        if (this.contentElement.clientWidth === 0 || this.contentElement.clientHeight === 0) {
            // console.warn('[HeroLoader] contentElement has no/zero dimensions. Setting fallback renderer size.');
            this.renderer.setSize(300, 300); 
            this.camera.aspect = 1;
        } else {
            this.renderer.setSize(this.contentElement.clientWidth, this.contentElement.clientHeight);
            this.camera.aspect = this.contentElement.clientWidth / this.contentElement.clientHeight;
        }
        this.camera.updateProjectionMatrix();
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        while (this.contentElement.firstChild) { 
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        this.contentElement.appendChild(this.renderer.domElement);        

        // --- PARTICLE GENERATION LOGIC ---
        this.camera.position.z = 20; // Move camera further back to see particles coming from wider area
        const targetShapeZ = 0;    // Z-plane where the final particle shape will form (relative to camera)
                                   // This means the shape is 7 units away from the camera's origin if camera.position.z is 7

        // Calculate the visible rectangle at targetShapeZ
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        // Distance from camera to the plane where the target shape forms
        const distanceToShapePlane = Math.abs(this.camera.position.z - targetShapeZ); 
        const frustumHeightAtShapePlane = 2 * Math.tan(vFOV / 2) * distanceToShapePlane;
        const frustumWidthAtShapePlane = frustumHeightAtShapePlane * this.camera.aspect;

        const particleCount = IS_MOBILE ? 1800 : 3000; // Slightly reduced for performance
        const positions = new Float32Array(particleCount * 3);
        const targetPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount);

        const chairTargets = [ 
            new THREE.Vector3(1, 0.25, 0).multiplyScalar(1.5), // Slightly larger target shape
            new THREE.Vector3(0.5, -0.25, 0.433).multiplyScalar(1.5),
            new THREE.Vector3(-0.5, -0.25, 0.433).multiplyScalar(1.5), 
            new THREE.Vector3(-1, 0.25, 0).multiplyScalar(1.5),
            new THREE.Vector3(-0.5, 0.75, -0.433).multiplyScalar(1.5), 
            new THREE.Vector3(0.5, 0.75, -0.433).multiplyScalar(1.5)
        ];

        const bodyIsDark = document.body.classList.contains('dark-mode');
        const particleHexColor = bodyIsDark 
            ? getComputedStyle(document.documentElement).getPropertyValue('--dm-accent-secondary').trim() 
            : getComputedStyle(document.documentElement).getPropertyValue('--lm-accent-secondary').trim();
        const particleColor = new THREE.Color(particleHexColor || (bodyIsDark ? '#328E6E' : '#67AE6E'));

        const startSpreadMultiplier = 1.8; // How much wider than the screen to start particles (e.g., 1.5 = 50% wider)
        const initialZSpread = 4; // How far out in Z particles can start (in addition to targetShapeZ)


        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const randomSide = Math.random();
            let x, y, z;

            // Start particles well outside the calculated frustum at targetShapeZ
            if (randomSide < 0.25) { // Top edge
                x = (Math.random() - 0.5) * frustumWidthAtShapePlane * startSpreadMultiplier;
                y = (frustumHeightAtShapePlane / 2) * (1 + Math.random() * (startSpreadMultiplier -1)); // From edge up to spreadMultiplier * edge
            } else if (randomSide < 0.5) { // Bottom edge
                x = (Math.random() - 0.5) * frustumWidthAtShapePlane * startSpreadMultiplier;
                y = (-frustumHeightAtShapePlane / 2) * (1 + Math.random() * (startSpreadMultiplier -1));
            } else if (randomSide < 0.75) { // Left edge
                x = (-frustumWidthAtShapePlane / 2) * (1 + Math.random() * (startSpreadMultiplier -1));
                y = (Math.random() - 0.5) * frustumHeightAtShapePlane * startSpreadMultiplier;
            } else { // Right edge
                x = (frustumWidthAtShapePlane / 2) * (1 + Math.random() * (startSpreadMultiplier -1));
                y = (Math.random() - 0.5) * frustumHeightAtShapePlane * startSpreadMultiplier;
            }
            
            // Initial Z position: start further away from the camera than targetShapeZ
            // Ensure they start "behind" the targetShapeZ from the camera's perspective
            z = targetShapeZ - (Math.random() * initialZSpread + 1); // Start 1 to (initialZSpread+1) units "behind" targetShapeZ

            positions[i3]     = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            // Target positions remain relative to the targetShapeZ plane
            const target = chairTargets[i % chairTargets.length];
            targetPositions[i3]   = target.x + (Math.random() - 0.5) * 0.4; // More jitter for a less rigid shape
            targetPositions[i3+1] = target.y + (Math.random() - 0.5) * 0.4;
            targetPositions[i3+2] = targetShapeZ + target.z + (Math.random() - 0.5) * 0.4; 

            colors[i3] = particleColor.r; colors[i3+1] = particleColor.g; colors[i3+2] = particleColor.b;
            opacities[i] = 0;
        }
        // --- END OF PARTICLE GENERATION LOGIC ---

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));

        this.particleMaterial = new THREE.PointsMaterial({
            size: IS_MOBILE ? 0.05 : 0.065, // Adjusted particle size
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1 
        });

        this.particles = new THREE.Points(geometry, this.particleMaterial);
        this.scene.add(this.particles);
        // console.log('[HeroLoader] Particles created.');
    }

    start() {
        // console.log('[HeroLoader] Particle start() called.');
        this.isAnimatingParticles = true; 

        return new Promise((resolve, reject) => {
            try {
                gsap.to(this.contentElement, { opacity: 1, duration: 0.4 });
                this.initThreeScene(); 
                this.animate(); 

                if (!this.particles) {
                    console.error("[HeroLoader] Particles not initialized. Aborting animation.");
                    this.stopAnimation();
                    reject("Particles not initialized");
                    return;
                }

                const particlePositions = this.particles.geometry.attributes.position.array;
                const targetPositionsArray = this.particles.geometry.attributes.targetPosition.array;
                const particleAlphas = this.particles.geometry.attributes.alpha.array;

                const tl = gsap.timeline({
                    onUpdate: () => {
                        if (this.particles) {
                            this.particles.geometry.attributes.position.needsUpdate = true;
                            this.particles.geometry.attributes.alpha.needsUpdate = true;
                        }
                    },
                    onComplete: () => {
                        gsap.to(this.particles.material, {
                            opacity: 0, duration: 0.6, delay: 0.25, 
                            onComplete: () => {
                                gsap.to(this.backgroundElement, { 
                                    opacity: 0, duration: 0.6,
                                    onComplete: () => {
                                        if (this.loaderElement) this.loaderElement.style.display = 'none';
                                        this.stopAnimation();
                                        resolve();
                                    }
                                });
                                gsap.to(this.contentElement, {opacity: 0, duration: 0.4});
                            }
                        });
                    }
                });

                for (let i = 0; i < particlePositions.length / 3; i++) {
                    const i3 = i * 3;
                    tl.to(particlePositions, {
                        [i3]: targetPositionsArray[i3],
                        [i3+1]: targetPositionsArray[i3+1],
                        [i3+2]: targetPositionsArray[i3+2], // This animates Z to the target Z
                        duration: 1.7 + Math.random() * 0.8, // Slightly longer, more varied duration
                        ease: "power2.inOut" // Smooth ease
                    }, Math.random() * 0.3); // Stagger start times

                    tl.to(particleAlphas, { [i]: 1.0, duration: 0.8, ease: "circ.out" }, "<0.3"); // Fade in quicker
                }

                // Animate camera zooming in slightly towards the forming shape
                tl.to(this.camera.position, { z: 5, duration: 2.5, ease: "sine.inOut" }, 0); // Camera moves from 7 to 5
            } catch (error) {
                console.error("[HeroLoader] Error within particle start() promise:", error);
                this.stopAnimation();
                reject(error);
            }
        });
    }

    animate() {
        if (!this.isAnimatingParticles) return; 

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        if (this.particles) {
            this.particles.rotation.y += 0.0005; // Subtle rotation of the forming shape
            this.particles.rotation.x += 0.0002;
        }
        this.renderer.render(this.scene, this.camera);
    }

    stopAnimation() {
        this.isAnimatingParticles = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}