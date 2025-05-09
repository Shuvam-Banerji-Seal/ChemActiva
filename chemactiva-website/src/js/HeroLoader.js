// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';

export default class HeroLoader {
    constructor(loaderSelector) {
        console.log('[HeroLoader] Constructor called.'); // << NEW
        this.loaderElement = document.querySelector(loaderSelector);
        if (!this.loaderElement) {
            console.error('[HeroLoader] Loader element NOT FOUND:', loaderSelector); // << NEW
            return;
        }
        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        if (!this.backgroundElement) console.error('[HeroLoader] Loader background element NOT FOUND'); // << NEW
        
        this.contentElement = this.loaderElement.querySelector('#loader-content');
        if (!this.contentElement) console.error('[HeroLoader] Loader content element NOT FOUND'); // << NEW
        else console.log('[HeroLoader] Loader content element found:', this.contentElement); // << NEW

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Temp aspect ratio
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.monomers = [];
        console.log('[HeroLoader] Constructor finished.'); // << NEW
    }

    // initThreeScene() {
    //     console.log('[HeroLoader] initThreeScene called.'); // << NEW
    //     if (!this.contentElement || this.contentElement.clientWidth === 0) {
    //         console.warn('[HeroLoader] contentElement has no width. Renderer size might be 0x0.'); // << NEW
    //         // Fallback size if clientWidth/Height is 0, or ensure CSS gives #loader-content dimensions
    //         this.renderer.setSize(300, 300); // Example fallback
    //     } else {
    //         this.camera.aspect = this.contentElement.clientWidth / this.contentElement.clientHeight; // << SET ASPECT RATIO HERE
    //         this.camera.updateProjectionMatrix(); // << UPDATE CAMERA
    //         this.renderer.setSize(this.contentElement.clientWidth, this.contentElement.clientHeight);
    //     }
        
    //     this.renderer.setPixelRatio(window.devicePixelRatio);
    //     this.contentElement.appendChild(this.renderer.domElement);
    //     console.log('[HeroLoader] Renderer appended to contentElement.'); // << NEW

    //     this.camera.position.z = 5;

    //     const monomerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    //     const monomerMaterial = new THREE.MeshStandardMaterial({ 
    //         color: 0xA8D5BA,
    //         emissive: 0x007F5F,
    //         roughness: 0.5,
    //         metalness: 0.1
    //     });

    //     const numMonomers = 7;
    //     const spacing = 0.5;
    //     for (let i = 0; i < numMonomers; i++) {
    //         const monomer = new THREE.Mesh(monomerGeometry, monomerMaterial.clone());
    //         monomer.position.x = (i - (numMonomers - 1) / 2) * spacing;
    //         this.scene.add(monomer);
    //         this.monomers.push(monomer);
    //     }
    //     console.log(`[HeroLoader] ${this.monomers.length} monomers created.`); // << NEW

    //     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    //     this.scene.add(ambientLight);
    //     const pointLight = new THREE.PointLight(0xffffff, 1);
    //     pointLight.position.set(2, 3, 4);
    //     this.scene.add(pointLight);
    //     console.log('[HeroLoader] Lights added to scene.'); // << NEW
    // }

    // animate() {
    //     // console.log('[HeroLoader] animate frame'); // This will be too noisy, use if needed
    //     requestAnimationFrame(this.animate.bind(this));
    //     this.monomers.forEach(monomer => {
    //          monomer.rotation.y += 0.005;
    //     });
    //     this.renderer.render(this.scene, this.camera);
    // }
    
    // start() {
    //     console.log('[HeroLoader] start() called.'); // << NEW
    //     return new Promise((resolve, reject) => { // << ADD REJECT
    //         try { // << ADD TRY-CATCH
    //             console.log('[HeroLoader] Promise created in start().'); // << NEW
                
    //             gsap.to(this.contentElement, { 
    //                 opacity: 1, 
    //                 duration: 1,
    //                 onStart: () => console.log('[HeroLoader] GSAP fade-in contentElement started.') // << NEW
    //             });
                
    //             this.initThreeScene();
    //             console.log('[HeroLoader] initThreeScene completed within start().'); // << NEW
    //             this.animate();
    //             console.log('[HeroLoader] this.animate() called, render loop should be running.'); // << NEW

