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

    // ─── Three.js — Big Mining Haul Truck (CAT 797 Style) ──────
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

    // Lighting — warm key to pop yellow, teal rim for brand accent
    const hemiLight = new THREE.HemisphereLight(0xffefca, 0x1a1a2e, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffd28a, 2.5);
    keyLight.position.set(-5.5, 8.5, -5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x058B94, 1.0);
    fillLight.position.set(6, 4, 5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x058B94, 0.8, 25);
    rimLight.position.set(-3, 2, -8);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x058B94, 0.4, 10);
    underGlow.position.set(0, -0.5, 0);
    scene.add(underGlow);

    // Materials — Komatsu 830E style mining haul truck
    const mats = {
        yellow: new THREE.MeshStandardMaterial({ color: 0xd4940f, roughness: 0.68, metalness: 0.15, flatShading: true, side: THREE.DoubleSide }),
        yellowLight: new THREE.MeshStandardMaterial({ color: 0xeaaa1a, roughness: 0.62, metalness: 0.1, flatShading: true }),
        yellowDark: new THREE.MeshStandardMaterial({ color: 0x8a5808, roughness: 0.78, metalness: 0.12, flatShading: true }),
        black: new THREE.MeshStandardMaterial({ color: 0x121214, roughness: 0.92, metalness: 0.04, flatShading: true }),
        darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7, metalness: 0.4, flatShading: true }),
        tyre: new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.97, metalness: 0.01, flatShading: true }),
        tyreSide: new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.92, metalness: 0.02, flatShading: true }),
        rim: new THREE.MeshStandardMaterial({ color: 0xd89413, roughness: 0.5, metalness: 0.35, flatShading: true }),
        glass: new THREE.MeshStandardMaterial({ color: 0x058B94, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.7, flatShading: true, emissive: 0x058B94, emissiveIntensity: 0.1 }),
        light: new THREE.MeshStandardMaterial({ color: 0xffeebb, emissive: 0xffcc55, emissiveIntensity: 0.6, roughness: 0.35, flatShading: true }),
        accent: new THREE.MeshStandardMaterial({ color: 0x058B94, metalness: 0.6, roughness: 0.25, emissive: 0x058B94, emissiveIntensity: 0.25, flatShading: true }),
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
    function panel(verts, mat) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        geo.computeVertexNormals();
        return addM(new THREE.Mesh(geo, mat));
    }
    function tri(a, b, c, arr) { arr.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]); }
    function quad(a, b, c, d, arr) { tri(a,b,c,arr); tri(a,c,d,arr); }

    // === MASSIVE WHEELS (the defining feature — nearly half the truck height) ===
    function makeWheel(x, z, r, w, detail) {
        r = r || 1.6; w = w || 1.1;
        if (detail === undefined) detail = true;
        var g = new THREE.Group();
        g.position.set(x, r + 0.08, z);
        g.rotation.x = Math.PI / 2;
        truck.add(g);
        wheelGroups.push(g);

        // Main tyre
        var tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 20), mats.tyre);
        tyre.castShadow = true; g.add(tyre);
        // Sidewall
        var sw = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, w + 0.02, 20), mats.tyreSide);
        g.add(sw);
        // Rim
        var rm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.06, 14), mats.rim);
        rm.castShadow = true; g.add(rm);
        // Hub
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, w + 0.08, 10), mats.yellowDark);
        g.add(hub);

        if (detail) {
            // Tread blocks
            for (var i = 0; i < 20; i++) {
                var a = (i / 20) * Math.PI * 2;
                var lug = new THREE.Mesh(new THREE.BoxGeometry(r * 0.22, w * 1.02, r * 0.14), mats.tyreSide);
                lug.position.set(Math.cos(a) * r * 0.94, 0, Math.sin(a) * r * 0.94);
                lug.rotation.y = -a;
                lug.castShadow = true; g.add(lug);
            }
            // Bolts
            for (var b = 0; b < 12; b++) {
                var ba = (b / 12) * Math.PI * 2;
                var bolt = new THREE.Mesh(new THREE.BoxGeometry(r * 0.05, w + 0.1, r * 0.05), mats.yellowDark);
                bolt.position.set(Math.cos(ba) * r * 0.35, 0, Math.sin(ba) * r * 0.35);
                g.add(bolt);
            }
        }
        return g;
    }

    // Front wheels (smaller)
    makeWheel(-3.8, -1.9, 1.45, 0.95, true);
    makeWheel(-3.8, 1.9, 1.45, 0.95, true);
    // Rear wheels (massive dual)
    makeWheel(2.6, -2.1, 1.7, 1.1, true);
    makeWheel(2.6, 2.1, 1.7, 1.1, true);

    // === CHASSIS — heavy frame sitting high above ground ===
    bx([8.5, 0.5, 3.2], [0, 2.6, 0], mats.black);
    bx([7.0, 0.3, 2.6], [0.5, 2.95, 0], mats.darkMetal);

    // === FRONT ENGINE / RADIATOR (tall, imposing front face like the 830E) ===
    bx([2.4, 2.8, 3.4], [-3.0, 4.3, 0], mats.yellow);
    // Radiator grille
    bx([0.15, 2.2, 2.8], [-4.25, 4.0, 0], mats.black);
    // Grille horizontal slats
    for (var si = 0; si < 8; si++) {
        bx([0.18, 0.08, 2.6], [-4.3, 3.1 + si * 0.28, 0], mats.darkMetal);
    }
    // Bumper
    bx([0.4, 0.4, 3.8], [-4.5, 2.7, 0], mats.yellowDark);
    // Lower guard bar
    bx([0.2, 0.15, 4.2], [-4.7, 2.35, 0], mats.accent);

    // === CAB (tall box on front-left like the reference) ===
    bx([1.6, 2.0, 1.6], [-2.2, 5.9, -1.2], mats.yellow);
    // Cab roof
    bx([1.8, 0.2, 1.8], [-2.2, 7.0, -1.2], mats.yellowDark);
    // Front windscreen
    bx([0.06, 1.3, 1.2], [-3.05, 6.1, -1.2], mats.glass);
    // Side windows
    bx([1.1, 1.2, 0.06], [-2.2, 6.1, -2.05], mats.glass);
    bx([0.8, 1.0, 0.06], [-1.6, 6.1, -2.05], mats.glass);
    // Cab base / platform
    bx([2.0, 0.15, 2.0], [-2.2, 4.82, -1.2], mats.yellowDark);

    // === DUMP BED — massive V-shaped tray (the dominant feature) ===
    var bedV = [];
    var bL = 8.5;   // length (increased)
    var bBw = 2.2;  // bottom half-width
    var bTw = 3.5;  // top half-width (wider flare)
    var bH = 3.8;   // height (taller)
    var bY0 = 3.1;  // bottom Y
    var bY1 = bY0 + bH; // top Y
    var bX0 = -0.8; // front X
    var bX1 = bX0 + bL; // back X

    var BFL = [bX0, bY0, -bBw], BFR = [bX0, bY0, bBw];
    var BBL = [bX1, bY0 - 0.1, -bBw * 0.9], BBR = [bX1, bY0 - 0.1, bBw * 0.9];
    var TFL = [bX0 - 0.5, bY1, -bTw], TFR = [bX0 - 0.5, bY1, bTw];
    var TBL = [bX1 + 0.4, bY1 - 0.4, -bTw * 0.82], TBR = [bX1 + 0.4, bY1 - 0.4, bTw * 0.82];

    // All walls + floor
    quad(BFL, BBL, TBL, TFL, bedV);
    quad(BBR, BFR, TFR, TBR, bedV);
    quad(BBL, BBR, TBR, TBL, bedV);
    quad(BFR, BFL, TFL, TFR, bedV);
    quad(BFL, BFR, BBR, BBL, bedV);
    panel(bedV, mats.yellow);

    // Inner shadow (dark floor inside tray)
    var innerV = [];
    quad(
        [bX0 + 0.3, bY1 - 0.3, -bTw + 0.4],
        [bX1 - 0.3, bY1 - 0.6, -bTw * 0.7],
        [bX1 - 0.3, bY1 - 0.6, bTw * 0.7],
        [bX0 + 0.3, bY1 - 0.3, bTw - 0.4],
        innerV
    );
    panel(innerV, mats.black);

    // Top lip / heavy rail — custom geometry following exact tray edge vertices
    var lipH = 0.22;
    var lipW = 0.16;
    var lipVerts = [];
    // Left side rail: TFL to TBL (top face + outer face)
    var LF_i = [TFL[0], TFL[1], TFL[2] + lipW];
    var LF_o = [TFL[0], TFL[1], TFL[2] - lipW];
    var LF_it = [TFL[0], TFL[1] + lipH, TFL[2] + lipW];
    var LF_ot = [TFL[0], TFL[1] + lipH, TFL[2] - lipW];
    var LB_i = [TBL[0], TBL[1], TBL[2] + lipW];
    var LB_o = [TBL[0], TBL[1], TBL[2] - lipW];
    var LB_it = [TBL[0], TBL[1] + lipH, TBL[2] + lipW];
    var LB_ot = [TBL[0], TBL[1] + lipH, TBL[2] - lipW];
    quad(LF_ot, LB_ot, LB_it, LF_it, lipVerts); // top
    quad(LF_o, LB_o, LB_ot, LF_ot, lipVerts);   // outer face
    quad(LB_i, LF_i, LF_it, LB_it, lipVerts);   // inner face
    quad(LF_it, LB_it, LB_ot, LF_ot, lipVerts); // top redundant removed
    // Right side rail: TFR to TBR
    var RF_i = [TFR[0], TFR[1], TFR[2] - lipW];
    var RF_o = [TFR[0], TFR[1], TFR[2] + lipW];
    var RF_it = [TFR[0], TFR[1] + lipH, TFR[2] - lipW];
    var RF_ot = [TFR[0], TFR[1] + lipH, TFR[2] + lipW];
    var RB_i = [TBR[0], TBR[1], TBR[2] - lipW];
    var RB_o = [TBR[0], TBR[1], TBR[2] + lipW];
    var RB_it = [TBR[0], TBR[1] + lipH, TBR[2] - lipW];
    var RB_ot = [TBR[0], TBR[1] + lipH, TBR[2] + lipW];
    quad(RF_it, RB_it, RB_ot, RF_ot, lipVerts); // top
    quad(RF_ot, RB_ot, RB_o, RF_o, lipVerts);   // outer face
    quad(RF_i, RB_i, RB_it, RF_it, lipVerts);   // inner face
    // Front cross-bar: TFL to TFR
    var FF_l = [TFL[0], TFL[1], TFL[2]];
    var FF_r = [TFR[0], TFR[1], TFR[2]];
    var FF_lt = [TFL[0], TFL[1] + lipH, TFL[2]];
    var FF_rt = [TFR[0], TFR[1] + lipH, TFR[2]];
    var FF_lb = [TFL[0] + lipW, TFL[1], TFL[2]];
    var FF_rb = [TFR[0] + lipW, TFR[1], TFR[2]];
    var FF_lbt = [TFL[0] + lipW, TFL[1] + lipH, TFL[2]];
    var FF_rbt = [TFR[0] + lipW, TFR[1] + lipH, TFR[2]];
    quad(FF_lt, FF_rt, FF_rbt, FF_lbt, lipVerts); // top
    quad(FF_l, FF_r, FF_rt, FF_lt, lipVerts);     // front face
    // Rear cross-bar: TBL to TBR
    var RR_l = [TBL[0], TBL[1], TBL[2]];
    var RR_r = [TBR[0], TBR[1], TBR[2]];
    var RR_lt = [TBL[0], TBL[1] + lipH, TBL[2]];
    var RR_rt = [TBR[0], TBR[1] + lipH, TBR[2]];
    var RR_lb = [TBL[0] - lipW, TBL[1], TBL[2]];
    var RR_rb = [TBR[0] - lipW, TBR[1], TBR[2]];
    var RR_lbt = [TBL[0] - lipW, TBL[1] + lipH, TBL[2]];
    var RR_rbt = [TBR[0] - lipW, TBR[1] + lipH, TBR[2]];
    quad(RR_lbt, RR_rbt, RR_rt, RR_lt, lipVerts); // top
    quad(RR_lt, RR_rt, RR_r, RR_l, lipVerts);     // rear face
    panel(lipVerts, mats.yellowDark);

    // Vertical ribs on tray sides (structural stiffeners)
    for (var ri = 0; ri < 6; ri++) {
        var rx = bX0 + 0.8 + ri * (bL - 1.2) / 5;
        bx([0.14, bH * 0.7, 0.12], [rx, bY0 + bH * 0.45, -bTw * 0.72], mats.yellowDark, [0, 0, -0.1]);
        bx([0.14, bH * 0.7, 0.12], [rx, bY0 + bH * 0.45, bTw * 0.72], mats.yellowDark, [0, 0, -0.1]);
    }

    // Horizontal stiffener band mid-height on tray
    bx([bL * 0.85, 0.15, 0.1], [bX0 + bL * 0.48, bY0 + bH * 0.45, -bTw * 0.74], mats.yellowDark);
    bx([bL * 0.85, 0.15, 0.1], [bX0 + bL * 0.48, bY0 + bH * 0.45, bTw * 0.74], mats.yellowDark);

    // === FRONT PLATFORMS / WALKWAYS (like 830E reference) ===
    // Lower platform (mid-height landing around the radiator area)
    bx([3.0, 0.12, 4.2], [-3.5, 3.5, 0], mats.yellowDark);
    // Upper platform (cab level, full width)
    bx([3.2, 0.12, 4.4], [-3.3, 4.85, 0], mats.yellowDark);
    // Platform extension on far side
    bx([1.5, 0.12, 0.8], [-4.0, 4.85, 2.6], mats.yellowDark);
    bx([1.5, 0.12, 0.8], [-4.0, 3.5, 2.6], mats.yellowDark);

    // Staircases removed — repositioned to rear of truck (behind cab, clear of wheels)
    // Ladder on near side (vertical, attached to platform edge, clear of wheels)
    var ladderZ = -2.4;
    var ladderX = -2.0;
    for (var li = 0; li < 8; li++) {
        var ly = 1.8 + li * 0.4;
        bx([0.06, 0.06, 0.45], [ladderX, ly, ladderZ], mats.darkMetal);
    }
    bx([0.06, 2.8, 0.06], [ladderX, 2.9, ladderZ - 0.2], mats.darkMetal);
    bx([0.06, 2.8, 0.06], [ladderX, 2.9, ladderZ + 0.2], mats.darkMetal);

    // === SAFETY RAILINGS around platforms ===
    // Upper platform - near side railing
    bx([3.4, 0.06, 0.06], [-3.3, 5.75, -2.5], mats.darkMetal);
    bx([3.4, 0.06, 0.06], [-3.3, 5.35, -2.5], mats.darkMetal);
    for (var upi = 0; upi < 6; upi++) {
        bx([0.06, 0.9, 0.06], [-4.8 + upi * 0.68, 5.3, -2.5], mats.darkMetal);
    }
    // Upper platform - far side railing
    bx([3.4, 0.06, 0.06], [-3.3, 5.75, 2.5], mats.darkMetal);
    bx([3.4, 0.06, 0.06], [-3.3, 5.35, 2.5], mats.darkMetal);
    for (var upi2 = 0; upi2 < 6; upi2++) {
        bx([0.06, 0.9, 0.06], [-4.8 + upi2 * 0.68, 5.3, 2.5], mats.darkMetal);
    }
    // Upper platform - front railing
    bx([0.06, 0.06, 5.0], [-4.9, 5.75, 0], mats.darkMetal);
    bx([0.06, 0.06, 5.0], [-4.9, 5.35, 0], mats.darkMetal);

    // Lower platform - near side railing
    bx([3.2, 0.06, 0.06], [-3.5, 4.35, -2.4], mats.darkMetal);
    bx([3.2, 0.06, 0.06], [-3.5, 4.0, -2.4], mats.darkMetal);
    for (var lpi = 0; lpi < 5; lpi++) {
        bx([0.06, 0.8, 0.06], [-4.9 + lpi * 0.75, 3.9, -2.4], mats.darkMetal);
    }
    // Lower platform - far side railing
    bx([3.2, 0.06, 0.06], [-3.5, 4.35, 2.4], mats.darkMetal);
    bx([3.2, 0.06, 0.06], [-3.5, 4.0, 2.4], mats.darkMetal);
    for (var lpi2 = 0; lpi2 < 5; lpi2++) {
        bx([0.06, 0.8, 0.06], [-4.9 + lpi2 * 0.75, 3.9, 2.4], mats.darkMetal);
    }
    // Lower platform - front railing
    bx([0.06, 0.06, 4.8], [-5.0, 4.35, 0], mats.darkMetal);
    bx([0.06, 0.06, 4.8], [-5.0, 4.0, 0], mats.darkMetal);

    // === HEADLIGHTS ===
    cy(0.2, 0.2, 0.1, [-4.35, 4.6, -1.0], mats.light, [0, 0, Math.PI/2], 8);
    cy(0.2, 0.2, 0.1, [-4.35, 4.6, 1.0], mats.light, [0, 0, Math.PI/2], 8);
    cy(0.12, 0.12, 0.08, [-4.35, 3.6, -0.7], mats.light, [0, 0, Math.PI/2], 8);
    cy(0.12, 0.12, 0.08, [-4.35, 3.6, 0.7], mats.light, [0, 0, Math.PI/2], 8);

    // === EXHAUST ===
    cy(0.12, 0.14, 2.0, [-0.3, 6.0, 1.5], mats.black, [0, 0, 0], 8);
    cy(0.18, 0.18, 0.15, [-0.3, 7.05, 1.5], mats.accent, [0, 0, 0], 8);

    // === WHEEL ARCHES / FENDERS ===
    bx([2.0, 0.2, 0.5], [-3.8, 3.6, -2.0], mats.yellowDark);
    bx([2.0, 0.2, 0.5], [-3.8, 3.6, 2.0], mats.yellowDark);
    bx([3.0, 0.25, 0.5], [2.6, 4.0, -2.2], mats.yellowDark);
    bx([3.0, 0.25, 0.5], [2.6, 4.0, 2.2], mats.yellowDark);

    // === STRUCTURAL CHASSIS BEAMS (visible between wheels) ===
    bx([6.0, 0.35, 0.3], [0, 2.0, -1.2], mats.darkMetal);
    bx([6.0, 0.35, 0.3], [0, 2.0, 1.2], mats.darkMetal);
    // Cross-members
    bx([0.3, 0.3, 2.4], [-2.0, 2.0, 0], mats.darkMetal);
    bx([0.3, 0.3, 2.4], [1.5, 2.0, 0], mats.darkMetal);
    bx([0.3, 0.3, 2.4], [4.0, 2.0, 0], mats.darkMetal);

    // === ENGINE SIDE PANELS (fill the gap between cab and grille) ===
    bx([1.8, 2.0, 0.15], [-3.5, 4.3, -1.9], mats.yellow);
    bx([1.8, 2.0, 0.15], [-3.5, 4.3, 1.9], mats.yellow);
    // Engine access panel detail
    bx([1.4, 0.8, 0.04], [-3.5, 4.0, -1.95], mats.yellowDark);
    bx([1.4, 0.8, 0.04], [-3.5, 4.0, 1.95], mats.yellowDark);
    // Louvres / vents on engine sides
    for (var vi = 0; vi < 4; vi++) {
        bx([0.25, 0.04, 0.05], [-4.0 + vi * 0.35, 4.6, -1.95], mats.darkMetal);
        bx([0.25, 0.04, 0.05], [-4.0 + vi * 0.35, 4.6, 1.95], mats.darkMetal);
    }

    // === REAR TAILGATE BAR ===
    bx([0.2, 0.35, bTw * 1.7], [bX1 + 0.5, bY1 - 0.5, 0], mats.yellowDark);
    // Tailgate hinge cylinders
    cy(0.08, 0.08, 0.4, [bX1 + 0.5, bY1 - 0.8, -bTw * 0.6], mats.darkMetal, [Math.PI/2, 0, 0], 8);
    cy(0.08, 0.08, 0.4, [bX1 + 0.5, bY1 - 0.8, bTw * 0.6], mats.darkMetal, [Math.PI/2, 0, 0], 8);

    // === HYDRAULIC RAM (tray lift cylinder, visible between cab and tray) ===
    cy(0.12, 0.1, 2.8, [-0.4, 4.5, 0], mats.darkMetal, [0, 0, -0.25], 8);
    cy(0.08, 0.06, 1.8, [-0.4, 5.8, -0.1], mats.darkMetal, [0, 0, -0.2], 8);

    // Position truck in scene
    truck.scale.setScalar(0.38);
    truck.position.set(1.5, -1.0, 0);
    truck.rotation.y = -0.6 + Math.PI;
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
    grid.position.y = -1.5;
    scene.add(grid);

    camera.position.set(4, 2.5, 8.5);
    camera.lookAt(0, 0.8, 0);

    // ─── Scroll-Driven Camera + Truck Rotation ─────────────────
    let targetRotY = -0.6 + Math.PI;
    let targetRotX = 0;
    let targetCamY = 2.5;
    let targetCamX = 4;
    let truckMouseX = 0, truckMouseY = 0;

    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
            const p = self.progress;
            targetRotY = -0.6 + Math.PI + (p * Math.PI * 0.85);
            targetRotX = Math.sin(p * Math.PI) * 0.04;
            targetCamY = 2.5 - p * 1.0;
            targetCamX = 4 + p * 0.5;
        }
    });

    document.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        truckMouseX = ny * 0.06;
        truckMouseY = nx * 0.1;
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
        truck.position.y = -1.0 + Math.sin(sceneTime * 0.7) * 0.03;

        for (var wi = 0; wi < wheelGroups.length; wi++) {
            wheelGroups[wi].rotation.y += 0.008;
        }

        camera.position.y += (targetCamY - camera.position.y) * 0.04;
        camera.position.x += (targetCamX - camera.position.x) * 0.04;
        camera.lookAt(0, 0.8, 0);

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
        });
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

    // Enquiry form (FormSubmit.co)
    // First submission triggers activation — let it POST normally.
    // After activation, AJAX works. We detect activation status via localStorage.
    var enquiryForm = document.getElementById('enquiry-form');
    var formStatus = document.getElementById('form-status');
    if (enquiryForm) {
        var formActivated = localStorage.getItem('formsubmit-activated');

        if (formActivated) {
            enquiryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var btn = enquiryForm.querySelector('.form-submit');
                btn.disabled = true;
                btn.querySelector('span').textContent = 'Sending...';
                formStatus.className = 'form-status';
                formStatus.textContent = '';

                var formData = new FormData(enquiryForm);

                fetch(enquiryForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                }).then(function(response) {
                    if (response.ok) {
                        formStatus.className = 'form-status success';
                        formStatus.textContent = 'Thank you! Your enquiry has been sent successfully.';
                        enquiryForm.reset();
                    } else {
                        throw new Error('Send failed');
                    }
                }).catch(function() {
                    formStatus.className = 'form-status error';
                    formStatus.textContent = 'Something went wrong. Please try again or email us directly.';
                }).finally(function() {
                    btn.disabled = false;
                    btn.querySelector('span').textContent = 'Send Enquiry';
                });
            });
        }
        // If not activated, form submits normally (redirects to FormSubmit activation page)
    }

})();
