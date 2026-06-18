/* ======================================================
   GRB Mining — 3D Site Model (Facility Layout)
   Three.js interactive site plan with satellite imagery base
====================================================== */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // SITE DATA MODEL
    // The property runs at ~45 degrees NW-SE.
    // We place the textured ground plane at this angle.
    // Coordinates: X across, Z along length, Y up.
    // Origin at center of property for simplicity.
    // ═══════════════════════════════════════════════════════════════

    var SITE = {
        // Property dimensions (metres)
        length: 700,
        width: 180,
        rotation: -0.78, // ~45 degrees to match aerial

        // Sheds (blue in layout.png) - positions relative to SE end
        sheds: [
            { id: 'shed-a', name: 'Equipment Bay', x: 80, z: 45, w: 60, d: 60, h: 12, color: 0x1a2a40 },
            { id: 'shed-b', name: 'Main Workshop', x: 150, z: 70, w: 80, d: 20, h: 14, color: 0x1a2a40 },
            { id: 'shed-c', name: 'Parts Store', x: 180, z: 30, w: 45, d: 18, h: 10, color: 0x1a2a40 },
            { id: 'shed-small', name: 'Storage', x: 100, z: 80, w: 12, d: 12, h: 5, color: 0x1a2a40 }
        ],

        // Concrete hardstand (red in layout.png) - flat paved areas
        hardstands: [
            { id: 'hs-north', name: 'Laydown Yard', x: 60, z: 70, w: 70, d: 70 },
            { id: 'hs-south', name: 'Staging Area', x: 150, z: 50, w: 100, d: 80 }
        ],

        // Entrances (white boxes in layout.png)
        entrances: [
            { id: 'gate-a', name: 'Main Gate', x: 250, z: 90 },
            { id: 'gate-b', name: 'Service Entry', x: 120, z: 10 }
        ],

        // Vehicle positions on hardstands
        vehicles: [
            { type: 'excavator', x: 50, z: 55, rot: 0.3 },
            { type: 'truck', x: 80, z: 60, rot: -0.5 },
            { type: 'truck', x: 110, z: 45, rot: 0.1 },
            { type: 'dozer', x: 45, z: 80, rot: 1.2 },
            { type: 'excavator', x: 160, z: 35, rot: -0.8 },
            { type: 'truck', x: 190, z: 55, rot: 0.4 },
            { type: 'dozer', x: 140, z: 75, rot: -0.2 }
        ]
    };

    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════

    function initSiteModel() {
        var container = document.getElementById('site-model-canvas');
        if (!container) return;

        var isMobile = window.innerWidth <= 768;
        var W = container.clientWidth;
        var H = container.clientHeight;

        // Scene
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e12);
        scene.fog = new THREE.FogExp2(0x0a0e12, 0.0004);

        // Camera — perspective from SE corner looking NW down the property
        var camera = new THREE.PerspectiveCamera(45, W / H, 1, 3000);
        camera.position.set(420, 180, 260);
        camera.lookAt(0, 0, -50);

        // Renderer
        var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        renderer.shadowMap.enabled = !isMobile;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);

        // ─── OrbitControls (drag to move) ─────────────────────────
        // Three.js r128 OrbitControls loaded inline since no module system
        var controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enableZoom = true;
            controls.minDistance = 100;
            controls.maxDistance = 800;
            controls.maxPolarAngle = Math.PI / 2.2;
            controls.minPolarAngle = 0.2;
            controls.target.set(0, 0, -50);
            controls.enablePan = true;
            controls.panSpeed = 0.8;
            controls.rotateSpeed = 0.5;
            controls.update();
        }

        // ─── Lighting ─────────────────────────────────────────────
        var ambient = new THREE.AmbientLight(0x3a4a5a, 0.8);
        scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xfff0dd, 1.0);
        sun.position.set(200, 400, -300);
        sun.castShadow = !isMobile;
        if (sun.castShadow) {
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.camera.left = -500;
            sun.shadow.camera.right = 500;
            sun.shadow.camera.top = 200;
            sun.shadow.camera.bottom = -200;
            sun.shadow.camera.far = 1000;
            sun.shadow.bias = -0.001;
        }
        scene.add(sun);

        var fillLight = new THREE.DirectionalLight(0x038184, 0.2);
        fillLight.position.set(-200, 100, 200);
        scene.add(fillLight);

        var hemi = new THREE.HemisphereLight(0x8899aa, 0x2a3a2a, 0.3);
        scene.add(hemi);

        // ─── Ground (satellite-textured plane) ────────────────────
        // Load the ChatGPT reference image as ground texture
        var textureLoader = new THREE.TextureLoader();
        var groundTex = textureLoader.load('workshop_reference_images/ChatGPT Image Jun 18, 2026, 05_58_44 PM.png');
        groundTex.encoding = THREE.sRGBEncoding;

        var groundGeo = new THREE.PlaneGeometry(SITE.length + 200, (SITE.length + 200) * 0.56); // match image aspect ratio ~16:9
        var groundMat = new THREE.MeshBasicMaterial({
            map: groundTex,
            side: THREE.FrontSide
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -1, 0);
        scene.add(ground);

        // Dark surrounding area beyond satellite image
        var outerGeo = new THREE.PlaneGeometry(2000, 2000);
        var outerMat = new THREE.MeshBasicMaterial({ color: 0x0a0e12 });
        var outerGround = new THREE.Mesh(outerGeo, outerMat);
        outerGround.rotation.x = -Math.PI / 2;
        outerGround.position.set(0, -1.5, 0);
        scene.add(outerGround);

        // ─── Facility Group (rotated to match aerial) ─────────────
        var facility = new THREE.Group();
        facility.rotation.y = SITE.rotation;
        facility.position.set(80, 0, 60);
        scene.add(facility);

        // ─── Hardstand Areas (flat concrete pads) ─────────────────
        var concreteMat = new THREE.MeshStandardMaterial({
            color: 0x8a7a6a,
            roughness: 0.85,
            metalness: 0.05,
            transparent: true,
            opacity: 0.7
        });

        SITE.hardstands.forEach(function(hs) {
            var hsGeo = new THREE.BoxGeometry(hs.w, 0.3, hs.d);
            var hsMesh = new THREE.Mesh(hsGeo, concreteMat);
            hsMesh.position.set(hs.x - SITE.length / 2, 0.15, hs.z - SITE.width / 2);
            hsMesh.receiveShadow = true;
            facility.add(hsMesh);
        });

        // ─── Sheds ───────────────────────────────────────────────
        SITE.sheds.forEach(function(shed) {
            var group = new THREE.Group();

            // Walls
            var wallMat = new THREE.MeshStandardMaterial({
                color: shed.color,
                roughness: 0.5,
                metalness: 0.4,
                emissive: 0x050a12,
                emissiveIntensity: 0.2
            });
            var wallGeo = new THREE.BoxGeometry(shed.w, shed.h, shed.d);
            var walls = new THREE.Mesh(wallGeo, wallMat);
            walls.position.y = shed.h / 2;
            walls.castShadow = true;
            walls.receiveShadow = true;
            group.add(walls);

            // Roof
            var roofMat = new THREE.MeshStandardMaterial({
                color: 0x2a3545,
                roughness: 0.4,
                metalness: 0.5
            });
            var roofGeo = new THREE.BoxGeometry(shed.w + 2, 0.8, shed.d + 2);
            var roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = shed.h + 0.4;
            roof.castShadow = true;
            group.add(roof);

            // Roller doors (front)
            var doorCount = Math.max(1, Math.floor(shed.w / 15));
            var doorMat = new THREE.MeshBasicMaterial({ color: 0x060810 });
            for (var d = 0; d < doorCount; d++) {
                var dw = (shed.w * 0.7) / doorCount;
                var doorGeo = new THREE.PlaneGeometry(dw, shed.h * 0.7);
                var door = new THREE.Mesh(doorGeo, doorMat);
                var dx = -shed.w * 0.35 + (d + 0.5) * (shed.w * 0.7 / doorCount);
                door.position.set(dx, shed.h * 0.38, shed.d / 2 + 0.1);
                group.add(door);
            }

            // Edge glow (accent)
            var edgeGeo = new THREE.EdgesGeometry(wallGeo);
            var edgeMat = new THREE.LineBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.3 });
            var edges = new THREE.LineSegments(edgeGeo, edgeMat);
            edges.position.y = shed.h / 2;
            group.add(edges);

            group.position.set(shed.x - SITE.length / 2, 0, shed.z - SITE.width / 2);
            facility.add(group);
        });

        // ─── Mining Vehicles (simple block representations) ───────
        var vehicleColors = {
            excavator: 0xd4a017,
            truck: 0xd4a017,
            dozer: 0xd4a017
        };

        SITE.vehicles.forEach(function(v) {
            var vGroup = new THREE.Group();

            if (v.type === 'excavator') {
                // Body
                var bodyGeo = new THREE.BoxGeometry(8, 4, 5);
                var bodyMat = new THREE.MeshStandardMaterial({ color: vehicleColors.excavator, roughness: 0.6, metalness: 0.3 });
                var body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 3;
                body.castShadow = true;
                vGroup.add(body);
                // Tracks
                var trackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
                for (var side = -1; side <= 1; side += 2) {
                    var tGeo = new THREE.BoxGeometry(10, 2, 2);
                    var track = new THREE.Mesh(tGeo, trackMat);
                    track.position.set(0, 1, side * 3);
                    track.castShadow = true;
                    vGroup.add(track);
                }
                // Cab
                var cabGeo = new THREE.BoxGeometry(3, 3, 3);
                var cabMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.3, metalness: 0.5 });
                var cab = new THREE.Mesh(cabGeo, cabMat);
                cab.position.set(-1, 6, 0);
                vGroup.add(cab);
            } else if (v.type === 'truck') {
                // Tray
                var trayGeo = new THREE.BoxGeometry(12, 4, 6);
                var trayMat = new THREE.MeshStandardMaterial({ color: vehicleColors.truck, roughness: 0.6, metalness: 0.3 });
                var tray = new THREE.Mesh(trayGeo, trayMat);
                tray.position.set(2, 4, 0);
                tray.castShadow = true;
                vGroup.add(tray);
                // Cab
                var tcGeo = new THREE.BoxGeometry(4, 4, 5);
                var tcMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.4, metalness: 0.4 });
                var tc = new THREE.Mesh(tcGeo, tcMat);
                tc.position.set(-5, 4, 0);
                vGroup.add(tc);
                // Wheels
                var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
                var wheelGeo = new THREE.CylinderGeometry(2, 2, 1.5, 8);
                for (var wx = -4; wx <= 4; wx += 4) {
                    for (var wz = -1; wz <= 1; wz += 2) {
                        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
                        wheel.rotation.x = Math.PI / 2;
                        wheel.position.set(wx, 2, wz * 3.5);
                        vGroup.add(wheel);
                    }
                }
            } else { // dozer
                var dzGeo = new THREE.BoxGeometry(7, 3, 5);
                var dzMat = new THREE.MeshStandardMaterial({ color: vehicleColors.dozer, roughness: 0.6, metalness: 0.3 });
                var dz = new THREE.Mesh(dzGeo, dzMat);
                dz.position.y = 2.5;
                dz.castShadow = true;
                vGroup.add(dz);
                // Blade
                var bladeGeo = new THREE.BoxGeometry(0.8, 3, 7);
                var bladeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 });
                var blade = new THREE.Mesh(bladeGeo, bladeMat);
                blade.position.set(4.5, 1.5, 0);
                vGroup.add(blade);
                // Tracks
                for (var ds = -1; ds <= 1; ds += 2) {
                    var dtGeo = new THREE.BoxGeometry(8, 1.8, 1.5);
                    var dt = new THREE.Mesh(dtGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
                    dt.position.set(0, 0.9, ds * 2.5);
                    vGroup.add(dt);
                }
            }

            vGroup.position.set(v.x - SITE.length / 2, 0, v.z - SITE.width / 2);
            vGroup.rotation.y = v.rot;
            vGroup.scale.setScalar(0.6);
            facility.add(vGroup);
        });

        // ─── Entrances (gate markers) ─────────────────────────────
        var gateMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0x038184,
            emissiveIntensity: 0.4
        });

        SITE.entrances.forEach(function(gate) {
            var gateGroup = new THREE.Group();

            // Gate posts
            for (var gs = -1; gs <= 1; gs += 2) {
                var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
                var post = new THREE.Mesh(postGeo, gateMat);
                post.position.set(gs * 4, 3, 0);
                post.castShadow = true;
                gateGroup.add(post);
            }

            // Crossbar
            var barGeo = new THREE.BoxGeometry(9, 0.6, 0.6);
            var bar = new THREE.Mesh(barGeo, gateMat);
            bar.position.y = 6;
            gateGroup.add(bar);

            // Ground marker (glowing ring)
            var ringGeo = new THREE.RingGeometry(5, 6, 24);
            var ringMat = new THREE.MeshBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.2;
            gateGroup.add(ring);

            gateGroup.position.set(gate.x - SITE.length / 2, 0, gate.z - SITE.width / 2);
            facility.add(gateGroup);
        });

        // ─── Glowing Boundary Outline ─────────────────────────────
        // A slightly elevated cyan perimeter line around the facility zone
        var bndPts = [
            new THREE.Vector3(-SITE.length / 2 - 5, 1, -SITE.width / 2 - 5),
            new THREE.Vector3(SITE.length / 2 + 5, 1, -SITE.width / 2 - 5),
            new THREE.Vector3(SITE.length / 2 + 5, 1, SITE.width / 2 + 5),
            new THREE.Vector3(-SITE.length / 2 - 5, 1, SITE.width / 2 + 5),
            new THREE.Vector3(-SITE.length / 2 - 5, 1, -SITE.width / 2 - 5)
        ];
        var bndGeo = new THREE.BufferGeometry().setFromPoints(bndPts);
        var bndMat = new THREE.LineBasicMaterial({ color: 0x038184, linewidth: 2 });
        var bndLine = new THREE.Line(bndGeo, bndMat);
        facility.add(bndLine);

        // Glowing boundary tubes
        var tubeCurve = new THREE.CatmullRomCurve3(bndPts, false);
        var tubeGeo = new THREE.TubeGeometry(tubeCurve, 100, 0.6, 4, false);
        var tubeMat = new THREE.MeshBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.5 });
        var tube = new THREE.Mesh(tubeGeo, tubeMat);
        facility.add(tube);

        // ─── Atmosphere Particles ─────────────────────────────────
        if (!isMobile) {
            var pCount = 200;
            var pGeo = new THREE.BufferGeometry();
            var pPos = new Float32Array(pCount * 3);
            for (var i = 0; i < pCount; i++) {
                pPos[i * 3] = (Math.random() - 0.5) * 800;
                pPos[i * 3 + 1] = Math.random() * 100 + 5;
                pPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
            }
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            var pMat = new THREE.PointsMaterial({ color: 0x038184, size: 1.2, transparent: true, opacity: 0.3 });
            var particles = new THREE.Points(pGeo, pMat);
            scene.add(particles);
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER LOOP + OPTIMISATION
        // ═══════════════════════════════════════════════════════════

        var siteVisible = false;
        var observer = new IntersectionObserver(function(entries) {
            siteVisible = entries[0].isIntersecting;
        }, { rootMargin: '200px' });
        observer.observe(container);

        var frame = 0;
        function animate() {
            requestAnimationFrame(animate);
            if (!siteVisible) return;
            frame++;
            if (isMobile && frame % 2 !== 0) return;

            if (controls) controls.update();

            // Pulse boundary
            tubeMat.opacity = 0.3 + Math.sin(frame * 0.025) * 0.15;

            renderer.render(scene, camera);
        }
        animate();

        // Resize
        window.addEventListener('resize', function() {
            var w = container.clientWidth;
            var h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteModel);
    } else {
        initSiteModel();
    }

})();