    //             const shimmerTl = gsap.timeline({ 
    //                 repeat: 2, 
    //                 yoyo: true,
    //                 onStart: () => console.log('[HeroLoader] Shimmer timeline started.'), // << NEW
    //                 onComplete: () => console.log('[HeroLoader] Shimmer timeline COMPLETED.') // << NEW
    //             });
    //             this.monomers.forEach(monomer => {
    //                 shimmerTl.to(monomer.material.emissive, {
    //                     r: monomer.material.emissive.r * 2,
    //                     g: monomer.material.emissive.g * 2,
    //                     b: monomer.material.emissive.b * 2,
    //                     duration: 0.3,
    //                     stagger: 0.05
    //                 }, 0);
    //             });

    //             const explosionTl = gsap.timeline({
    //                 delay: 1, 
    //                 onStart: () => console.log('[HeroLoader] Explosion timeline started (after delay).'), // << NEW
    //                 onComplete: () => {
    //                     console.log("[HeroLoader] Explosion timeline COMPLETE. Fading out loader background."); // << NEW
    //                     gsap.to(this.backgroundElement, { 
    //                         opacity: 0, 
    //                         duration: 1.5, 
    //                         ease: 'power2.inOut',
    //                         onComplete: () => {
    //                             console.log("[HeroLoader] Loader background faded out. Hiding loaderElement & Resolving promise."); // << NEW
    //                             if (this.loaderElement) this.loaderElement.style.display = 'none';
    //                             resolve(); // This is what shows the main content
    //                         }
    //                     });
    //                     gsap.to(this.contentElement, { 
    //                         opacity: 0, 
    //                         duration: 1, 
    //                         delay: 0.5,
    //                         onComplete: () => console.log('[HeroLoader] contentElement faded out.') // << NEW
    //                     });
    //                 }
    //             });

    //             this.monomers.forEach((monomer, i) => {
    //                 explosionTl.to(monomer.position, { /* ... */ }, 0);
    //                 explosionTl.to(monomer.rotation, { /* ... */ }, 0);
    //                 explosionTl.to(monomer.scale, { /* ... */ }, 0.2);
    //             });
    //             console.log('[HeroLoader] Explosion timeline configured.'); // << NEW
                
    //             const masterTl = gsap.timeline({
    //                 onComplete: () => console.log('[HeroLoader] Master timeline COMPLETED.'), // << NEW
    //                 onStart: () => console.log('[HeroLoader] Master timeline STARTED.') // << NEW
    //             });
    //             masterTl.add(shimmerTl).add(explosionTl);
    //             console.log('[HeroLoader] Master timeline created, playing now.'); // << NEW
    //             masterTl.play();

    //         } catch (error) { // << CATCH ERRORS
    //             console.error("[HeroLoader] Error within start() promise:", error);
    //             reject(error); // Reject the promise if something goes wrong here
    //         }
    //     });
    // }


    // src/js/HeroLoader.js (Major rewrite of initThreeScene and animation logic)

initThreeScene() {
    console.log('[HeroLoader] initThreeScene for particles.');
    // ... (renderer setup, camera setup as before, ensure contentElement has size) ...

    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3); // For cyclohexane
    const colors = new Float32Array(particleCount * 3); // Optional: for varied particle colors
    const opacities = new Float32Array(particleCount); // For GSAP animation

    // Cyclohexane chair form - VERY simplified target (just 6 points for carbons)
    // You'd need to define actual 3D coordinates for a proper chair form
    const chairTargets = [
        new THREE.Vector3(1, 0.5, 0), new THREE.Vector3(0.5, -0.5, 0.866),
        new THREE.Vector3(-0.5, -0.5, 0.866), new THREE.Vector3(-1, 0.5, 0),
        new THREE.Vector3(-0.5, 1.5, -0.866), new THREE.Vector3(0.5, 1.5, -0.866)
    ].map(v => v.multiplyScalar(1.5)); // Scale it up

    const particleColor = new THREE.Color(document.body.classList.contains('dark-mode') ? 0x20C997 : 0xA8D5BA);

