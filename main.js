/* ======================================================
   GRB Global — Immersive Dark Theme Experience
   3D Mining Haul Truck + Per-Section Effects + GSAP + Lenis
====================================================== */

(function () {
    'use strict';

    // ─── Smooth Scrolling (Lenis) ──────────────────────────────
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
    });

    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // ─── Full-Page Background Particles (2D Canvas) ─────────────
    const bgCanvas = document.getElementById('bg-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    let bgWidth, bgHeight;
    let globalMouseX = 0, globalMouseY = 0;

    function resizeBgCanvas() {
        bgWidth = window.innerWidth;
        bgHeight = window.innerHeight;
        bgCanvas.width = bgWidth;
        bgCanvas.height = bgHeight;
    }
    resizeBgCanvas();
    window.addEventListener('resize', resizeBgCanvas);

    document.addEventListener('mousemove', (e) => {
        globalMouseX = e.clientX;
        globalMouseY = e.clientY;
    });

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * bgWidth;
            this.y = Math.random() * bgHeight;
            this.size = Math.random() * 2.5 + 0.5;
            this.baseSpeedX = (Math.random() - 0.5) * 0.4;
            this.baseSpeedY = (Math.random() - 0.5) * 0.4;
            this.speedX = this.baseSpeedX;
            this.speedY = this.baseSpeedY;
            this.opacity = Math.random() * 0.6 + 0.1;
            this.glowing = Math.random() > 0.75;
            this.pulseOffset = Math.random() * Math.PI * 2;
        }
        update(time) {
            // Mouse repulsion
            const dx = this.x - globalMouseX;
            const dy = this.y - globalMouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                this.speedX = this.baseSpeedX + (dx / dist) * force * 0.8;
                this.speedY = this.baseSpeedY + (dy / dist) * force * 0.8;
            } else {
                this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
                this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < -10) this.x = bgWidth + 10;
            if (this.x > bgWidth + 10) this.x = -10;
            if (this.y < -10) this.y = bgHeight + 10;
            if (this.y > bgHeight + 10) this.y = -10;

            // Pulsing opacity
            if (this.glowing) {
                this.currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(time * 2 + this.pulseOffset));
            } else {
                this.currentOpacity = this.opacity;
            }
        }
        draw() {
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            if (this.glowing) {
                bgCtx.fillStyle = `rgba(7, 176, 187, ${this.currentOpacity})`;
            } else {
                bgCtx.fillStyle = `rgba(200, 200, 220, ${this.currentOpacity * 0.4})`;
            }
            bgCtx.fill();
        }
    }

    const bgParticles = [];
    for (let i = 0; i < 70; i++) {
        bgParticles.push(new Particle());
    }

    // Geometric wireframe shapes
    class GeoShape {
        constructor() {
            this.x = Math.random() * bgWidth;
            this.y = Math.random() * bgHeight;
            this.size = Math.random() * 50 + 25;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.003;
            this.speedY = (Math.random() - 0.5) * 0.1;
            this.opacity = Math.random() * 0.06 + 0.02;
            this.sides = Math.floor(Math.random() * 4) + 3;
            this.pulseOffset = Math.random() * Math.PI * 2;
        }
        update(time) {
            this.rotation += this.rotSpeed;
            this.y += this.speedY;
            if (this.y < -this.size * 2) this.y = bgHeight + this.size * 2;
            if (this.y > bgHeight + this.size * 2) this.y = -this.size * 2;
            this.currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(time * 0.5 + this.pulseOffset));
        }
        draw() {
            bgCtx.save();
            bgCtx.translate(this.x, this.y);
            bgCtx.rotate(this.rotation);
            bgCtx.strokeStyle = `rgba(5, 139, 148, ${this.currentOpacity})`;
            bgCtx.lineWidth = 0.8;
            bgCtx.beginPath();
            for (let i = 0; i <= this.sides; i++) {
                const angle = (i / this.sides) * Math.PI * 2;
                const px = Math.cos(angle) * this.size;
                const py = Math.sin(angle) * this.size;
                if (i === 0) bgCtx.moveTo(px, py);
                else bgCtx.lineTo(px, py);
            }
            bgCtx.closePath();
            bgCtx.stroke();
            bgCtx.restore();
        }
    }

    const geoShapes = [];
    for (let i = 0; i < 8; i++) {
        geoShapes.push(new GeoShape());
    }

    // Connection lines (optimized — batched path, limited checks)
    function drawConnections() {
        const maxDist = 120;
        const maxDistSq = maxDist * maxDist;
        bgCtx.strokeStyle = 'rgba(5, 139, 148, 0.06)';
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        var drawn = 0;
        for (let i = 0; i < bgParticles.length && drawn < 60; i += 2) {
            for (let j = i + 1; j < bgParticles.length && drawn < 60; j += 2) {
                const dx = bgParticles[i].x - bgParticles[j].x;
                const dy = bgParticles[i].y - bgParticles[j].y;
                const distSq = dx * dx + dy * dy;
                if (distSq < maxDistSq) {
                    bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
                    bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
                    drawn++;
                }
            }
        }
        bgCtx.stroke();
    }

    let bgTime = 0;
    let bgFrameSkip = 0;
    function animateBg() {
        bgFrameSkip++;
        if (bgFrameSkip % 2 !== 0) { requestAnimationFrame(animateBg); return; }
        bgTime += 0.02;
        bgCtx.clearRect(0, 0, bgWidth, bgHeight);
        geoShapes.forEach(s => { s.update(bgTime); s.draw(); });
        bgParticles.forEach(p => { p.update(bgTime); p.draw(); });
        drawConnections();
        requestAnimationFrame(animateBg);
    }
    animateBg();

    // ─── Per-Section Particle Canvases (visibility-gated) ──────
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target._particlesVisible = entry.isIntersecting;
        });
    }, { rootMargin: '100px' });

    document.querySelectorAll('.section-particles').forEach(container => {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const density = Math.min(parseInt(container.getAttribute('data-density')) || 20, 25);
        let particles = [];
        let w, h;
        container._particlesVisible = false;
        sectionObserver.observe(container);

        function resize() {
            const rect = container.parentElement.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = w;
            canvas.height = h;
            particles = [];
            for (let i = 0; i < density; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: -Math.random() * 0.5 - 0.1,
                    opacity: Math.random() * 0.4 + 0.1,
                    glow: Math.random() > 0.6,
                });
            }
        }
        resize();
        window.addEventListener('resize', resize);

        function animate() {
            if (!container._particlesVisible) {
                requestAnimationFrame(animate);
                return;
            }
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
                if (p.x < -5) p.x = w + 5;
                if (p.x > w + 5) p.x = -5;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                if (p.glow) {
                    ctx.fillStyle = `rgba(7, 176, 187, ${p.opacity})`;
                } else {
                    ctx.fillStyle = `rgba(150, 150, 170, ${p.opacity * 0.5})`;
                }
                ctx.fill();
            });
            requestAnimationFrame(animate);
        }
        animate();
    });

    // ─── Custom Cursor ──────────────────────────────────────────
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    function animateCursor() {
        ringX += (mouseX - ringX) * 0.1;
        ringY += (mouseY - ringY) * 0.1;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interactiveElements = document.querySelectorAll('a, button, .magnetic-btn, .tilt-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hovering');
            cursorRing.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hovering');
            cursorRing.classList.remove('hovering');
        });
    });

    // ─── Magnetic Buttons ──────────────────────────────────────
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
            btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.transition = 'none';
        });
    });

    // ─── 3D Tilt Cards ─────────────────────────────────────────
    document.querySelectorAll('.tilt-card').forEach(card => {
        const inner = card.querySelector('.card-inner');
        const glow = card.querySelector('.card-glow');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (y - 0.5) * -12;
            const rotateY = (x - 0.5) * 12;
            inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            if (glow) {
                glow.style.left = `${x * 100 - 100}%`;
                glow.style.top = `${y * 100 - 100}%`;
            }
        });
        card.addEventListener('mouseleave', () => {
            inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // ─── Three.js — Liebherr 9800 Excavator ──────
    const heroContainer = document.getElementById('hero-canvas-container');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    heroContainer.appendChild(renderer.domElement);

    // Lighting — front-facing key for white excavator, teal accents
    const hemiLight = new THREE.HemisphereLight(0xf0f4ff, 0x1a1a2e, 1.5);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-4, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x058B94, 0.8);
    fillLight.position.set(5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x058B94, 1.0, 30);
    rimLight.position.set(4, 5, -8);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x058B94, 0.5, 12);
    underGlow.position.set(0, -1.0, 3);
    scene.add(underGlow);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.7);
    frontFill.position.set(0, 4, 8);
    scene.add(frontFill);

    const boomLight = new THREE.DirectionalLight(0xffffff, 0.5);
    boomLight.position.set(6, 8, 2);
    scene.add(boomLight);

    // Materials — Liebherr 9800 excavator (white body, dark undercarriage)
    const mats = {
        white: new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.55, metalness: 0.1, flatShading: true, side: THREE.DoubleSide }),
        whiteDark: new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.65, metalness: 0.12, flatShading: true }),
        black: new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.92, metalness: 0.04, flatShading: true }),
        darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7, metalness: 0.4, flatShading: true }),
        trackPad: new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.95, metalness: 0.05, flatShading: true }),
        trackFrame: new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.7, metalness: 0.35, flatShading: true }),
        hydraulic: new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.5, metalness: 0.5, flatShading: true }),
        glass: new THREE.MeshStandardMaterial({ color: 0x058B94, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.7, flatShading: true, emissive: 0x058B94, emissiveIntensity: 0.1 }),
        light: new THREE.MeshStandardMaterial({ color: 0xffeebb, emissive: 0xffcc55, emissiveIntensity: 0.6, roughness: 0.35, flatShading: true }),
        accent: new THREE.MeshStandardMaterial({ color: 0x058B94, metalness: 0.6, roughness: 0.25, emissive: 0x058B94, emissiveIntensity: 0.25, flatShading: true }),
        yellow: new THREE.MeshStandardMaterial({ color: 0xd4940f, roughness: 0.68, metalness: 0.15, flatShading: true }),
        counterweight: new THREE.MeshStandardMaterial({ color: 0x3d3d42, roughness: 0.8, metalness: 0.3, flatShading: true }),
        boomDark: new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.8, metalness: 0.3, flatShading: true, side: THREE.DoubleSide }),
    };

    const truck = new THREE.Group();
    const wheelGroups = [];

    function addM(mesh, grp) {
        grp = grp || truck;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        grp.add(mesh);
        return mesh;
    }
    function bx(s, p, m, r, g) {
        r = r || [0,0,0]; g = g || truck;
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(s[0],s[1],s[2]), m);
        mesh.position.set(p[0],p[1],p[2]);
        mesh.rotation.set(r[0],r[1],r[2]);
        return addM(mesh, g);
    }
    function cy(rt, rb, d, p, m, r, seg, g) {
        r = r || [0,0,0]; seg = seg || 12; g = g || truck;
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,d,seg,1,false), m);
        mesh.position.set(p[0],p[1],p[2]);
        mesh.rotation.set(r[0],r[1],r[2]);
        return addM(mesh, g);
    }

    // === TRACK UNDERCARRIAGE (massive crawlers — Liebherr 9800 proportions) ===
    function makeTrack(zOff) {
        var tLen = 9.5, tH = 1.8, tW = 1.6;
        // Main track frame (heavy H-beam)
        bx([tLen, tH * 0.4, tW * 0.7], [0, tH * 0.4, zOff], mats.trackFrame);
        // Track frame top guard rail
        bx([tLen * 0.95, 0.15, tW * 0.8], [0, tH * 0.65, zOff], mats.trackFrame);
        // Track frame bottom plate
        bx([tLen * 0.85, 0.1, tW * 0.75], [0, 0.15, zOff], mats.trackFrame);

        // Track pads / shoes — bottom run (ground contact)
        for (var tp = 0; tp < 24; tp++) {
            var tx = -tLen / 2 + 0.2 + tp * (tLen - 0.4) / 23;
            bx([0.28, 0.14, tW + 0.12], [tx, 0.04, zOff], mats.trackPad);
            // Grouser (raised ridge on each pad)
            bx([0.08, 0.06, tW + 0.14], [tx, -0.02, zOff], mats.black);
        }
        // Track pads — top run (return)
        for (var tpt = 0; tpt < 20; tpt++) {
            var txt = -tLen / 2 + 0.5 + tpt * (tLen - 1.0) / 19;
            bx([0.28, 0.1, tW + 0.06], [txt, tH * 0.72, zOff], mats.trackPad);
        }

        // Sprocket (drive end — front, with teeth)
        cy(0.75, 0.75, tW * 0.55, [-tLen / 2 + 0.15, tH * 0.38, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 14);
        // Sprocket teeth
        for (var st = 0; st < 10; st++) {
            var sa = (st / 10) * Math.PI * 2;
            var stMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, tW * 0.35), mats.darkMetal);
            stMesh.position.set(
                -tLen / 2 + 0.15 + Math.cos(sa) * 0.82,
                tH * 0.38 + Math.sin(sa) * 0.82,
                zOff
            );
            stMesh.rotation.z = sa;
            addM(stMesh);
        }
        // Idler (tension end — rear)
        cy(0.65, 0.65, tW * 0.5, [tLen / 2 - 0.15, tH * 0.38, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 14);
        cy(0.25, 0.25, tW * 0.6, [tLen / 2 - 0.15, tH * 0.38, zOff], mats.trackFrame, [Math.PI / 2, 0, 0], 10);

        // Track rollers (7 per side)
        for (var rl = 0; rl < 7; rl++) {
            var rlx = -3.0 + rl * 0.95;
            cy(0.22, 0.22, tW * 0.35, [rlx, 0.14, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 8);
            // Roller bracket
            bx([0.12, 0.2, tW * 0.3], [rlx, 0.25, zOff], mats.trackFrame);
        }
        // Carrier rollers (top, 2 per side)
        cy(0.16, 0.16, tW * 0.3, [-1.5, tH * 0.72, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 8);
        cy(0.16, 0.16, tW * 0.3, [1.5, tH * 0.72, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 8);

        // Track side guards / covers
        bx([tLen * 0.92, tH * 0.8, 0.1], [0, tH * 0.42, zOff - tW / 2 - 0.06], mats.trackFrame);
        bx([tLen * 0.92, tH * 0.8, 0.1], [0, tH * 0.42, zOff + tW / 2 + 0.06], mats.trackFrame);
        // Side guard panel lines
        bx([tLen * 0.9, 0.04, 0.12], [0, tH * 0.2, zOff - tW / 2 - 0.06], mats.darkMetal);
        bx([tLen * 0.9, 0.04, 0.12], [0, tH * 0.6, zOff - tW / 2 - 0.06], mats.darkMetal);
        bx([tLen * 0.9, 0.04, 0.12], [0, tH * 0.2, zOff + tW / 2 + 0.06], mats.darkMetal);
        bx([tLen * 0.9, 0.04, 0.12], [0, tH * 0.6, zOff + tW / 2 + 0.06], mats.darkMetal);

        // Track tensioner housing (rear)
        bx([0.6, 0.5, tW * 0.5], [tLen / 2 - 0.5, tH * 0.38, zOff], mats.trackFrame);
    }
    makeTrack(-3.4);
    // Far track (simplified — not visible to camera)
    (function() {
        var zOff = 3.4, tLen = 9.5, tH = 1.8, tW = 1.6;
        bx([tLen, tH * 0.7, tW], [0, tH * 0.35, zOff], mats.trackFrame);
        bx([tLen, 0.14, tW + 0.12], [0, 0.04, zOff], mats.trackPad);
        cy(0.75, 0.75, tW * 0.55, [-tLen / 2 + 0.15, tH * 0.38, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 10);
        cy(0.65, 0.65, tW * 0.5, [tLen / 2 - 0.15, tH * 0.38, zOff], mats.darkMetal, [Math.PI / 2, 0, 0], 10);
    })();

    // Track cross-frame (car body connecting both crawlers)
    bx([5.0, 0.8, 5.4], [0, 1.6, 0], mats.darkMetal);
    bx([3.5, 0.4, 6.0], [0, 2.1, 0], mats.trackFrame);

    // === TURNTABLE / SLEW RING ===
    cy(2.2, 2.2, 0.35, [0, 2.4, 0], mats.darkMetal, [0, 0, 0], 20);
    cy(1.8, 1.8, 0.15, [0, 2.6, 0], mats.trackFrame, [0, 0, 0], 20);

    // === MAIN SUPERSTRUCTURE (house body) ===
    // Lower body (wide)
    bx([6.5, 2.4, 5.4], [0, 3.9, 0], mats.white);
    // Upper engine deck (stepped up)
    bx([3.5, 1.8, 5.2], [-1.5, 5.9, 0], mats.white);
    // Engine deck top
    bx([3.3, 0.12, 5.0], [-1.5, 6.85, 0], mats.whiteDark);
    // Front body face (angled)
    bx([0.15, 2.2, 4.8], [3.3, 3.9, 0], mats.whiteDark);

    // Side panel seam lines (near side only — camera facing)
    for (var pli = 0; pli < 3; pli++) {
        var ply = 3.0 + pli * 0.9;
        bx([6.3, 0.04, 0.05], [0, ply, -2.75], mats.whiteDark);
    }
    // Vertical panel seams (near side only)
    for (var pvs = 0; pvs < 4; pvs++) {
        var pvx = -2.0 + pvs * 1.8;
        bx([0.04, 2.2, 0.05], [pvx, 3.9, -2.75], mats.whiteDark);
    }

    // Engine intake louvers (top of engine deck)
    for (var lv = 0; lv < 12; lv++) {
        bx([0.06, 0.08, 4.0], [-2.8 + lv * 0.22, 6.9, 0], mats.darkMetal);
    }

    // Exhaust stacks (twin — shorter, capped)
    cy(0.14, 0.16, 1.4, [-2.0, 7.2, 1.5], mats.darkMetal, [0, 0, 0], 10);
    cy(0.14, 0.16, 1.4, [-2.0, 7.2, -1.5], mats.darkMetal, [0, 0, 0], 10);
    // Exhaust caps
    bx([0.3, 0.06, 0.3], [-2.0, 7.95, 1.5], mats.darkMetal);
    bx([0.3, 0.06, 0.3], [-2.0, 7.95, -1.5], mats.darkMetal);

    // Brand panel area (dark rectangle — "LIEBHERR" zone, near side only)
    bx([2.2, 0.8, 0.06], [0.5, 4.0, -2.76], mats.black);

    // === BODY SIDE DETAILS (near side — camera facing) ===
    // Access panel handles (small horizontal bars)
    bx([0.4, 0.04, 0.04], [-1.0, 3.5, -2.76], mats.darkMetal);
    bx([0.4, 0.04, 0.04], [1.8, 3.5, -2.76], mats.darkMetal);
    // Inspection panel outlines
    bx([1.0, 0.8, 0.04], [-1.5, 4.6, -2.76], mats.whiteDark);
    bx([0.8, 0.8, 0.04], [2.0, 4.6, -2.76], mats.whiteDark);
    // Vents / louvered grille (near side, lower)
    for (var vt = 0; vt < 6; vt++) {
        bx([0.8, 0.04, 0.04], [1.5, 3.2 + vt * 0.12, -2.76], mats.darkMetal);
    }
    // Hydraulic line routing (small pipes along body side)
    bx([3.0, 0.06, 0.06], [0.5, 5.0, -2.76], mats.darkMetal);
    bx([3.0, 0.06, 0.06], [0.5, 5.1, -2.76], mats.darkMetal);
    // Step / toe-kick plate at platform edge
    bx([5.5, 0.2, 0.15], [0, 2.72, -2.9], mats.darkMetal);
    // Fire suppression cylinder (small tank on near side)
    cy(0.12, 0.12, 0.8, [-2.5, 3.4, -2.7], mats.hydraulic, [0, 0, -1.5708], 8);
    // Electrical junction box
    bx([0.3, 0.25, 0.12], [2.5, 4.8, -2.76], mats.darkMetal);
    // Tie-down / anchor points
    bx([0.12, 0.12, 0.08], [-2.8, 2.8, -2.76], mats.darkMetal);
    bx([0.12, 0.12, 0.08], [2.8, 2.8, -2.76], mats.darkMetal);

    // --- Additional body side detail ---
    // Large radiator grille panel
    bx([1.6, 1.2, 0.06], [-0.2, 4.0, -2.76], mats.darkMetal);
    for (var rg = 0; rg < 8; rg++) {
        bx([1.4, 0.03, 0.03], [-0.2, 3.5 + rg * 0.14, -2.78], mats.trackFrame);
    }
    // Engine access door outline (lower right)
    bx([1.4, 1.6, 0.04], [1.0, 3.9, -2.77], mats.trackFrame);
    bx([0.06, 1.5, 0.04], [0.3, 3.9, -2.78], mats.trackFrame);
    bx([0.06, 1.5, 0.04], [1.7, 3.9, -2.78], mats.trackFrame);
    // Door latch
    bx([0.08, 0.2, 0.06], [1.65, 3.9, -2.79], mats.hydraulic);
    // Warning label placeholders (small rectangles)
    bx([0.4, 0.25, 0.02], [-2.0, 3.3, -2.77], mats.yellow);
    bx([0.3, 0.2, 0.02], [0.5, 3.0, -2.77], mats.yellow);
    // Exhaust stack (vertical cylinder on upper body)
    cy(0.15, 0.12, 0.8, [-1.0, 6.4, -2.2], mats.darkMetal, [0, 0, 0], 8);
    cy(0.18, 0.18, 0.1, [-1.0, 6.8, -2.2], mats.darkMetal, [0, 0, 0], 8);
    // Pre-cleaner intake (cylindrical)
    cy(0.1, 0.1, 0.5, [-1.8, 6.2, -2.4], mats.hydraulic, [0, 0, 0], 8);
    cy(0.14, 0.14, 0.06, [-1.8, 6.45, -2.4], mats.darkMetal, [0, 0, 0], 8);
    // Fuel filler cap
    cy(0.08, 0.08, 0.04, [2.2, 3.8, -2.78], mats.hydraulic, [0, 0, Math.PI / 2], 8);
    // Grab rail (vertical bar near engine deck)
    cy(0.03, 0.03, 1.2, [-0.8, 5.5, -2.78], mats.yellow, [0, 0, 0], 6);
    cy(0.03, 0.03, 1.2, [-0.4, 5.5, -2.78], mats.yellow, [0, 0, 0], 6);
    bx([0.4, 0.06, 0.06], [-0.6, 6.1, -2.78], mats.yellow);
    // Hydraulic valve bank (row of small blocks)
    for (var hv = 0; hv < 5; hv++) {
        bx([0.15, 0.2, 0.12], [-2.2 + hv * 0.22, 5.3, -2.76], mats.hydraulic);
    }
    // Hose routing from valve bank (downward)
    for (var hr = 0; hr < 3; hr++) {
        cy(0.025, 0.025, 1.5, [-2.1 + hr * 0.3, 4.5, -2.77], mats.black, [0, 0, 0], 6);
    }
    // Bolted flange (circular detail)
    cy(0.18, 0.18, 0.04, [0.0, 4.4, -2.78], mats.darkMetal, [0, 0, Math.PI / 2], 8);
    cy(0.08, 0.08, 0.05, [0.0, 4.4, -2.79], mats.trackFrame, [0, 0, Math.PI / 2], 6);
    // Lifting eye brackets (top of body)
    bx([0.15, 0.3, 0.08], [-3.0, 5.2, -2.6], mats.darkMetal);
    bx([0.15, 0.3, 0.08], [2.8, 5.2, -2.6], mats.darkMetal);

    // === COUNTERWEIGHT (massive rear block) ===
    bx([2.2, 2.8, 5.6], [-4.2, 3.7, 0], mats.counterweight);
    bx([1.8, 0.8, 5.4], [-4.2, 5.3, 0], mats.counterweight);
    // Rounded edges (chamfer blocks)
    bx([0.3, 2.6, 5.4], [-5.35, 3.7, 0], mats.counterweight);
    // Lifting lugs (near side only)
    cy(0.12, 0.12, 0.4, [-4.0, 5.8, -2.0], mats.darkMetal, [Math.PI / 2, 0, 0], 8);
    // Counterweight horizontal ribs (near side only)
    for (var cwi = 0; cwi < 5; cwi++) {
        bx([2.1, 0.06, 0.12], [-4.2, 2.6 + cwi * 0.6, -2.7], mats.darkMetal);
    }
    // Counterweight vertical stiffeners
    bx([0.08, 2.6, 0.1], [-4.2, 3.7, -1.8], mats.darkMetal);
    bx([0.08, 2.6, 0.1], [-4.2, 3.7, 0], mats.darkMetal);
    bx([0.08, 2.6, 0.1], [-4.2, 3.7, 1.8], mats.darkMetal);

    // === CAB (elevated, FOPS/ROPS cage, multi-pane glass) ===
    // Cab body
    bx([2.2, 2.4, 2.2], [3.0, 5.9, -1.8], mats.white);
    // Cab roof
    bx([2.4, 0.15, 2.4], [3.0, 7.2, -1.8], mats.whiteDark);
    // Front windscreen (3 panels)
    bx([0.05, 1.2, 0.65], [4.15, 6.0, -2.3], mats.glass);
    bx([0.05, 1.2, 0.65], [4.15, 6.0, -1.65], mats.glass);
    bx([0.05, 1.2, 0.65], [4.15, 6.0, -1.0], mats.glass);
    // Front windscreen dividers
    bx([0.06, 1.3, 0.04], [4.16, 6.0, -1.95], mats.darkMetal);
    bx([0.06, 1.3, 0.04], [4.16, 6.0, -1.32], mats.darkMetal);
    // Side windows (left)
    bx([1.6, 1.2, 0.05], [3.0, 6.0, -2.95], mats.glass);
    // Side window (right)
    bx([1.0, 1.0, 0.05], [3.0, 6.0, -0.65], mats.glass);
    // Rear window
    bx([0.05, 0.9, 1.6], [1.85, 6.0, -1.8], mats.glass);
    // Skylight
    bx([1.6, 0.05, 1.6], [3.0, 7.1, -1.8], mats.glass);
    // FOPS cage frame (8 posts)
    bx([0.07, 2.5, 0.07], [4.1, 5.9, -2.9], mats.darkMetal);
    bx([0.07, 2.5, 0.07], [4.1, 5.9, -0.7], mats.darkMetal);
    bx([0.07, 2.5, 0.07], [1.9, 5.9, -2.9], mats.darkMetal);
    bx([0.07, 2.5, 0.07], [1.9, 5.9, -0.7], mats.darkMetal);
    bx([0.07, 2.5, 0.07], [3.0, 5.9, -2.9], mats.darkMetal);
    bx([0.07, 2.5, 0.07], [3.0, 5.9, -0.7], mats.darkMetal);
    // Cab top frame rails
    bx([2.3, 0.07, 0.07], [3.0, 7.15, -2.9], mats.darkMetal);
    bx([2.3, 0.07, 0.07], [3.0, 7.15, -0.7], mats.darkMetal);
    bx([0.07, 0.07, 2.3], [4.1, 7.15, -1.8], mats.darkMetal);
    bx([0.07, 0.07, 2.3], [1.9, 7.15, -1.8], mats.darkMetal);
    // Roof-mounted work lights (4)
    bx([0.12, 0.12, 0.12], [3.8, 7.35, -2.4], mats.light);
    bx([0.12, 0.12, 0.12], [3.8, 7.35, -1.2], mats.light);
    bx([0.12, 0.12, 0.12], [2.2, 7.35, -2.4], mats.light);
    bx([0.12, 0.12, 0.12], [2.2, 7.35, -1.2], mats.light);
    // Door (right side of cab)
    bx([0.06, 1.8, 0.9], [3.0, 5.8, -0.66], mats.whiteDark);
    // Door handle
    bx([0.04, 0.15, 0.04], [3.0, 6.2, -0.63], mats.darkMetal);

    // === BOOM ARM ASSEMBLY (reference-accurate: boom UP, stick DOWN) ===
    var boomPivotX = 2.5, boomPivotY = 5.2;
    var boomAngle = 0.55;
    var boomLen = 7.5;

    // Boom group — pivots from front of house, angled UPWARD
    var boomGrp = new THREE.Group();
    boomGrp.position.set(boomPivotX, boomPivotY, 0.3);
    boomGrp.rotation.z = boomAngle;
    truck.add(boomGrp);

    // Boom pivot pin (large)
    cy(0.55, 0.55, 3.0, [0, 0, 0], mats.darkMetal, [Math.PI / 2, 0, 0], 12, boomGrp);
    // Boom pivot housing / clevis
    bx([1.5, 2.2, 3.0], [0, 0, 0], mats.boomDark, [0, 0, 0], boomGrp);

    // Boom main body (dark, shorter and fatter)
    bx([boomLen, 2.2, 1.7], [boomLen / 2, 0, 0], mats.boomDark, [0, 0, 0], boomGrp);
    // Boom side plates (visible seam lines on near side Z=-0.85)
    bx([boomLen - 0.5, 2.2, 0.04], [boomLen / 2, 0, -0.85], mats.darkMetal, [0, 0, 0], boomGrp);
    // Boom top/bottom edge lines
    bx([boomLen - 0.5, 0.04, 1.72], [boomLen / 2, 1.1, 0], mats.darkMetal, [0, 0, 0], boomGrp);
    bx([boomLen - 0.5, 0.04, 1.72], [boomLen / 2, -1.1, 0], mats.darkMetal, [0, 0, 0], boomGrp);
    // Weld seam (horizontal line along boom face)
    bx([boomLen * 0.85, 0.06, 0.06], [boomLen / 2, 0, -0.67], mats.trackFrame, [0, 0, 0], boomGrp);

    // Boom detail — pipe brackets (small tabs along near side)
    for (var pb = 0; pb < 4; pb++) {
        bx([0.14, 0.18, 0.14], [1.8 + pb * 1.6, 1.12, -0.8], mats.darkMetal, [0, 0, 0], boomGrp);
    }
    // Boom detail — bottom flange / reinforcement strip
    bx([boomLen * 0.7, 0.12, 1.3], [boomLen / 2 + 0.5, -1.12, 0], mats.darkMetal, [0, 0, 0], boomGrp);
    // Boom detail — lifting eye near pivot
    bx([0.25, 0.35, 0.25], [1.2, 1.12, -0.7], mats.darkMetal, [0, 0, 0], boomGrp);
    // Boom detail — grease nipple points
    bx([0.1, 0.1, 0.1], [0.3, 0.6, -0.87], mats.accent, [0, 0, 0], boomGrp);
    bx([0.1, 0.1, 0.1], [boomLen - 0.3, 0.4, -0.7], mats.accent, [0, 0, 0], boomGrp);

    // --- Stick group — attached at end of boom, angled DOWN ---
    var stickAngle = -1.4;
    var stickLen = 5.5;

    var stickGrp = new THREE.Group();
    stickGrp.position.set(boomLen, 0, 0);
    stickGrp.rotation.z = stickAngle;
    boomGrp.add(stickGrp);

    // Stick pivot pin (elbow joint)
    cy(0.45, 0.45, 2.2, [0, 0, 0], mats.darkMetal, [Math.PI / 2, 0, 0], 10, stickGrp);
    // Stick pivot housing
    bx([1.0, 1.8, 2.2], [0, 0, 0], mats.boomDark, [0, 0, 0], stickGrp);

    // Stick body (shorter, fatter)
    bx([stickLen, 1.5, 1.2], [stickLen / 2, 0, 0], mats.boomDark, [0, 0, 0], stickGrp);
    // Stick side plate seam (near side)
    bx([stickLen - 0.4, 1.5, 0.04], [stickLen / 2, 0, -0.6], mats.darkMetal, [0, 0, 0], stickGrp);
    // Stick top/bottom lines
    bx([stickLen - 0.4, 0.04, 1.22], [stickLen / 2, 0.75, 0], mats.darkMetal, [0, 0, 0], stickGrp);
    bx([stickLen - 0.4, 0.04, 1.22], [stickLen / 2, -0.75, 0], mats.darkMetal, [0, 0, 0], stickGrp);
    // Stick cylinder bracket (top, near pivot)
    bx([0.7, 0.9, 1.5], [0.8, 0.85, 0], mats.darkMetal, [0, 0, 0], stickGrp);
    // Stick detail — weld seam along near side
    bx([stickLen * 0.8, 0.06, 0.06], [stickLen / 2, 0, -0.62], mats.trackFrame, [0, 0, 0], stickGrp);
    // Stick detail — pipe bracket tabs
    for (var spb = 0; spb < 3; spb++) {
        bx([0.12, 0.14, 0.12], [1.2 + spb * 1.5, 0.76, -0.55], mats.darkMetal, [0, 0, 0], stickGrp);
    }
    // Stick detail — reinforcement plate at elbow end
    bx([1.4, 1.5, 0.06], [0.2, 0, -0.62], mats.darkMetal, [0, 0, 0], stickGrp);
    // Stick detail — grease point
    bx([0.09, 0.09, 0.09], [0.3, 0.5, -0.63], mats.accent, [0, 0, 0], stickGrp);

    // --- Bucket group — attached at end of stick, curled forward ---
    var bucketAngle = -0.3;

    var bucketGrp = new THREE.Group();
    bucketGrp.position.set(stickLen, 0, 0);
    bucketGrp.rotation.z = bucketAngle;
    stickGrp.add(bucketGrp);

    // Bucket pivot pin
    cy(0.35, 0.35, 4.2, [0, 0, 0], mats.darkMetal, [Math.PI / 2, 0, 0], 10, bucketGrp);

    // Bucket back plate (dark)
    bx([2.2, 2.8, 4.0], [1.1, 0, 0], mats.boomDark, [0, 0, 0], bucketGrp);
    // Bucket floor plate
    bx([2.4, 0.2, 4.1], [1.1, -1.4, 0], mats.darkMetal, [0, 0, 0], bucketGrp);
    // Side cheek plates
    bx([2.4, 2.8, 0.16], [1.1, 0, -2.0], mats.darkMetal, [0, 0, 0], bucketGrp);
    bx([2.4, 2.8, 0.16], [1.1, 0, 2.0], mats.darkMetal, [0, 0, 0], bucketGrp);
    // Cutting edge / wear plate (lip)
    bx([0.26, 2.7, 4.1], [2.3, 0, 0], mats.darkMetal, [0, 0, 0], bucketGrp);
    // Wear strips (horizontal lines on back plate)
    bx([2.1, 0.08, 4.02], [1.1, 0.7, 0], mats.darkMetal, [0, 0, 0], bucketGrp);
    bx([2.1, 0.08, 4.02], [1.1, -0.5, 0], mats.darkMetal, [0, 0, 0], bucketGrp);
    // Lip shrouds (protectors between teeth)
    for (var ls = 0; ls < 7; ls++) {
        bx([0.18, 0.4, 0.18], [2.4, -0.6, -1.5 + ls * 0.5], mats.darkMetal, [0, 0, 0], bucketGrp);
    }
    // Teeth (8 — teal/accent color matching reference green)
    for (var bt = 0; bt < 8; bt++) {
        var btz = -1.75 + bt * 0.5;
        bx([0.65, 0.35, 0.26], [2.6, -0.9 + bt * 0.005, btz], mats.accent, [0, 0, 0], bucketGrp);
    }
    // Tooth adapters (dark metal)
    for (var ta = 0; ta < 8; ta++) {
        bx([0.26, 0.28, 0.28], [2.4, -0.9 + ta * 0.005, -1.75 + ta * 0.5], mats.darkMetal, [0, 0, 0], bucketGrp);
    }

    // === HYDRAULIC CYLINDERS ===
    // Boom lift pistons (from body base up to mid-boom — in truck group)
    // Boom angle is 0.55 rad, pistons run parallel to boom so same angle
    cy(0.32, 0.24, 5.0, [3.8, 6.0, -0.9], mats.hydraulic, [0, 0, -0.55], 10);
    cy(0.32, 0.24, 5.0, [3.8, 6.0, 0.9], mats.hydraulic, [0, 0, -0.55], 10);
    // Piston chrome rods (same angle)
    cy(0.14, 0.14, 2.8, [5.2, 7.6, -0.9], mats.accent, [0, 0, -0.55], 10);
    cy(0.14, 0.14, 2.8, [5.2, 7.6, 0.9], mats.accent, [0, 0, -0.55], 10);

    // Stick cylinder (inside boomGrp — flipped to run along arm)
    cy(0.22, 0.18, 4.0, [4.0, 1.15, 0], mats.hydraulic, [0, 0, -1.5708], 10, boomGrp);
    cy(0.11, 0.11, 2.0, [6.5, 1.15, 0], mats.accent, [0, 0, -1.5708], 10, boomGrp);

    // Bucket linkage cylinders (inside stickGrp)
    cy(0.14, 0.1, 2.0, [2.5, 0.8, -0.55], mats.hydraulic, [0, 0, -1.5708], 8, stickGrp);
    cy(0.14, 0.1, 2.0, [2.5, 0.8, 0.55], mats.hydraulic, [0, 0, -1.5708], 8, stickGrp);
    cy(0.07, 0.07, 1.2, [3.8, 0.8, -0.55], mats.accent, [0, 0, -1.5708], 8, stickGrp);
    cy(0.07, 0.07, 1.2, [3.8, 0.8, 0.55], mats.accent, [0, 0, -1.5708], 8, stickGrp);

    // === HYDRAULIC HOSE BUNDLE (along boom top) ===
    for (var hi = 0; hi < 4; hi++) {
        var hz = -0.28 + hi * 0.18;
        cy(0.04, 0.04, 6.5, [4.0, 1.12, hz], mats.black, [0, 0, -1.5708], 6, boomGrp);
    }

    // === PLATFORMS & WALKWAYS ===
    bx([6.8, 0.1, 6.0], [0, 2.65, 0], mats.whiteDark);
    // Platform edge trim (near side + front only)
    bx([6.8, 0.12, 0.06], [0, 2.72, -3.0], mats.yellow);
    bx([0.06, 0.12, 6.0], [3.4, 2.72, 0], mats.yellow);

    // Handrail stanchions (near side only)
    for (var hrs = 0; hrs < 10; hrs++) {
        var hrx = -3.2 + hrs * 0.72;
        bx([0.05, 0.9, 0.05], [hrx, 3.15, -3.0], mats.yellow);
    }
    // Handrails (near side — top rail)
    bx([7.0, 0.05, 0.05], [0, 3.6, -3.0], mats.yellow);
    // Handrails (near side — mid rail)
    bx([7.0, 0.05, 0.05], [0, 3.3, -3.0], mats.yellow);

    // === STAIRCASE (tall access stair, near side — prominent yellow) ===
    // Main stair stringers (two vertical rails from ground to platform)
    bx([0.06, 4.0, 0.06], [3.9, 2.7, -3.2], mats.yellow);
    bx([0.06, 4.0, 0.06], [3.9, 2.7, -3.7], mats.yellow);
    // Stair treads (10 rungs connecting the two stringers)
    for (var st = 0; st < 10; st++) {
        var sy = 1.0 + st * 0.38;
        bx([0.04, 0.04, 0.55], [3.9, sy, -3.45], mats.yellow);
    }
    // Staircase cage (3 hoops connecting to stringers)
    for (var sc = 0; sc < 4; sc++) {
        var scy = 1.5 + sc * 1.0;
        // Horizontal bar across top of hoop
        bx([0.25, 0.04, 0.6], [4.15, scy, -3.45], mats.yellow);
        // Vertical posts connecting hoop to stringers
        bx([0.04, 0.25, 0.04], [4.15, scy - 0.12, -3.2], mats.yellow);
        bx([0.04, 0.25, 0.04], [4.15, scy - 0.12, -3.7], mats.yellow);
    }

    // === LADDER (access to cab platform — yellow) ===
    // Side rails (vertical, from near ground to platform level)
    bx([0.05, 3.2, 0.05], [4.0, 3.3, -2.55], mats.yellow);
    bx([0.05, 3.2, 0.05], [4.0, 3.3, -3.05], mats.yellow);
    // Rungs (connecting the two rails)
    for (var lai = 0; lai < 7; lai++) {
        bx([0.05, 0.05, 0.5], [4.0, 1.9 + lai * 0.45, -2.8], mats.yellow);
    }
    // Ladder cage hoops (attached to rails at same X position)
    for (var lc = 0; lc < 3; lc++) {
        var lcy = 2.5 + lc * 1.0;
        bx([0.2, 0.04, 0.55], [4.1, lcy, -2.8], mats.yellow);
        bx([0.04, 0.2, 0.04], [4.1, lcy - 0.1, -2.55], mats.yellow);
        bx([0.04, 0.2, 0.04], [4.1, lcy - 0.1, -3.05], mats.yellow);
    }

    // === HEADLIGHTS & WORK LIGHTS ===
    cy(0.12, 0.12, 0.06, [3.4, 7.3, -1.0], mats.light, [0, 0, 0], 8);
    cy(0.12, 0.12, 0.06, [3.4, 7.3, 0.6], mats.light, [0, 0, 0], 8);

    // Position excavator (front-quarter view, locked orientation)
    truck.scale.setScalar(0.46);
    truck.position.set(3.0, -0.8, 0);
    truck.rotation.y = Math.PI * 2.91;
    scene.add(truck);

    // === Wireframe geometry floating around ===
    const wireframes = [];
    const wireGeos = [
        new THREE.IcosahedronGeometry(0.4, 0),
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.TetrahedronGeometry(0.3, 0),
        new THREE.DodecahedronGeometry(0.3, 0),
    ];
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x058B94,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
    });

    for (let i = 0; i < 8; i++) {
        const geo = wireGeos[i % wireGeos.length];
        const mesh = new THREE.Mesh(geo, wireMat.clone());
        mesh.position.set(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 8 + 1,
            (Math.random() - 0.5) * 8
        );
        mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.015;
        mesh.userData.floatSpeed = Math.random() * 0.4 + 0.2;
        mesh.userData.floatOffset = Math.random() * Math.PI * 2;
        mesh.userData.baseY = mesh.position.y;
        scene.add(mesh);
        wireframes.push(mesh);
    }

    // === 3D Particles ===
    const particleCount3D = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount3D * 3);
    for (let i = 0; i < particleCount3D * 3; i += 3) {
        pPositions[i] = (Math.random() - 0.5) * 25;
        pPositions[i + 1] = (Math.random() - 0.5) * 15;
        pPositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0x058B94,
        size: 0.04,
        transparent: true,
        opacity: 0.6,
    });
    const points3D = new THREE.Points(pGeo, pMat);
    scene.add(points3D);

    // Ground grid
    const gridGeo = new THREE.PlaneGeometry(25, 25, 25, 25);
    const gridMat = new THREE.MeshBasicMaterial({
        color: 0x058B94,
        wireframe: true,
        transparent: true,
        opacity: 0.03,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -2.5;
    scene.add(grid);

    camera.position.set(4, 3.0, 9.0);
    camera.lookAt(1.5, 1.5, 0);

    // ─── Fixed Orientation + Mouse Parallax + Gentle Scroll ─────────────────
    const baseRotY = Math.PI * 2.91;
    let targetRotY = baseRotY;
    const targetRotX = 0;
    let truckMouseX = 0, truckMouseY = 0;

    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
            targetRotY = baseRotY + (self.progress * Math.PI * 0.15);
        }
    });

    document.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        truckMouseX = ny * 0.04;
        truckMouseY = nx * 0.06;
    });

    // Render loop (visibility-gated for performance)
    let sceneTime = 0;
    let heroVisible = true;
    const heroObserver = new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
    }, { rootMargin: '200px' });
    heroObserver.observe(heroContainer);

    function animate() {
        requestAnimationFrame(animate);
        if (!heroVisible) return;
        sceneTime += 0.01;

        truck.rotation.y += (targetRotY + truckMouseY - truck.rotation.y) * 0.035;
        truck.rotation.x += (targetRotX + truckMouseX - truck.rotation.x) * 0.035;
        truck.position.y = -0.8 + Math.sin(sceneTime * 0.7) * 0.03;

        for (var wi = 0; wi < wheelGroups.length; wi++) {
            wheelGroups[wi].rotation.y += 0.008;
        }

        camera.lookAt(0.5, 1.0, 0);

        wireframes.forEach(wf => {
            wf.rotation.x += wf.userData.rotSpeed;
            wf.rotation.y += wf.userData.rotSpeed * 0.7;
            wf.position.y = wf.userData.baseY + Math.sin(sceneTime * wf.userData.floatSpeed + wf.userData.floatOffset) * 0.4;
        });

        points3D.rotation.y += 0.0004;
        rimLight.intensity = 1.0 + Math.sin(sceneTime * 2) * 0.3;
        underGlow.intensity = 0.5 + Math.sin(sceneTime * 1.5) * 0.2;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ─── LOADING SCREEN ──────────────────────────────────────
    var loader = document.getElementById('loader');
    var loaderFill = document.querySelector('.loader-bar-fill');
    var loaderLogo = document.querySelector('.loader-logo');
    var loaderText = document.querySelector('.loader-text');

    var loaderTL = gsap.timeline();
    loaderTL
        .to(loaderLogo, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        .to(loaderText, { opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
        .to(loaderFill, { width: '100%', duration: 1.8, ease: 'power2.inOut' }, '-=0.2')
        .to(loader, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: function() {
            loader.classList.add('loaded');
            startHeroAnimation();
        }}, '+=0.2');

    // ─── GSAP Scroll Animations ──────────────────────────────

    function startHeroAnimation() {
        var heroTL = gsap.timeline();
        heroTL
            .to('.title-word', {
                y: 0,
                duration: 1.2,
                stagger: 0.12,
                ease: 'power4.out',
            })
            .to('.hero-tag', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.8')
            .to('.hero-subtitle', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.5')
            .to('.hero-cta', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.5')
            .to('.scroll-indicator', {
                opacity: 0.7,
                duration: 1,
                ease: 'power2.out',
            }, '-=0.3');
    }

    // Scroll reveals — standard
    gsap.utils.toArray('.reveal-text').forEach(function(el) {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                end: 'top 55%',
                scrub: 1,
            },
            opacity: 1,
            y: 0,
            ease: 'power3.out',
        });
    });

    gsap.utils.toArray('.reveal-up').forEach(function(el) {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                end: 'top 60%',
                scrub: 1,
            },
            opacity: 1,
            y: 0,
            ease: 'power3.out',
        });
    });


    // Section parallax
    gsap.to('.about-left', {
        scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
        y: -40,
        ease: 'none',
    });

    gsap.to('.about-right', {
        scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
        y: -15,
        ease: 'none',
    });

    gsap.to('.tech-bg-element', {
        scrollTrigger: { trigger: '.tech-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
        x: -80,
        y: 80,
        ease: 'none',
    });

    gsap.to('.tech-bg-element-2', {
        scrollTrigger: { trigger: '.tech-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
        x: 60,
        y: -60,
        ease: 'none',
    });

    // Video section parallax
    var videoBg = document.querySelector('.video-bg');
    if (videoBg) {
        gsap.to(videoBg, {
            scrollTrigger: { trigger: '.video-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
            y: 80,
            ease: 'none',
        });
    }

    // Stats counter
    document.querySelectorAll('.stat-number').forEach(function(num) {
        var target = parseInt(num.getAttribute('data-target'));
        ScrollTrigger.create({
            trigger: num,
            start: 'top 85%',
            once: true,
            onEnter: function() {
                gsap.to(num, {
                    innerText: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { innerText: 1 },
                    onUpdate: function() {
                        num.textContent = Math.round(parseFloat(num.textContent));
                    }
                });
            }
        });
    });

    // Hero canvas fade on scroll
    gsap.to('#hero-canvas-container', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        opacity: 0,
        ease: 'none',
    });

    // Marquee extra movement
    gsap.to('.marquee-content', {
        scrollTrigger: { trigger: '.marquee-section', start: 'top bottom', end: 'bottom top', scrub: 1 },
        x: '-200px',
        ease: 'none',
    });


    // ─── BACK TO TOP ──────────────────────────────────────
    var backToTop = document.getElementById('back-to-top');
    var progressFill = document.querySelector('.progress-ring-fill');
    var circumference = 2 * Math.PI * 20;

    if (backToTop && progressFill) {
        lenis.on('scroll', function(data) {
            var scrolled = data.scroll;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = scrolled / docHeight;
            var offset = circumference - (progress * circumference);
            progressFill.style.strokeDashoffset = offset;

            if (scrolled > window.innerHeight) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function() {
            lenis.scrollTo(0);
        });
    }

    // ─── THEME TOGGLE ──────────────────────────────────────
    var themeToggle = document.getElementById('theme-toggle');
    var htmlEl = document.documentElement;
    var stored = localStorage.getItem('grb-theme');
    if (stored) {
        htmlEl.setAttribute('data-theme', stored);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var current = htmlEl.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', next);
            localStorage.setItem('grb-theme', next);
            if (next === 'light') {
                mats.white.color.setHex(0x3a3a3f);
                mats.whiteDark.color.setHex(0x2e2e33);
            } else {
                mats.white.color.setHex(0xe8e8e8);
                mats.whiteDark.color.setHex(0xc0c0c0);
            }
        });
    }

    // Apply initial theme to 3D model materials
    var initialTheme = htmlEl.getAttribute('data-theme') || 'dark';
    if (initialTheme === 'light') {
        mats.white.color.setHex(0x3a3a3f);
        mats.whiteDark.color.setHex(0x2e2e33);
    }

    // Nav hide/show
    var lastScroll = 0;
    var navbar = document.getElementById('navbar');
    lenis.on('scroll', function(data) {
        if (data.scroll > lastScroll && data.scroll > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScroll = data.scroll;
    });

    // Smooth anchor scrolling
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                lenis.scrollTo(target, { offset: -80 });
            }
        });
    });

    // Enquiry form (FormSubmit.co) — always AJAX, never redirects
    var enquiryForm = document.getElementById('enquiry-form');
    var formStatus = document.getElementById('form-status');
    var lastSubmitTime = 0;

    if (enquiryForm) {
        enquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Rate limit: 30 seconds between submissions
            var now = Date.now();
            if (now - lastSubmitTime < 30000) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please wait before submitting again.';
                return;
            }

            // Client-side validation
            var nameVal = enquiryForm.querySelector('[name="name"]').value.trim();
            var emailVal = enquiryForm.querySelector('[name="email"]').value.trim();
            var messageVal = enquiryForm.querySelector('[name="message"]').value.trim();

            if (nameVal.length < 2 || nameVal.length > 100) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please enter a valid name.';
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || emailVal.length > 254) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please enter a valid email address.';
                return;
            }
            if (messageVal.length < 10 || messageVal.length > 2000) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Message must be between 10 and 2000 characters.';
                return;
            }

            var btn = enquiryForm.querySelector('.form-submit');
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Sending...';
            formStatus.className = 'form-status';
            formStatus.textContent = '';
            lastSubmitTime = now;

            var formData = new FormData(enquiryForm);

            fetch(enquiryForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).then(function() {
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Thank you! Your enquiry has been sent successfully.';
                enquiryForm.reset();
            }).catch(function() {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Something went wrong. Please email us directly at martin@grb.com.au';
            }).finally(function() {
                btn.disabled = false;
                btn.querySelector('span').textContent = 'Send Enquiry';
            });
        });
    }

    // ─── TEAM CAROUSEL ────────────────────────────────────────
    var teamTrack = document.querySelector('.team-carousel-track');
    var teamCards = document.querySelectorAll('.team-card');
    var activeTeamIndex = 0;

    function setActiveTeamCard(index) {
        if (index < 0) index = 0;
        if (index >= teamCards.length) index = teamCards.length - 1;
        activeTeamIndex = index;

        teamCards.forEach(function(c) { c.classList.remove('active'); });
        teamCards[index].classList.add('active');

        var cardWidth = teamCards[0].offsetWidth + 28;
        var containerWidth = teamTrack.parentElement.offsetWidth;
        var offset = (index * cardWidth) - (containerWidth / 2) + (cardWidth / 2);
        offset = Math.max(0, Math.min(offset, teamTrack.scrollWidth - containerWidth));
        teamTrack.style.transform = 'translateX(-' + offset + 'px)';
    }

    if (teamCards.length) {
        setActiveTeamCard(0);
        teamCards.forEach(function(card, i) {
            card.addEventListener('mouseenter', function() {
                setActiveTeamCard(i);
            });
        });
    }

    // ─── FACILITY VIDEO UNMUTE ─────────────────────────────────
    var facilityUnmute = document.getElementById('facility-unmute');
    var facilityVideo = document.getElementById('facility-video');
    var facilityOverlay = document.querySelector('.facility-overlay');
    var facilityMuted = true;

    var facilityHeroSection = document.getElementById('facility');

    function muteVideo() {
        if (!facilityMuted) {
            facilityMuted = true;
            var src = facilityVideo.src;
            facilityVideo.src = src.replace('muted=0', 'muted=1');
            facilityUnmute.classList.remove('playing');
            facilityUnmute.querySelector('.unmute-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
            if (facilityOverlay) facilityOverlay.classList.remove('hidden');
            if (facilityHeroSection) facilityHeroSection.classList.remove('video-active');
        }
    }

    if (facilityUnmute && facilityVideo) {
        facilityUnmute.addEventListener('click', function() {
            if (facilityMuted) {
                facilityMuted = false;
                var src = facilityVideo.src;
                facilityVideo.src = src.replace('muted=1', 'muted=0');
                facilityUnmute.classList.add('playing');
                facilityUnmute.querySelector('.unmute-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.08"/>';
                if (facilityOverlay) facilityOverlay.classList.add('hidden');
                if (facilityHeroSection) facilityHeroSection.classList.add('video-active');
            } else {
                muteVideo();
            }
        });

        var facilitySection = document.getElementById('facility');
        if (facilitySection) {
            var facilityVisObs = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) muteVideo();
                });
            }, { threshold: 0.1 });
            facilityVisObs.observe(facilitySection);
        }
    }

    // ─── FACILITY TIMELINE SCROLL ANIMATION ──────────────────
    var processTimeline = document.querySelector('.process-timeline');
    if (processTimeline) {
        var timelineSteps = processTimeline.querySelectorAll('.timeline-step');
        var timelineObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    processTimeline.classList.add('active');
                    timelineSteps.forEach(function(step, i) {
                        setTimeout(function() {
                            step.classList.add('lit');
                        }, 400 + i * 500);
                    });
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        timelineObserver.observe(processTimeline);
    }

    // ─── TRANSPORT TABS ──────────────────────────────────────
    var transportData = {
        staging: 'A fully monitored yard with 24/7 CCTV for approved heavy equipment movements.',
        rest: 'A safe and convenient parking area for heavy transport drivers and support crews.',
        route: 'A strategic location helping streamline oversized machinery movement across the region.'
    };

    var transportTabs = document.querySelectorAll('.transport-tab');
    var transportDesc = document.getElementById('transport-desc');

    if (transportTabs.length && transportDesc) {
        transportTabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                transportTabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var key = tab.getAttribute('data-tab');
                transportDesc.style.opacity = '0';
                setTimeout(function() {
                    transportDesc.textContent = transportData[key] || '';
                    transportDesc.style.opacity = '1';
                }, 200);
            });
        });
    }

    // ─── FACILITY STAT COUNTERS ──────────────────────────────
    var facilityStats = document.querySelectorAll('.facility-stat-number');
    if (facilityStats.length) {
        var statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute('data-target'));
                    var duration = 1800;
                    var start = performance.now();
                    function tick(now) {
                        var progress = Math.min((now - start) / duration, 1);
                        var eased = 1 - Math.pow(1 - progress, 3);
                        el.textContent = Math.floor(eased * target);
                        if (progress < 1) requestAnimationFrame(tick);
                        else el.textContent = target;
                    }
                    requestAnimationFrame(tick);
                    statsObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        facilityStats.forEach(function(s) { statsObserver.observe(s); });
    }

    // ─── MINESTAR INTERACTIVE BUTTONS ─────────────────────────
    var minestarData = {
        edge: 'Cloud-based, subscription-managed application platform enabling browser access to the MineStar ecosystem.',
        fleet: 'Fleet management and production tracking. Manages line-ups, material movement, and payload compliance.',
        command: 'Autonomous and semi-autonomous machine operation. Includes Command for Hauling, Dozing, and Drilling.',
        terrain: 'High-precision GNSS guidance for grading, loading, and drilling operations.',
        detect: 'Safety and proximity awareness solutions.',
        health: 'Equipment health monitoring and predictive maintenance analytics.'
    };

    var minestarBtns = document.querySelectorAll('.minestar-btn');
    var minestarDesc = document.getElementById('minestar-desc');

    if (minestarBtns.length && minestarDesc) {
        minestarBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                minestarBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var key = btn.getAttribute('data-target');
                minestarDesc.style.opacity = '0';
                setTimeout(function() {
                    minestarDesc.textContent = minestarData[key] || '';
                    minestarDesc.style.opacity = '1';
                }, 200);
            });
        });
    }

})();
