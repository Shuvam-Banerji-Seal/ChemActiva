// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';

export default class HeroLoader {
    constructor(loaderSelector) {
        this.loaderElement = document.querySelector(loaderSelector);
        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        this.contentElement = this.loaderElement.querySelector('#loader-content'); // Could hold a Three.js canvas

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); // Alpha for transparent bg over #loader-background
        
        this.monomers = [];
    }

    initThreeScene() {
        this.renderer.setSize(this.contentElement.clientWidth, this.contentElement.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.contentElement.appendChild(this.renderer.domElement); // Add canvas to pre-defined div

        this.camera.position.z = 5;

        // Create a simplified "cellulose chain" (e.g., 5 spheres)
        const monomerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const monomerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA8D5BA, // Light green
            emissive: 0x007F5F, // Green glow
            roughness: 0.5,
            metalness: 0.1
        });

        const numMonomers = 7;
        const spacing = 0.5;
        for (let i = 0; i < numMonomers; i++) {
            const monomer = new THREE.Mesh(monomerGeometry, monomerMaterial.clone()); // Clone material for individual shimmer
            monomer.position.x = (i - (numMonomers - 1) / 2) * spacing;
            this.scene.add(monomer);
            this.monomers.push(monomer);
        }

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        // Optional: Add subtle idle animation to monomers before explosion
        this.monomers.forEach(monomer => {
             monomer.rotation.y += 0.005;
        });
        this.renderer.render(this.scene, this.camera);
    }
    
    start() {
        return new Promise((resolve) => {
            // 1. Black screen fades into view (already black by CSS)
            //    Content (Three.js scene) fades in
            gsap.to(this.contentElement, { opacity: 1, duration: 1 });
            
            this.initThreeScene();
            this.animate();

            // 2. Shimmer with energy (animate emissive intensity)
            const shimmerTl = gsap.timeline({ repeat: 2, yoyo: true });
            this.monomers.forEach(monomer => {
                shimmerTl.to(monomer.material.emissive, {
                    r: monomer.material.emissive.r * 2, // Brighter
                    g: monomer.material.emissive.g * 2,
                    b: monomer.material.emissive.b * 2,
                    duration: 0.3,
                    stagger: 0.05
                }, 0); // Add all to start of shimmerTl
            });

            // 3. Chain breaks into subunits, fragments flying outward
            const explosionTl = gsap.timeline({
                delay: 1, // Start after shimmer animation roughly finishes
                onComplete: () => {
                    // 4. Fade screen (loader background) to reveal main homepage
                    gsap.to(this.backgroundElement, { 
                        opacity: 0, 
                        duration: 1.5, 
                        ease: 'power2.inOut',
                        onComplete: () => {
                            this.loaderElement.style.display = 'none';
                            resolve();
                        }
                    });
                    // Also fade out the 3D content itself
                    gsap.to(this.contentElement, { opacity: 0, duration: 1, delay: 0.5 });
                }
            });

            this.monomers.forEach((monomer, i) => {
                explosionTl.to(monomer.position, {
                    x: (Math.random() - 0.5) * 20, // Fly outwards randomly
                    y: (Math.random() - 0.5) * 20,
                    z: (Math.random() - 0.5) * 10 + 5, // Mostly towards camera
                    duration: 1.5,
                    ease: 'power2.out'
                }, 0); // All fly out at the same time

                explosionTl.to(monomer.rotation, {
                    x: Math.random() * Math.PI * 4,
                    y: Math.random() * Math.PI * 4,
                    duration: 1.5,
                    ease: 'power2.out'
                }, 0);

                explosionTl.to(monomer.scale, {
                    x: 0.1, y: 0.1, z: 0.1,
                    duration: 1.5,
                    ease: 'power2.in'
                }, 0.2); // Start shrinking slightly after movement starts
            });
            
            // Chain shimmer and explosion together
            const masterTl = gsap.timeline();
            masterTl.add(shimmerTl).add(explosionTl);
            masterTl.play();
        });
    }
}