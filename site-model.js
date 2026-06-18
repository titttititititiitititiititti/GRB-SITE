/* ======================================================
   GRB Mining — 3D Site Model (Facility Layout)
   Three.js interactive site plan with scroll-driven camera
====================================================== */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // STAGE 1 — SITE DATA MODEL
    // All dimensions in metres. Coordinate system:
    //   X = along long axis (NW=0 to SE=700)
    //   Z = across width (SW/Highway=0 to NE/Rail=180)
    //   Y = height (up)
    // The property runs at ~45 degrees to cardinal north.
    // ═══════════════════════════════════════════════════════════════

    var SITE_PLAN = {
        units: 'metres',

        // Property boundary — parallelogram with slight skew
        // Points ordered clockwise from NW corner
        boundary: [
            [0, 20],       // NW corner (offset from highway)
            [680, 0],      // NE corner (slight skew toward highway at SE end)
            [700, 160],    // SE corner
            [20, 180]      // SW corner
        ],

        // Bruce Highway — runs along the SW edge (low Z values)
        highway: {
            name: 'Bruce Highway',
            // Centerline polyline (simplified)
            centerLine: [[-30, -5], [730, -25]],
            width: 22
        },

        // Rail corridor — runs along the NE edge (high Z values)
        rail: {
            name: 'Rail Corridor',
            centerLine: [[-20, 192], [720, 172]],
            width: 6
        },

        // Three sheds with real dimensions
        sheds: [
            {
                id: 'shed-small',
                name: 'Storage Shed',
                // position = center of footprint [x, y, z]
                position: [420, 0, 95],
                // size = [width(X), height(Y), depth(Z)]
                size: [12, 5, 12],
                rotationY: 0.05
            },
            {
                id: 'shed-main',
                name: 'Main Workshop',
                position: [530, 0, 120],
                size: [75, 18, 18],
                rotationY: 0.05
            },
            {
                id: 'shed-perp',
                name: 'Equipment Bay',
                position: [620, 0, 70],
                size: [25, 5, 10],
                rotationY: 0.05
            }
        ],

        // Concrete hardstand / laydown areas
        hardstands: [
            {
                id: 'hs-main',
                name: 'Main Hardstand',
                points: [[440, 60], [600, 55], [600, 155], [440, 160]]
            },
            {
                id: 'hs-south',
                name: 'Southern Pad',
                points: [[580, 40], [690, 35], [690, 145], [580, 150]]
            }
        ],

        // Vegetation/scrub zone (NW two-thirds of property)
        vegetation: {
            zone: [[5, 25], [430, 15], [430, 170], [5, 175]],
            density: 120
        },

        // Site entry points (gates)
        entries: [
            { position: [350, 85], label: 'Entry A' },
            { position: [560, 65], label: 'Entry B' }
        ]
    };

    // ═══════════════════════════════════════════════════════════════
    // STAGE 2 — 2D DEBUG VIEW
    // Toggled via ?debug=site in URL
    // ═══════════════════════════════════════════════════════════════

    function buildDebugView() {
        if (window.location.search.indexOf('debug=site') === -1) return;

        var scale = 0.8;
        var padX = 60, padZ = 40;
        var svgW = 700 * scale + padX * 2;
        var svgH = 200 * scale + padZ * 2;

        function tx(x) { return x * scale + padX; }
        function tz(z) { return z * scale + padZ; }
        function polyStr(pts) {
            return pts.map(function(p) { return tx(p[0]) + ',' + tz(p[1]); }).join(' ');
        }

        var svg = '<svg width="' + svgW + '" height="' + svgH + '" xmlns="http://www.w3.org/2000/svg" style="background:#111">';

        // Highway
        var hw = SITE_PLAN.highway;
        svg += '<line x1="' + tx(hw.centerLine[0][0]) + '" y1="' + tz(hw.centerLine[0][1]) + '" x2="' + tx(hw.centerLine[1][0]) + '" y2="' + tz(hw.centerLine[1][1]) + '" stroke="#444" stroke-width="' + (hw.width * scale) + '" stroke-linecap="round"/>';
        svg += '<text x="' + tx(350) + '" y="' + tz(-8) + '" fill="#666" font-size="10" text-anchor="middle">BRUCE HIGHWAY</text>';

        // Rail
        var rl = SITE_PLAN.rail;
        svg += '<line x1="' + tx(rl.centerLine[0][0]) + '" y1="' + tz(rl.centerLine[0][1]) + '" x2="' + tx(rl.centerLine[1][0]) + '" y2="' + tz(rl.centerLine[1][1]) + '" stroke="#6b3e1a" stroke-width="' + (rl.width * scale) + '"/>';
        svg += '<text x="' + tx(350) + '" y="' + tz(195) + '" fill="#6b3e1a" font-size="10" text-anchor="middle">RAIL CORRIDOR</text>';

        // Vegetation
        svg += '<polygon points="' + polyStr(SITE_PLAN.vegetation.zone) + '" fill="rgba(30,90,30,0.3)" stroke="rgba(30,90,30,0.6)" stroke-width="1"/>';

        // Hardstands
        SITE_PLAN.hardstands.forEach(function(hs) {
            svg += '<polygon points="' + polyStr(hs.points) + '" fill="rgba(200,60,60,0.25)" stroke="rgba(200,60,60,0.7)" stroke-width="1"/>';
            var cx = hs.points.reduce(function(s, p) { return s + p[0]; }, 0) / hs.points.length;
            var cz = hs.points.reduce(function(s, p) { return s + p[1]; }, 0) / hs.points.length;
            svg += '<text x="' + tx(cx) + '" y="' + tz(cz) + '" fill="#c44" font-size="8" text-anchor="middle">' + hs.name + '</text>';
        });

        // Boundary
        svg += '<polygon points="' + polyStr(SITE_PLAN.boundary) + '" fill="none" stroke="#f0f" stroke-width="2" stroke-dasharray="6,3"/>';

        // Sheds
        SITE_PLAN.sheds.forEach(function(shed) {
            var x = shed.position[0] - shed.size[0] / 2;
            var z = shed.position[2] - shed.size[2] / 2;
            svg += '<rect x="' + tx(x) + '" y="' + tz(z) + '" width="' + (shed.size[0] * scale) + '" height="' + (shed.size[2] * scale) + '" fill="rgba(50,80,200,0.5)" stroke="rgba(50,80,200,0.9)" stroke-width="1.5"/>';
            svg += '<text x="' + tx(shed.position[0]) + '" y="' + tz(shed.position[2]) + '" fill="#8af" font-size="7" text-anchor="middle" dominant-baseline="middle">' + shed.name + ' (' + shed.size[0] + 'x' + shed.size[2] + 'm)</text>';
        });

        // Entries
        SITE_PLAN.entries.forEach(function(e) {
            svg += '<circle cx="' + tx(e.position[0]) + '" cy="' + tz(e.position[1]) + '" r="4" fill="#ff0" stroke="#aa0" stroke-width="1"/>';
            svg += '<text x="' + tx(e.position[0] + 8) + '" y="' + tz(e.position[1]) + '" fill="#ff0" font-size="7">' + e.label + '</text>';
        });

        // Scale bar
        var sbX = tx(600), sbY = tz(180);
        svg += '<line x1="' + sbX + '" y1="' + sbY + '" x2="' + (sbX + 100 * scale) + '" y2="' + sbY + '" stroke="#fff" stroke-width="1.5"/>';
        svg += '<text x="' + sbX + '" y="' + (sbY + 12) + '" fill="#fff" font-size="9">0</text>';
        svg += '<text x="' + (sbX + 50 * scale) + '" y="' + (sbY + 12) + '" fill="#fff" font-size="9" text-anchor="middle">50m</text>';
        svg += '<text x="' + (sbX + 100 * scale) + '" y="' + (sbY + 12) + '" fill="#fff" font-size="9" text-anchor="end">100m</text>';

        svg += '</svg>';

        var debugDiv = document.createElement('div');
        debugDiv.id = 'site-debug';
        debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;border:1px solid #333;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.8);';
        debugDiv.innerHTML = '<div style="padding:6px 12px;background:#222;color:#0f0;font:11px monospace;">SITE PLAN DEBUG — coordinates in metres</div>' + svg;
        document.body.appendChild(debugDiv);
    }

    // ═══════════════════════════════════════════════════════════════
    // STAGE 3 + 4 + 5 + 6 + 7 — 3D SCENE (combined)
    // ═══════════════════════════════════════════════════════════════

    function initSiteModel() {
        var container = document.getElementById('site-model-canvas');
        if (!container) return;

        var isMobile = window.innerWidth <= 768;

        // Scene setup
        var scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0008);

        var camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 2000);
        camera.position.set(350, 400, -100);
        camera.lookAt(450, 0, 90);

        var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        renderer.setClearColor(0x0a0a0f, 1);
        renderer.shadowMap.enabled = !isMobile;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // ─── Lighting ─────────────────────────────────────────────
        var ambient = new THREE.AmbientLight(0x1a2030, 0.6);
        scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xffeedd, 0.8);
        sun.position.set(200, 300, -100);
        sun.castShadow = !isMobile;
        if (sun.castShadow) {
            sun.shadow.mapSize.set(1024, 1024);
            sun.shadow.camera.left = -400;
            sun.shadow.camera.right = 400;
            sun.shadow.camera.top = 200;
            sun.shadow.camera.bottom = -200;
            sun.shadow.camera.far = 800;
        }
        scene.add(sun);

        var fillLight = new THREE.DirectionalLight(0x038184, 0.3);
        fillLight.position.set(-100, 100, 200);
        scene.add(fillLight);

        // ─── Ground Plane ─────────────────────────────────────────
        var groundGeo = new THREE.PlaneGeometry(900, 300);
        var groundMat = new THREE.MeshStandardMaterial({
            color: 0x1a1e14,
            roughness: 0.95,
            metalness: 0.0
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(350, -0.5, 90);
        ground.receiveShadow = true;
        scene.add(ground);

        // ─── Property Boundary (glowing cyan line) ────────────────
        var boundaryPts = SITE_PLAN.boundary.map(function(p) {
            return new THREE.Vector3(p[0], 0.5, p[1]);
        });
        boundaryPts.push(boundaryPts[0].clone());

        var boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPts);
        var boundaryMat = new THREE.LineBasicMaterial({
            color: 0x038184,
            linewidth: 2
        });
        var boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
        scene.add(boundaryLine);

        // Glowing boundary tube for visual impact
        var boundaryCurve = new THREE.CatmullRomCurve3(boundaryPts, false);
        var tubeGeo = new THREE.TubeGeometry(boundaryCurve, 80, 0.8, 6, false);
        var tubeMat = new THREE.MeshBasicMaterial({
            color: 0x038184,
            transparent: true,
            opacity: 0.6
        });
        var boundaryTube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(boundaryTube);

        // ─── Highway ──────────────────────────────────────────────
        var hwData = SITE_PLAN.highway;
        var hwGeo = new THREE.PlaneGeometry(760, hwData.width);
        var hwMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2e,
            roughness: 0.85,
            metalness: 0.05
        });
        var highway = new THREE.Mesh(hwGeo, hwMat);
        highway.rotation.x = -Math.PI / 2;
        highway.rotation.z = Math.atan2(
            hwData.centerLine[1][1] - hwData.centerLine[0][1],
            hwData.centerLine[1][0] - hwData.centerLine[0][0]
        );
        highway.position.set(350, -0.3, -15);
        highway.receiveShadow = true;
        scene.add(highway);

        // Highway center line markings
        var clGeo = new THREE.PlaneGeometry(740, 0.5);
        var clMat = new THREE.MeshBasicMaterial({ color: 0xffff88 });
        var centerLine = new THREE.Mesh(clGeo, clMat);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(350, -0.1, -15);
        scene.add(centerLine);

        // ─── Rail Corridor ────────────────────────────────────────
        var rlData = SITE_PLAN.rail;
        var rlGeo = new THREE.PlaneGeometry(760, rlData.width);
        var rlMat = new THREE.MeshStandardMaterial({
            color: 0x3d2816,
            roughness: 0.9,
            metalness: 0.2
        });
        var rail = new THREE.Mesh(rlGeo, rlMat);
        rail.rotation.x = -Math.PI / 2;
        rail.position.set(350, -0.3, 182);
        rail.receiveShadow = true;
        scene.add(rail);

        // Rail tracks (two parallel lines)
        for (var ri = -1; ri <= 1; ri += 2) {
            var trackGeo = new THREE.PlaneGeometry(740, 0.3);
            var trackMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
            var track = new THREE.Mesh(trackGeo, trackMat);
            track.rotation.x = -Math.PI / 2;
            track.position.set(350, -0.1, 182 + ri * 1.5);
            scene.add(track);
        }

        // ─── Hardstand Areas ──────────────────────────────────────
        var hsMat = new THREE.MeshStandardMaterial({
            color: 0x4a4a50,
            roughness: 0.75,
            metalness: 0.1
        });

        SITE_PLAN.hardstands.forEach(function(hs) {
            var shape = new THREE.Shape();
            shape.moveTo(hs.points[0][0], hs.points[0][1]);
            for (var i = 1; i < hs.points.length; i++) {
                shape.lineTo(hs.points[i][0], hs.points[i][1]);
            }
            shape.closePath();

            var extGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
            var hsMesh = new THREE.Mesh(extGeo, hsMat);
            hsMesh.rotation.x = -Math.PI / 2;
            hsMesh.position.y = 0;
            hsMesh.receiveShadow = true;
            scene.add(hsMesh);
        });

        // ─── Sheds ───────────────────────────────────────────────
        var shedBodyMat = new THREE.MeshStandardMaterial({
            color: 0x1a2030,
            roughness: 0.6,
            metalness: 0.3
        });
        var shedRoofMat = new THREE.MeshStandardMaterial({
            color: 0x252e3a,
            roughness: 0.5,
            metalness: 0.4
        });

        SITE_PLAN.sheds.forEach(function(shed) {
            var group = new THREE.Group();

            // Main body
            var bodyGeo = new THREE.BoxGeometry(shed.size[0], shed.size[1] * 0.85, shed.size[2]);
            var body = new THREE.Mesh(bodyGeo, shedBodyMat);
            body.position.y = shed.size[1] * 0.425;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // Roof (slightly wider)
            var roofGeo = new THREE.BoxGeometry(shed.size[0] + 1, shed.size[1] * 0.15, shed.size[2] + 1);
            var roof = new THREE.Mesh(roofGeo, shedRoofMat);
            roof.position.y = shed.size[1] * 0.925;
            roof.castShadow = true;
            group.add(roof);

            // Roller door indicators (front face)
            var doorCount = Math.max(1, Math.floor(shed.size[2] / 6));
            var doorW = (shed.size[2] - 2) / doorCount - 1;
            var doorMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
            for (var d = 0; d < doorCount; d++) {
                var doorGeo = new THREE.PlaneGeometry(doorW, shed.size[1] * 0.65);
                var door = new THREE.Mesh(doorGeo, doorMat);
                var dz = -shed.size[2] / 2 + 1.5 + (doorW + 1) * d + doorW / 2;
                door.position.set(shed.size[0] / 2 + 0.05, shed.size[1] * 0.35, dz);
                door.rotation.y = Math.PI / 2;
                group.add(door);
            }

            group.position.set(shed.position[0], shed.position[1], shed.position[2]);
            group.rotation.y = shed.rotationY;
            scene.add(group);
        });

        // ─── Vegetation (Instanced Trees) ─────────────────────────
        var treeCount = isMobile ? 40 : SITE_PLAN.vegetation.density;
        var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 5);
        var canopyGeo = new THREE.ConeGeometry(3, 6, 6);
        var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2a1a, roughness: 0.9 });
        var canopyMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.85 });

        var vegZone = SITE_PLAN.vegetation.zone;
        var vegMinX = vegZone[0][0], vegMaxX = vegZone[1][0];
        var vegMinZ = vegZone[0][1], vegMaxZ = vegZone[2][1];

        for (var t = 0; t < treeCount; t++) {
            var tx = vegMinX + Math.random() * (vegMaxX - vegMinX);
            var tz = vegMinZ + Math.random() * (vegMaxZ - vegMinZ);
            var treeScale = 0.6 + Math.random() * 0.8;

            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(tx, 2 * treeScale, tz);
            trunk.scale.setScalar(treeScale);
            trunk.castShadow = !isMobile;
            scene.add(trunk);

            var canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(tx, (4 + 3) * treeScale, tz);
            canopy.scale.set(treeScale, treeScale * (0.7 + Math.random() * 0.6), treeScale);
            canopy.castShadow = !isMobile;
            scene.add(canopy);
        }

        // ─── Entry Points (small markers) ─────────────────────────
        var entryMat = new THREE.MeshBasicMaterial({ color: 0x038184 });
        SITE_PLAN.entries.forEach(function(entry) {
            var markerGeo = new THREE.CylinderGeometry(2, 2, 1, 8);
            var marker = new THREE.Mesh(markerGeo, entryMat);
            marker.position.set(entry.position[0], 0.5, entry.position[1]);
            scene.add(marker);
        });

        // ═══════════════════════════════════════════════════════════
        // STAGE 5 — SCROLL-DRIVEN CAMERA
        // ═══════════════════════════════════════════════════════════

        // Camera keyframes
        var camStart = { x: 350, y: 420, z: -120, lookX: 400, lookY: 0, lookZ: 90 };
        var camMid = { x: 480, y: 250, z: 20, lookX: 520, lookY: 0, lookZ: 100 };
        var camEnd = { x: 550, y: 150, z: 40, lookX: 550, lookY: 0, lookZ: 100 };

        var camProgress = { p: 0 };
        var lookTarget = new THREE.Vector3(camStart.lookX, camStart.lookY, camStart.lookZ);

        function lerpCam(a, b, t) {
            return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                z: a.z + (b.z - a.z) * t,
                lookX: a.lookX + (b.lookX - a.lookX) * t,
                lookY: a.lookY + (b.lookY - a.lookY) * t,
                lookZ: a.lookZ + (b.lookZ - a.lookZ) * t
            };
        }

        function updateCamera(progress) {
            var cam;
            if (progress < 0.5) {
                var t = progress * 2;
                cam = lerpCam(camStart, camMid, t);
            } else {
                var t2 = (progress - 0.5) * 2;
                cam = lerpCam(camMid, camEnd, t2);
            }
            camera.position.set(cam.x, cam.y, cam.z);
            lookTarget.set(cam.lookX, cam.lookY, cam.lookZ);
            camera.lookAt(lookTarget);
        }

        updateCamera(0);

        // GSAP ScrollTrigger integration
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !isMobile) {
            ScrollTrigger.create({
                trigger: '#site-model-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
                onUpdate: function(self) {
                    camProgress.p = self.progress;
                }
            });
        }

        // ═══════════════════════════════════════════════════════════
        // STAGE 7 — OPTIMISED RENDER LOOP
        // ═══════════════════════════════════════════════════════════

        var siteVisible = false;
        var siteObserver = new IntersectionObserver(function(entries) {
            siteVisible = entries[0].isIntersecting;
        }, { rootMargin: '200px' });
        siteObserver.observe(container);

        var siteFrame = 0;
        function animateSite() {
            requestAnimationFrame(animateSite);
            if (!siteVisible) return;
            siteFrame++;
            if (isMobile && siteFrame % 2 !== 0) return;

            updateCamera(camProgress.p);

            // Subtle boundary pulse
            var pulse = 0.4 + Math.sin(siteFrame * 0.02) * 0.2;
            tubeMat.opacity = pulse;

            renderer.render(scene, camera);
        }
        animateSite();

        // Resize handler
        window.addEventListener('resize', function() {
            var w = container.clientWidth;
            var h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════

    buildDebugView();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteModel);
    } else {
        initSiteModel();
    }

})();
