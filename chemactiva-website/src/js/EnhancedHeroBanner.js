/**
 * EnhancedHeroBanner - Professional slideshow with integrated 3D cellulose molecule
 * Combines dynamic slideshow with interactive 3D molecular visualization
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class EnhancedHeroBanner {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('Hero banner container not found:', containerSelector);
            return;
        }

        // Slideshow properties
        this.slides = [];
        this.currentSlideIndex = 0;
        this.slideInterval = null;
        this.slideDuration = 6000; // 6 seconds per slide
        this.isTransitioning = false;

        // 3D Scene properties
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.gltfLoader = new GLTFLoader();
        this.celluloseMolecule = null;
        this.clock = new THREE.Clock();
        this.controls = null;
        this.animationFrameId = null;

        // Interactive properties
        this.isUserInteracting = false;
        this.mousePosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };

        // Performance properties
        this.isVisible = true;
        this.intersectionObserver = null;
        this.isMobile = window.innerWidth <= 768;

        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.animate = this.animate.bind(this);

        this.init();
    }

    async init() {
        try {
            console.log('[EnhancedHeroBanner] Initializing professional hero banner');
            
            this.setupSlideData();
            this.setupHTML();
            this.setup3DScene();
            await this.load3DMolecule();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.startSlideshow();
            this.startAnimation();

            console.log('[EnhancedHeroBanner] Initialization complete');
        } catch (error) {
            console.error('[EnhancedHeroBanner] Initialization failed:', error);
            this.showFallback();
        }
    }

    setupSlideData() {
        this.slides = [
            {
                id: 'innovation',
                title: 'Pioneering Sustainable Innovation',
                subtitle: 'Advanced Nanocellulose Technology',
                description: 'Leading breakthrough research in biodegradable cellulose nanocrystals for environmental solutions',
                background: 'linear-gradient(135deg, rgba(50, 142, 110, 0.9) 0%, rgba(103, 174, 110, 0.8) 100%)',
                image: '/assets/images/hero/innovation-lab.jpg',
                moleculeColor: '#328E6E',
                particles: true
            },
            {
                id: 'research',
                title: 'World-Class Scientific Research',
                subtitle: 'Cellu® - High-Performance Materials',
                description: 'Developing next-generation biodegradable materials from renewable plant sources',
                background: 'linear-gradient(135deg, rgba(37, 143, 56, 0.9) 0%, rgba(50, 223, 110, 0.8) 100%)',
                image: '/assets/images/hero/research-facility.jpg',
                moleculeColor: '#32df6e',
                particles: true
            },
            {
                id: 'products',
                title: 'Sustainable Product Solutions',
                subtitle: 'Oil Spill Management Systems',
                description: 'Revolutionary biodegradable solutions for domestic and marine oil spill cleanup',
                background: 'linear-gradient(135deg, rgba(103, 174, 110, 0.9) 0%, rgba(50, 142, 110, 0.8) 100%)',
                image: '/assets/images/hero/products-showcase.jpg',
                moleculeColor: '#67AE6E',
                particles: false
            },
            {
                id: 'future',
                title: 'Shaping a Sustainable Future',
                subtitle: 'Environmental Stewardship',
                description: 'Committed to creating a cleaner planet through innovative green technologies',
                background: 'linear-gradient(135deg, rgba(50, 223, 110, 0.9) 0%, rgba(79, 255, 122, 0.8) 100%)',
                image: '/assets/images/hero/sustainable-future.jpg',
                moleculeColor: '#4eff7a',
                particles: true
            }
        ];
    }

    setupHTML() {
        this.container.innerHTML = `
            <div class="hero-slideshow-container">
                <div class="hero-slides">
                    ${this.slides.map((slide, index) => `
                        <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide="${slide.id}">
                            <div class="slide-background" style="background: ${slide.background};">
                                <div class="slide-image" style="background-image: url('${slide.image}');"></div>
                                <div class="slide-overlay"></div>
                            </div>
                            <div class="slide-content">
                                <div class="slide-text">
                                    <h1 class="slide-title">${slide.title}</h1>
                                    <h2 class="slide-subtitle">${slide.subtitle}</h2>
                                    <p class="slide-description">${slide.description}</p>
                                    <div class="slide-actions">
                                        <button class="cta-primary" data-action="learn-more">Learn More</button>
                                        <button class="cta-secondary" data-action="explore">Explore Products</button>
                                    </div>
                                </div>
                            </div>
                            ${slide.particles ? '<div class="slide-particles"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="hero-3d-overlay">
                    <div class="molecule-container" id="molecule-3d-container">
                        <div class="molecule-info">
                            <div class="molecule-label">Interactive Cellulose Molecule</div>
                            <div class="molecule-controls">
                                <button class="molecule-btn" data-action="rotate">🔄</button>
                                <button class="molecule-btn" data-action="info">ℹ️</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="hero-navigation">
                    <div class="slide-indicators">
                        ${this.slides.map((_, index) => `
                            <button class="slide-indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>
                        `).join('')}
                    </div>
                    <div class="slide-controls">
                        <button class="slide-control prev" data-direction="prev">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="slide-control next" data-direction="next">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="hero-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                
                <!-- Light theme floating elements -->
                <div class="floating-element"></div>
                <div class="floating-element"></div>
                <div class="floating-element"></div>
            </div>
        `;

        // Get references to created elements
        this.slidesContainer = this.container.querySelector('.hero-slides');
        this.slideElements = this.container.querySelectorAll('.hero-slide');
        this.indicatorElements = this.container.querySelectorAll('.slide-indicator');
        this.moleculeContainer = this.container.querySelector('#molecule-3d-container');
        this.progressFill = this.container.querySelector('.progress-fill');
    }

    setup3DScene() {
        if (!this.moleculeContainer) return;

        // Setup renderer with proper settings
        const containerRect = this.moleculeContainer.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height, 400);
        
        this.renderer.setSize(size, size);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = !this.isMobile;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear container and add renderer
        while (this.moleculeContainer.firstChild) {
            this.moleculeContainer.removeChild(this.moleculeContainer.firstChild);
        }
        this.moleculeContainer.appendChild(this.renderer.domElement);

        // Setup camera with proper positioning
        this.camera.aspect = 1;
        this.camera.position.set(0, 1.8, 7);
        this.camera.lookAt(0, 0.8, 0);
        this.camera.updateProjectionMatrix();

        // Setup controls with proper settings
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0.8, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.3;
        this.controls.enablePan = false;

        // Setup lighting
        this.setupLighting();

        console.log('[EnhancedHeroBanner] 3D scene setup complete');
    }

    setupLighting() {
        // Use the same lighting setup as the working SceneManager
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // Main directional light with proper shadow settings
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(4, 8, 6);
        directionalLight.castShadow = !this.isMobile;
        directionalLight.shadow.mapSize.width = this.isMobile ? 512 : 1024;
        directionalLight.shadow.mapSize.height = this.isMobile ? 512 : 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 20;
        directionalLight.shadow.camera.left = -5;
        directionalLight.shadow.camera.right = 5;
        directionalLight.shadow.camera.top = 5;
        directionalLight.shadow.camera.bottom = -5;
        this.scene.add(directionalLight);

        // Hemisphere light for better overall illumination
        const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
        this.scene.add(hemisphereLight);

        // Add ground plane for shadows (if not mobile)
        if (!this.isMobile) {
            const groundGeometry = new THREE.PlaneGeometry(20, 20);
            const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
            const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
            groundPlane.rotation.x = -Math.PI / 2;
            groundPlane.position.y = -0.05;
            groundPlane.receiveShadow = true;
            this.scene.add(groundPlane);
        }
    }

    async load3DMolecule() {
        try {
            console.log('[EnhancedHeroBanner] Loading 3D cellulose molecule');
            
            // Try to load GLTF model first (same path as working SceneManager)
            this.gltfLoader.load('/assets/models/cellulose.glb', (gltf) => {
                this.celluloseMolecule = gltf.scene;
                this.celluloseMolecule.scale.set(0.4, 0.4, 0.4);
                this.celluloseMolecule.position.y = 0.7;
                this.celluloseMolecule.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = !this.isMobile;
                        child.receiveShadow = !this.isMobile;
                        child.material.metalness = 0.2;
                        child.material.roughness = 0.7;
                    }
                });
                this.scene.add(this.celluloseMolecule);
                console.log('[EnhancedHeroBanner] GLTF cellulose molecule loaded successfully');
            }, undefined, (error) => {
                console.error('Error loading cellulose molecule:', error);
                // Fallback to simple sphere like the original SceneManager
                const fallbackGeo = new THREE.SphereGeometry(0.6, 32, 16);
                const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x255F38 });
                this.celluloseMolecule = new THREE.Mesh(fallbackGeo, fallbackMat);
                this.celluloseMolecule.position.y = 0.7;
                this.celluloseMolecule.castShadow = !this.isMobile;
                this.scene.add(this.celluloseMolecule);
                console.log('[EnhancedHeroBanner] Using fallback sphere molecule');
            });

        } catch (error) {
            console.error('[EnhancedHeroBanner] Failed to load molecule:', error);
            this.createFallbackMolecule();
        }
    }

    loadGLTF(url) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => resolve(gltf),
                (progress) => console.log('Loading progress:', progress),
                (error) => reject(error)
            );
        });
    }

    createProceduralMolecule() {
        const moleculeGroup = new THREE.Group();

        // Create cellulose chain structure
        const chainLength = 8;
        const bondLength = 1.5;
        
        // Materials
        const carbonMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 30
        });
        const oxygenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4444,
            shininess: 30
        });
        const hydrogenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            shininess: 30
        });

        // Create glucose units
        for (let i = 0; i < chainLength; i++) {
            const glucoseUnit = this.createGlucoseUnit(carbonMaterial, oxygenMaterial, hydrogenMaterial);
            glucoseUnit.position.x = i * bondLength;
            glucoseUnit.position.y = Math.sin(i * 0.5) * 0.3;
            glucoseUnit.position.z = Math.cos(i * 0.3) * 0.2;
            glucoseUnit.rotation.y = i * 0.2;
            moleculeGroup.add(glucoseUnit);

            // Add bonds between units
            if (i > 0) {
                const bond = this.createBond();
                bond.position.x = i * bondLength - bondLength / 2;
                bond.position.y = Math.sin((i - 0.5) * 0.5) * 0.3;
                bond.position.z = Math.cos((i - 0.5) * 0.3) * 0.2;
                moleculeGroup.add(bond);
            }
        }

        // Scale and position the molecule
        moleculeGroup.scale.setScalar(0.3);
        moleculeGroup.position.set(0, 0, 0);

        this.celluloseMolecule = moleculeGroup;
        this.scene.add(this.celluloseMolecule);

        console.log('[EnhancedHeroBanner] Procedural cellulose molecule created');
    }

    createGlucoseUnit(carbonMaterial, oxygenMaterial, hydrogenMaterial) {
        const unit = new THREE.Group();

        // Carbon atoms (6-membered ring)
        const carbonPositions = [
            [0, 0, 0],
            [1, 0, 0],
            [1.5, 0.8, 0],
            [1, 1.6, 0],
            [0, 1.6, 0],
            [-0.5, 0.8, 0]
        ];

        carbonPositions.forEach((pos, index) => {
            const carbon = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 6),
                carbonMaterial
            );
            carbon.position.set(pos[0], pos[1], pos[2]);
            carbon.castShadow = true;
            carbon.receiveShadow = true;
            unit.add(carbon);

            // Add hydrogen atoms
            if (index % 2 === 0) {
                const hydrogen = new THREE.Mesh(
                    new THREE.SphereGeometry(0.08, 6, 4),
                    hydrogenMaterial
                );
                hydrogen.position.set(pos[0], pos[1] + 0.3, pos[2] + 0.3);
                hydrogen.castShadow = true;
                unit.add(hydrogen);
            }
        });

        // Oxygen atom
        const oxygen = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 6),
            oxygenMaterial
        );
        oxygen.position.set(0.5, -0.5, 0);
        oxygen.castShadow = true;
        oxygen.receiveShadow = true;
        unit.add(oxygen);

        return unit;
    }

    createBond() {
        const bondGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const bondMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 10
        });
        const bond = new THREE.Mesh(bondGeometry, bondMaterial);
        bond.rotation.z = Math.PI / 2;
        bond.castShadow = true;
        bond.receiveShadow = true;
        return bond;
    }

    createFallbackMolecule() {
        // Simple fallback molecule
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x32df6e,
            shininess: 30,
            transparent: true,
            opacity: 0.8
        });
        
        this.celluloseMolecule = new THREE.Mesh(geometry, material);
        this.celluloseMolecule.castShadow = true;
        this.celluloseMolecule.receiveShadow = true;
        this.scene.add(this.celluloseMolecule);

        console.log('[EnhancedHeroBanner] Fallback molecule created');
    }

    setupEventListeners() {
        // Slideshow controls
        const prevBtn = this.container.querySelector('.slide-control.prev');
        const nextBtn = this.container.querySelector('.slide-control.next');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousSlide());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

        // Slide indicators
        this.indicatorElements.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // CTA buttons
        const ctaButtons = this.container.querySelectorAll('.cta-primary, .cta-secondary');
        ctaButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCTAClick(e));
        });

        // Molecule controls
        const moleculeBtns = this.container.querySelectorAll('.molecule-btn');
        moleculeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMoleculeControl(e));
        });

        // Mouse interaction for molecule
        if (this.moleculeContainer) {
            this.moleculeContainer.addEventListener('mouseenter', this.handleMouseEnter);
            this.moleculeContainer.addEventListener('mouseleave', this.handleMouseLeave);
            this.moleculeContainer.addEventListener('mousemove', this.handleMouseMove);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleSlideshow();
            }
        });

        // Resize handler
        window.addEventListener('resize', this.handleResize);

        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.pauseSlideshow());
        this.container.addEventListener('mouseleave', () => this.resumeSlideshow());

        console.log('[EnhancedHeroBanner] Event listeners setup complete');
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.01, // Lower threshold for better detection
            rootMargin: '50px' // Add margin to trigger earlier
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                console.log('[EnhancedHeroBanner] Visibility changed:', this.isVisible);
                if (this.isVisible) {
                    this.resumeSlideshow();
                } else {
                    this.pauseSlideshow();
                }
            });
        }, options);

        this.intersectionObserver.observe(this.container);
    }

    startSlideshow() {
        // Clear any existing interval
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        
        this.slideInterval = setInterval(() => {
            // Remove the isVisible check for now to ensure slideshow works
            if (!this.isTransitioning) {
                this.nextSlide();
            }
        }, this.slideDuration);

        // Start progress animation
        this.animateProgress();
        
        console.log('[EnhancedHeroBanner] Slideshow started with interval:', this.slideDuration);
    }

    pauseSlideshow() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    resumeSlideshow() {
        if (!this.slideInterval && this.isVisible) {
            this.startSlideshow();
        }
    }

    toggleSlideshow() {
        if (this.slideInterval) {
            this.pauseSlideshow();
        } else {
            this.resumeSlideshow();
        }
    }

    nextSlide() {
        const nextIndex = (this.currentSlideIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlideIndex) return;

        this.isTransitioning = true;
        const previousIndex = this.currentSlideIndex;
        this.currentSlideIndex = index;

        // Update indicators
        this.indicatorElements[previousIndex]?.classList.remove('active');
        this.indicatorElements[index]?.classList.add('active');

        // Transition slides
        this.transitionSlides(previousIndex, index);

        // Update molecule color
        this.updateMoleculeForSlide(this.slides[index]);

        // Reset progress
        this.animateProgress();

        // Restart slideshow after manual interaction
        this.restartSlideshow();

        setTimeout(() => {
            this.isTransitioning = false;
        }, 1000);
    }

    restartSlideshow() {
        // Clear existing interval and restart to reset the timer
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
        }
        this.startSlideshow();
    }

    transitionSlides(fromIndex, toIndex) {
        const fromSlide = this.slideElements[fromIndex];
        const toSlide = this.slideElements[toIndex];

        if (!fromSlide || !toSlide) return;

        // Remove active class from previous slide
        fromSlide.classList.remove('active');
        
        // Add transitioning classes
        fromSlide.classList.add('slide-out');
        toSlide.classList.add('slide-in');

        // Activate new slide
        setTimeout(() => {
            toSlide.classList.add('active');
            toSlide.classList.remove('slide-in');
        }, 50);

        // Clean up previous slide
        setTimeout(() => {
            fromSlide.classList.remove('slide-out');
        }, 1000);

        // Create particle effect for transition
        this.createTransitionEffect(toSlide);
    }

    createTransitionEffect(slide) {
        const slideData = this.slides[this.currentSlideIndex];
        if (!slideData.particles) return;

        const particlesContainer = slide.querySelector('.slide-particles');
        if (!particlesContainer) return;

        // Clear existing particles
        particlesContainer.innerHTML = '';

        // Create new particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${slideData.moleculeColor};
                border-radius: 50%;
                opacity: 0;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleFloat 3s ease-out forwards;
                animation-delay: ${Math.random() * 2}s;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    updateMoleculeForSlide(slideData) {
        if (!this.celluloseMolecule) return;

        // Animate molecule color change
        const targetColor = new THREE.Color(slideData.moleculeColor);
        
        this.celluloseMolecule.traverse((child) => {
            if (child.isMesh && child.material) {
                // Animate color transition
                const startColor = child.material.color.clone();
                const duration = 1000;
                const startTime = Date.now();

                const animateColor = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    child.material.color.lerpColors(startColor, targetColor, progress);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateColor);
                    }
                };
                
                animateColor();
            }
        });

        // Add rotation animation
        if (this.celluloseMolecule) {
            this.celluloseMolecule.rotation.y += 0.2;
        }
    }

    animateProgress() {
        if (!this.progressFill) return;

        this.progressFill.style.transition = 'none';
        this.progressFill.style.width = '0%';

        requestAnimationFrame(() => {
            this.progressFill.style.transition = `width ${this.slideDuration}ms linear`;
            this.progressFill.style.width = '100%';
        });
    }

    handleMouseEnter() {
        this.isUserInteracting = true;
        if (this.moleculeContainer) {
            this.moleculeContainer.style.cursor = 'grab';
        }
    }

    handleMouseLeave() {
        this.isUserInteracting = false;
        if (this.moleculeContainer) {
            this.moleculeContainer.style.cursor = 'default';
        }
    }

    handleMouseMove(event) {
        if (!this.isUserInteracting) return;

        const rect = this.moleculeContainer.getBoundingClientRect();
        this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.targetRotation.x = this.mousePosition.y * 0.5;
        this.targetRotation.y = this.mousePosition.x * 0.5;
    }

    handleCTAClick(event) {
        const action = event.target.dataset.action;
        const slideData = this.slides[this.currentSlideIndex];
        
        console.log(`[EnhancedHeroBanner] CTA clicked: ${action} on slide: ${slideData.id}`);
        
        // Add click animation
        event.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            event.target.style.transform = 'scale(1)';
        }, 150);

        // Handle different actions
        switch (action) {
            case 'learn-more':
                this.scrollToSection('#about-us');
                break;
            case 'explore':
                window.location.href = '/products.html';
                break;
        }
    }

    handleMoleculeControl(event) {
        const action = event.target.dataset.action;
        
        switch (action) {
            case 'rotate':
                this.autoRotateMolecule();
                break;
            case 'info':
                this.showMoleculeInfo();
                break;
        }
    }

    autoRotateMolecule() {
        if (!this.celluloseMolecule) return;

        const duration = 2000;
        const startRotation = this.celluloseMolecule.rotation.y;
        const targetRotation = startRotation + Math.PI * 2;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            this.celluloseMolecule.rotation.y = startRotation + (targetRotation - startRotation) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    showMoleculeInfo() {
        // Create info modal or tooltip
        const info = document.createElement('div');
        info.className = 'molecule-info-modal';
        info.innerHTML = `
            <div class="info-content">
                <h3>Cellulose Molecule</h3>
                <p>Cellulose is a complex carbohydrate consisting of glucose units linked together. Our Cellu® nanocrystals are derived from this natural polymer, providing high-performance, biodegradable materials for sustainable applications.</p>
                <button class="close-info">Close</button>
            </div>
        `;

        document.body.appendChild(info);

        // Close handler
        info.querySelector('.close-info').addEventListener('click', () => {
            info.remove();
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (info.parentNode) {
                info.remove();
            }
        }, 5000);
    }

    scrollToSection(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    handleResize() {
        if (!this.renderer || !this.camera || !this.moleculeContainer) return;

        const containerRect = this.moleculeContainer.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height, 400);

        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(size, size);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    startAnimation() {
        this.animate();
    }

    animate() {
        if (!this.isVisible) {
            return;
        }

        this.animationFrameId = requestAnimationFrame(this.animate);

        // Update controls (this includes auto-rotation)
        if (this.controls) {
            this.controls.update();
        }

        // Apply the same rotation logic as the working SceneManager
        if (this.celluloseMolecule && this.celluloseMolecule.parent) {
            if (!this.isUserInteracting) {
                // Use the same rotation values as the working SceneManager
                this.celluloseMolecule.rotation.x += 0.001;
                this.celluloseMolecule.rotation.y -= 0.004;
            } else {
                // Smooth mouse interaction
                this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
                this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
                
                this.celluloseMolecule.rotation.x += this.currentRotation.x * 0.01;
                this.celluloseMolecule.rotation.y += this.currentRotation.y * 0.01;
            }
        }

        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    showFallback() {
        // Show a fallback version without 3D
        this.container.innerHTML = `
            <div class="hero-fallback">
                <div class="fallback-content">
                    <h1>Pioneering Sustainable Nano Cellulose</h1>
                    <p>Sustainable. Strong. Smart Materials.</p>
                    <div class="fallback-actions">
                        <button class="cta-primary" onclick="document.querySelector('#about-us').scrollIntoView({behavior: 'smooth'})">Learn More</button>
                        <button class="cta-secondary" onclick="window.location.href='/products.html'">View Products</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Public API methods
    destroy() {
        // Clean up slideshow
        this.pauseSlideshow();
        
        // Clean up 3D scene
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        console.log('[EnhancedHeroBanner] Destroyed');
    }

    // Utility methods
    getCurrentSlide() {
        return this.slides[this.currentSlideIndex];
    }

    getTotalSlides() {
        return this.slides.length;
    }

    setSlideInterval(duration) {
        this.slideDuration = duration;
        if (this.slideInterval) {
            this.pauseSlideshow();
            this.resumeSlideshow();
        }
    }
}

export default EnhancedHeroBanner;