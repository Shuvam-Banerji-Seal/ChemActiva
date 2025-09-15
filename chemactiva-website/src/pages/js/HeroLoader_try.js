// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';

const IS_MOBILE = window.innerWidth <= 768;

export default class HeroLoader {
    constructor(loaderSelector) {
        this.loaderElement = document.querySelector(loaderSelector);
        if (!this.loaderElement) {
            console.error('[HeroLoader] CRITICAL: Loader element NOT FOUND:', loaderSelector);
            return;
        }
        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        this.contentElement = this.loaderElement.querySelector('#loader-content'); // Will hold canvas & img
        if (!this.backgroundElement || !this.contentElement) {
            console.error('[HeroLoader] CRITICAL: Background or content element missing in loader.');
            return;
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !IS_MOBILE });
        
        this.particles = null;
        this.particleMaterial = null;
        this.isAnimatingParticles = false;
        this.animationFrameId = null;
        this.logoImageElement = null; // HTML <img> element for the logo
    }

    initThreeSceneAndLogoElement() {
        // console.log('[HeroLoader] initThreeSceneAndLogoElement called');
        if (!this.contentElement) {
             console.error("[HeroLoader] No contentElement in initThreeSceneAndLogoElement");
             return false; // Indicate failure
        }

        const containerWidth = this.contentElement.clientWidth || window.innerWidth;
        const containerHeight = this.contentElement.clientHeight || window.innerHeight;

        this.renderer.setSize(containerWidth, containerHeight);
        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Clear previous content (canvas or fallback image)
        while (this.contentElement.firstChild) { 
            this.contentElement.removeChild(this.contentElement.firstChild);
        }

        const canvasElement = this.renderer.domElement;
        canvasElement.style.position = 'absolute'; // Canvas behind the logo
        canvasElement.style.top = '0';
        canvasElement.style.left = '0';
        canvasElement.style.width = '100%';
        canvasElement.style.height = '100%';
        this.contentElement.appendChild(canvasElement);

        // Create and style the HTML <img> element for the logo
        this.logoImageElement = document.createElement('img');
        this.logoImageElement.src = '/assets/images/logo-small_size.png'; // Ensure this path is correct
        this.logoImageElement.alt = 'ChemActiva Logo';
        this.logoImageElement.style.position = 'absolute';
        this.logoImageElement.style.top = '50%';
        this.logoImageElement.style.left = '50%';
        this.logoImageElement.style.transform = 'translate(-50%, -50%) scale(0.7)'; // Initial smaller scale
        this.logoImageElement.style.opacity = '0'; // Start hidden
        this.logoImageElement.style.maxWidth = IS_MOBILE ? '100px' : '150px'; // Adjust size as needed
        this.logoImageElement.style.maxHeight = IS_MOBILE ? '100px' : '150px';
        this.logoImageElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'; // For GSAP control mostly
        this.logoImageElement.style.pointerEvents = 'none'; 
        
        this.contentElement.appendChild(this.logoImageElement); // Add logo on top of canvas container

        this.camera.position.set(0, 0, IS_MOBILE ? 9 : 12); // Start camera further back
        const targetCenterZ = 0; // Particles converge towards this Z plane

        const particleCount = IS_MOBILE ? 1800 : 3000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const opacities = new Float32Array(particleCount);
        const randomFactors = new Float32Array(particleCount); // For varied animation

        const bodyIsDark = document.body.classList.contains('dark-mode');
        const colorPalette = bodyIsDark 
            ? [new THREE.Color(0x328E6E), new THREE.Color(0x90C67C), new THREE.Color(0x255F38), new THREE.Color(0xE1EEBC)] 
            : [new THREE.Color(0x328E6E), new THREE.Color(0x67AE6E), new THREE.Color(0xA8D5BA), new THREE.Color(0xf4f8ed)];

        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const spawnDistance = Math.abs(this.camera.position.z - targetCenterZ) + (IS_MOBILE ? 3 : 5); 
        const frustumHeight = 2 * Math.tan(vFOV / 2) * spawnDistance;
        const frustumWidth = frustumHeight * this.camera.aspect;
        const initialZSpread = IS_MOBILE ? 4 : 6;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            const randomEdge = Math.random();
            if (randomEdge < 0.25) { // Top / Bottom
                positions[i3]     = (Math.random() - 0.5) * frustumWidth * 1.5; // Wider spread
                positions[i3 + 1] = (Math.random() > 0.5 ? 1 : -1) * frustumHeight * 0.75; // From top/bottom edges
            } else { // Left / Right
                positions[i3]     = (Math.random() > 0.5 ? 1 : -1) * frustumWidth * 0.75; // From left/right edges
                positions[i3 + 1] = (Math.random() - 0.5) * frustumHeight * 1.5;
            }
            positions[i3 + 2] = targetCenterZ + (Math.random() - 0.5) * initialZSpread + (Math.random() > 0.5 ? 1 : -1) * initialZSpread * 0.5;

            const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3]     = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;
            
            opacities[i] = 0;
            randomFactors[i] = Math.random();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('randomFactor', new THREE.BufferAttribute(randomFactors, 1));

        this.particleMaterial = new THREE.PointsMaterial({
            size: IS_MOBILE ? 0.05 : 0.07, 
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1 
        });

        this.particles = new THREE.Points(geometry, this.particleMaterial);
        this.scene.add(this.particles);
        // console.log('[HeroLoader] Particles created and added to scene.');
        return true; // Indicate success
    }

    hideLoaderUI() {
        // console.log('[HeroLoader] Hiding loader UI.');
        // Stop GSAP animations targeting these elements to prevent conflicts if start() is called again
        gsap.killTweensOf([this.backgroundElement, this.contentElement, this.logoImageElement, this.particles?.material, this.particles?.scale]);


        if (this.backgroundElement) gsap.to(this.backgroundElement, { opacity: 0, duration: 0.4, overwrite: 'auto' });
        if (this.contentElement) gsap.to(this.contentElement, { opacity: 0, duration: 0.3, overwrite: 'auto' });
        
        // Hide parent loader element after a delay to allow fades to complete
        gsap.delayedCall(0.5, () => { 
            if (this.loaderElement) this.loaderElement.style.display = 'none';
        });
    }

    async start() { 
        // console.log('[HeroLoader] Start called for converging particles & logo reveal.');
        this.isAnimatingParticles = true; 

        return new Promise(async (resolve, reject) => { 
            try {
                // Ensure content is visible before appending things to it
                gsap.set(this.contentElement, { opacity: 1, overwrite: 'auto' }); 
                
                const initSuccess = this.initThreeSceneAndLogoElement(); 
                
                if (!initSuccess || !this.particles || !this.logoImageElement) { 
                    console.error("[HeroLoader] Scene/Logo init failed or critical elements missing in start().");
                    this.hideLoaderUI(); 
                    this.stopAnimation(); // Stop rAF if it somehow started
                    reject("Scene/Logo init failed or critical elements missing");
                    return;
                }
                
                this.animate(); // Start render loop

                const particlePositions = this.particles.geometry.attributes.position.array;
                const particleAlphas = this.particles.geometry.attributes.alpha.array;
                const particleRandoms = this.particles.geometry.attributes.randomFactor.array;
                const centralPatchRadius = IS_MOBILE ? 0.2 : 0.3; // How tightly particles converge

                const mainTl = gsap.timeline({
                    onUpdate: () => {
                        if (this.particles) {
                            this.particles.geometry.attributes.position.needsUpdate = true;
                            this.particles.geometry.attributes.alpha.needsUpdate = true;
                        }
                    },
                    onComplete: () => { // This onComplete is for the entire mainTl
                        // console.log("[HeroLoader] All animations complete, resolving promise.");
                        this.hideLoaderUI();
                        this.stopAnimation();
                        resolve();
                    }
                });

                // 1. Particles Converge
                const convergenceDuration = 1.6;
                for (let i = 0; i < particlePositions.length / 3; i++) {
                    const i3 = i * 3;
                    mainTl.to(particlePositions, {
                        [i3]: (Math.random() - 0.5) * centralPatchRadius, 
                        [i3 + 1]: (Math.random() - 0.5) * centralPatchRadius, 
                        [i3 + 2]: (Math.random() - 0.5) * centralPatchRadius * 0.3, 
                        duration: convergenceDuration * (0.7 + particleRandoms[i] * 0.6), 
                        ease: "power2.inOut",
                    }, particleRandoms[i] * 0.5); // Staggered start based on randomFactor

                    mainTl.to(particleAlphas, {
                        [i]: 0.9,
                        duration: convergenceDuration * 0.4,
                        ease: "circ.out"
                    }, "<0.2"); 
                }

                // Camera zoom during convergence
                const cameraStartPosZ = this.camera.position.z;
                mainTl.to(this.camera.position, {
                    z: cameraStartPosZ / 2.5, // Zoom in significantly
                    duration: convergenceDuration * 1.1,
                    ease: "sine.inOut"
                }, 0);
                mainTl.to(this.particles.rotation, { 
                    y: Math.PI * 0.15,
                    duration: convergenceDuration * 1.2,
                    ease: "sine.inOut"
                }, 0);

                // 2. Transition from Particle Patch to Logo Image
                // This part of the sequence starts *after* particles have mostly converged.
                // The label "particleConvergeEnd" marks this point.
                mainTl.addLabel("particleConvergeEnd", `+=${convergenceDuration * 0.8}`);

                mainTl.to(this.particles.scale, { // Shrink particles
                    x: 0.01, y: 0.01, z: 0.01,
                    duration: 0.5,
                    ease: "power3.in"
                }, "particleConvergeEnd");
                mainTl.to(this.particleMaterial, { // Fade out particles
                    opacity: 0,
                    duration: 0.5,
                    ease: "power3.in",
                    onComplete: () => {
                        if(this.particles) this.particles.visible = false;
                    }
                }, "particleConvergeEnd");

                // Ensure logo starts correctly for its reveal animation
                gsap.set(this.logoImageElement, { opacity: 0, scale: 0.7, transformOrigin: "center center"});
                mainTl.to(this.logoImageElement, { // Fade in and scale up logo
                    opacity: 1,
                    scale: 1,
                    duration: 0.7,
                    ease: "back.out(1.7)",
                }, "particleConvergeEnd+=0.2"); // Start slightly after particles begin to fade/shrink

                // 3. Hold logo and then fade out everything (including logo and background)
                mainTl.addLabel("holdLogoEnd", "+=1.0"); // Hold logo for 1.0 seconds

                mainTl.to([this.logoImageElement, this.particles?.material], { // Fade out logo and any residual particle material
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.in",
                    // scale for logoImageElement to shrink it out, if desired
                    // onComplete for logoImageElement if it needs to be removed from DOM after this
                }, "holdLogoEnd");
                
                // The mainTl's onComplete will handle hiding the loader background and element.

            } catch (error) {
                console.error("[HeroLoader] Error within converging particles loader start() promise:", error);
                this.stopAnimation();
                this.hideLoaderUI(); // Use generalized hide
                reject(error);
            }
        });
    }

    animate() {
        if (!this.isAnimatingParticles) return; 
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        if (this.renderer && this.scene && this.camera && this.particles && this.particles.visible) {
             this.renderer.render(this.scene, this.camera);
        }
    }

    stopAnimation() {
        this.isAnimatingParticles = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // console.log('[HeroLoader] Animation stopped.');
        // Basic cleanup of particles if they exist
        if (this.particles) {
            if (this.particles.geometry) this.particles.geometry.dispose();
            // Material might be reused if you had other particle systems, but for loader it's usually safe
            if (this.particleMaterial) this.particleMaterial.dispose();
            this.particleMaterial = null; // Allow re-creation if start is called again
            if (this.scene && this.particles.parent === this.scene) this.scene.remove(this.particles);
            this.particles = null; // Allow re-creation
        }
         // Remove logo image if it exists and is parented
        if (this.logoImageElement && this.logoImageElement.parentElement) {
            this.logoImageElement.parentElement.removeChild(this.logoImageElement);
            this.logoImageElement = null;
        }
    }
}