    for (let i = 0; i < particleCount; i++) {
        // Initial positions (from screen edges)
        const i3 = i * 3;
        const edge = Math.random();
        const randomDepth = (Math.random() - 0.5) * 5; // Depth variation
        if (edge < 0.25) { // Top
            positions[i3] = (Math.random() - 0.5) * 10; positions[i3+1] = 5; positions[i3+2] = randomDepth;
        } else if (edge < 0.5) { // Bottom
            positions[i3] = (Math.random() - 0.5) * 10; positions[i3+1] = -5; positions[i3+2] = randomDepth;
        } else if (edge < 0.75) { // Left
            positions[i3] = -7; positions[i3+1] = (Math.random() - 0.5) * 8; positions[i3+2] = randomDepth;
        } else { // Right
            positions[i3] = 7; positions[i3+1] = (Math.random() - 0.5) * 8; positions[i3+2] = randomDepth;
        }

        // Assign target position (cyclically to chairTargets)
        const target = chairTargets[i % chairTargets.length];
        targetPositions[i3] = target.x + (Math.random() - 0.5) * 0.2; // Add jitter
        targetPositions[i3+1] = target.y + (Math.random() - 0.5) * 0.2;
        targetPositions[i3+2] = target.z + (Math.random() - 0.5) * 0.2;

        colors[i3] = particleColor.r;
        colors[i3+1] = particleColor.g;
        colors[i3+2] = particleColor.b;
        opacities[i] = 0; // Start invisible
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('targetPosition', new THREE.Float32BufferAttribute(targetPositions, 3)); // Store for GSAP
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(opacities, 1));


    this.particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        // map: particleTexture, // Optional: a small dot texture
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1 // Will be controlled by attribute, but set base here
    });

    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.scene.add(this.particles);
    console.log('[HeroLoader] Particles created.');
}

// Animate method needs to update shader attributes if opacity is per-particle in shader
// Or GSAP directly animates the 'alpha' buffer attribute and calls geometry.attributes.alpha.needsUpdate = true;

start() {
    console.log('[HeroLoader] Particle start() called.');
    return new Promise((resolve, reject) => {
        try {
            gsap.to(this.contentElement, { opacity: 1, duration: 0.5 });
            this.initThreeScene();
            this.animate(); // Start render loop

            const particlePositions = this.particles.geometry.attributes.position.array;
            const targetPositions = this.particles.geometry.attributes.targetPosition.array;
            const particleAlphas = this.particles.geometry.attributes.alpha.array;

            const tl = gsap.timeline({
                onStart: () => console.log('[HeroLoader] Particle animation timeline started.'),
                onUpdate: () => {
                    this.particles.geometry.attributes.position.needsUpdate = true;
                    this.particles.geometry.attributes.alpha.needsUpdate = true;
                },
                onComplete: () => {
                    console.log("[HeroLoader] Particle animation COMPLETE. Fading out loader.");
                    // Add a brief "shimmer" or "hold" of the cyclohexane form
                    gsap.to(this.particles.material, {
                        opacity: 0, // Fade out the whole system
                        duration: 1,
                        delay: 0.5, // Hold for a bit
                        onComplete: () => {
                            gsap.to(this.backgroundElement, { 
                                opacity: 0, duration: 1,
                                onComplete: () => {
                                    if (this.loaderElement) this.loaderElement.style.display = 'none';
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });

            // Animate each particle
            for (let i = 0; i < particlePositions.length / 3; i++) {
                const i3 = i * 3;
                tl.to(particlePositions, {
                    [i3]: targetPositions[i3],
                    [i3+1]: targetPositions[i3+1],
                    [i3+2]: targetPositions[i3+2],
                    duration: 1.5 + Math.random() * 1, // Varied duration
                    ease: "power2.inOut"
                }, Math.random() * 0.5); // Staggered start times

                tl.to(particleAlphas, {
                    [i]: 1.0, // Fade in
                    duration: 1,
                    ease: "power1.inOut"
                }, "<0.5"); // Start fading in shortly after movement starts
            }

            // Optional: Animate camera slightly to give depth
            tl.to(this.camera.position, { z: 3, duration: 2.5, ease: "sine.inOut" }, 0);


        } catch (error) {
            console.error("[HeroLoader] Error within particle start() promise:", error);
            reject(error);
        }
    });
}

animate() { // Render loop for particles
    if (!this.isAnimatingParticles) { // Add a new flag
        this.isAnimatingParticles = true;
    }
    requestAnimationFrame(this.animate.bind(this));
    // Optional: Add subtle independent motion to particles
    // this.particles.rotation.y += 0.001; 
    this.renderer.render(this.scene, this.camera);
}
}