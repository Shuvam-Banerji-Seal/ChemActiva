// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';

export default class HeroLoader {
    constructor(loaderSelector) {
        console.log('[HeroLoader] Constructor called.');
        this.loaderElement = document.querySelector(loaderSelector);
        if (!this.loaderElement) {
            console.error('[HeroLoader] Loader element NOT FOUND:', loaderSelector); return;
        }
        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        if (!this.backgroundElement) console.error('[HeroLoader] Loader background element NOT FOUND');
        
        this.contentElement = this.loaderElement.querySelector('#loader-content');
        if (!this.contentElement) console.error('[HeroLoader] Loader content element NOT FOUND');
        else console.log('[HeroLoader] Loader content element found:', this.contentElement);

        this.scene = new THREE.Scene();
        // Aspect ratio will be set in initThreeScene
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); 
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.particles = null;
        this.particleMaterial = null;
        this.isAnimatingParticles = false; // Initialize flag

        console.log('[HeroLoader] Constructor finished.');
    }

    initThreeScene() {
        console.log('[HeroLoader] initThreeScene for particles.');
        if (!this.contentElement) {
            console.error("[HeroLoader] contentElement is null in initThreeScene.");
            return;
        }

        if (this.contentElement.clientWidth === 0 || this.contentElement.clientHeight === 0) {
            console.warn('[HeroLoader] contentElement has no/zero dimensions. Setting fallback renderer size.');
            this.renderer.setSize(300, 300); // Fallback
            this.camera.aspect = 1;
        } else {
            this.renderer.setSize(this.contentElement.clientWidth, this.contentElement.clientHeight);
            this.camera.aspect = this.contentElement.clientWidth / this.contentElement.clientHeight;
        }
        this.camera.updateProjectionMatrix();
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // Clear content element before appending, in case of re-init
        while (this.contentElement.firstChild) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
        this.contentElement.appendChild(this.renderer.domElement);
        console.log('[HeroLoader] Renderer appended to contentElement.');

        this.camera.position.z = 5; // Initial camera Z for particle view

        const particleCount = 5000; // Or 3000 for better performance initially
        const positions = new Float32Array(particleCount * 3);
        const targetPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount);

        const chairTargets = [ // Simplified cyclohexane targets
            new THREE.Vector3(1, 0.25, 0).multiplyScalar(1.2), 
            new THREE.Vector3(0.5, -0.25, 0.433).multiplyScalar(1.2),
            new THREE.Vector3(-0.5, -0.25, 0.433).multiplyScalar(1.2), 
            new THREE.Vector3(-1, 0.25, 0).multiplyScalar(1.2),
            new THREE.Vector3(-0.5, 0.75, -0.433).multiplyScalar(1.2), 
            new THREE.Vector3(0.5, 0.75, -0.433).multiplyScalar(1.2)
        ];

        // Get themed particle color
        const bodyIsDark = document.body.classList.contains('dark-mode');
        const particleHexColor = bodyIsDark ? getComputedStyle(document.documentElement).getPropertyValue('--dm-accent-secondary').trim() : getComputedStyle(document.documentElement).getPropertyValue('--lm-accent-secondary').trim();
        const particleColor = new THREE.Color(particleHexColor || (bodyIsDark ? '#328E6E' : '#67AE6E'));


        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const edge = Math.random();
            const randomDepth = (Math.random() - 0.5) * 4;
            const spread = 8; // How far out particles start

            if (edge < 0.25) { // Top
                positions[i3] = (Math.random() - 0.5) * spread * this.camera.aspect; positions[i3+1] = spread/2; positions[i3+2] = randomDepth;
            } else if (edge < 0.5) { // Bottom
                positions[i3] = (Math.random() - 0.5) * spread * this.camera.aspect; positions[i3+1] = -spread/2; positions[i3+2] = randomDepth;
            } else if (edge < 0.75) { // Left
                positions[i3] = -spread/2 * this.camera.aspect; positions[i3+1] = (Math.random() - 0.5) * spread; positions[i3+2] = randomDepth;
            } else { // Right
                positions[i3] = spread/2 * this.camera.aspect; positions[i3+1] = (Math.random() - 0.5) * spread; positions[i3+2] = randomDepth;
            }

            const target = chairTargets[i % chairTargets.length];
            targetPositions[i3] = target.x + (Math.random() - 0.5) * 0.3; // Jitter
            targetPositions[i3+1] = target.y + (Math.random() - 0.5) * 0.3;
            targetPositions[i3+2] = target.z + (Math.random() - 0.5) * 0.3;

            colors[i3] = particleColor.r; colors[i3+1] = particleColor.g; colors[i3+2] = particleColor.b;
            opacities[i] = 0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));

        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.06, // Adjust size
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1 // Base opacity for material, attribute controls per-particle
        });

        this.particles = new THREE.Points(geometry, this.particleMaterial);
        this.scene.add(this.particles);
        console.log('[HeroLoader] Particles created.');

        // No extra lights needed for emissive-like particles with AdditiveBlending if colors are bright
    }

    start() {
        console.log('[HeroLoader] Particle start() called.');
        this.isAnimatingParticles = false; // Reset animation flag

        return new Promise((resolve, reject) => {
            try {
                gsap.to(this.contentElement, { opacity: 1, duration: 0.5 });
                this.initThreeScene(); // Re-initialize scene in case of theme change affecting colors
                this.animate();

                if (!this.particles) {
                    console.error("[HeroLoader] Particles not initialized. Aborting animation.");
                    reject("Particles not initialized");
                    return;
                }

                const particlePositions = this.particles.geometry.attributes.position.array;
                const targetPositionsArray = this.particles.geometry.attributes.targetPosition.array;
                const particleAlphas = this.particles.geometry.attributes.alpha.array;

                const tl = gsap.timeline({
                    onStart: () => console.log('[HeroLoader] Particle animation timeline started.'),
                    onUpdate: () => {
                        if (this.particles) {
                            this.particles.geometry.attributes.position.needsUpdate = true;
                            this.particles.geometry.attributes.alpha.needsUpdate = true;
                        }
                    },
                    onComplete: () => {
                        console.log("[HeroLoader] Particle animation COMPLETE. Fading out loader.");
                        gsap.to(this.particles.material, {
                            opacity: 0, duration: 0.8, delay: 0.3, // Shorter hold, faster fade
                            onComplete: () => {
                                gsap.to(this.backgroundElement, { 
                                    opacity: 0, duration: 0.8,
                                    onComplete: () => {
                                        if (this.loaderElement) this.loaderElement.style.display = 'none';
                                        this.stopAnimation(); // Stop rAF loop
                                        resolve();
                                    }
                                });
                                gsap.to(this.contentElement, {opacity: 0, duration: 0.5});
                            }
                        });
                    }
                });

                for (let i = 0; i < particlePositions.length / 3; i++) {
                    const i3 = i * 3;
                    tl.to(particlePositions, {
                        [i3]: targetPositionsArray[i3],
                        [i3+1]: targetPositionsArray[i3+1],
                        [i3+2]: targetPositionsArray[i3+2],
                        duration: 1.8 + Math.random() * 0.7, // Slightly adjust timing
                        ease: "power2.inOut"
                    }, Math.random() * 0.3); 

                    tl.to(particleAlphas, { [i]: 1.0, duration: 1.0, ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false})" }, "<0.3");
                }

                tl.to(this.camera.position, { z: 3.5, duration: 2.8, ease: "sine.inOut" }, 0);
            } catch (error) {
                console.error("[HeroLoader] Error within particle start() promise:", error);
                this.stopAnimation();
                reject(error);
            }
        });
    }

    animate() {
        if (!this.isAnimatingParticles) {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
            this.isAnimatingParticles = true;
        } else {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        }
        
        if(this.particles) {
            // this.particles.rotation.y += 0.0005; // Very subtle rotation
        }
        this.renderer.render(this.scene, this.camera);
    }

    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.isAnimatingParticles = false;
        console.log('[HeroLoader] Animation stopped.');
    }
}