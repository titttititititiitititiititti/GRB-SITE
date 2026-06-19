/* ======================================================
   GRB Mining — 3D Site Model
   Satellite imagery base with interactive 3D overlays
====================================================== */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // COORDINATE MAPPING
    // The ChatGPT aerial image is used as ground texture.
    // We map positions as percentages of the image, then convert
    // to world coordinates on the ground plane.
    //
    // Image: ~1792x1024 → ground plane: 900 x 514 world units
    // Origin (0,0) = center of image
    // X: left=-450, right=+450
    // Z: top(far)=-257, bottom(near)=+257
    //
    // The property runs NW(top-left) to SE(bottom-right) at ~45°.
    // The developed area is in the bottom-right quadrant.
    // ═══════════════════════════════════════════════════════════════

    var PLANE_W = 900;
    var PLANE_H = 514;

    // Convert image percentage (0-1) to world XZ position
    function imgToWorld(pctX, pctZ) {
        return {
            x: (pctX - 0.5) * PLANE_W,
            z: (pctZ - 0.5) * PLANE_H
        };
    }

    // Property angle in the image (~45 degrees clockwise from horizontal)
    var PROP_ANGLE = -0.75; // radians, for rotating elements to align with property

    // ═══════════════════════════════════════════════════════════════
    // FACILITY ELEMENTS — positions mapped from layout.png
    // Percentages are approximate center positions in the aerial image
    // ═══════════════════════════════════════════════════════════════

    var SITE = {
        // Sheds (blue in layout.png)
        sheds: [
            { name: 'Storage Shed', pctX: 0.50, pctZ: 0.58, w: 14, d: 14, h: 6 },
            { name: 'Main Workshop', pctX: 0.58, pctZ: 0.56, w: 60, d: 14, h: 14 },
            { name: 'Equipment Bay', pctX: 0.63, pctZ: 0.52, w: 14, d: 40, h: 12 }
        ],

        // Hardstand areas (red in layout.png) - flat concrete
        hardstands: [
            { name: 'Laydown Yard', pctX: 0.47, pctZ: 0.52, w: 70, d: 70 },
            { name: 'Staging Area', pctX: 0.60, pctZ: 0.52, w: 80, d: 70 }
        ],

        // Entrances (white squares in layout.png)
        // Sit ON the cyan NE boundary line
        entrances: [
            { name: 'Main Gate', pctX: 0.36, pctZ: 0.35 },
            { name: 'Service Entry', pctX: 0.52, pctZ: 0.35 }
        ],

        // Mining vehicles on the hardstands
        vehicles: [
            { type: 'excavator', pctX: 0.44, pctZ: 0.50 },
            { type: 'truck', pctX: 0.46, pctZ: 0.54 },
            { type: 'truck', pctX: 0.49, pctZ: 0.52 },
            { type: 'dozer', pctX: 0.43, pctZ: 0.53 },
            { type: 'excavator', pctX: 0.58, pctZ: 0.50 },
            { type: 'truck', pctX: 0.61, pctZ: 0.49 },
            { type: 'dozer', pctX: 0.56, pctZ: 0.54 },
            { type: 'truck', pctX: 0.63, pctZ: 0.54 }
        ]
    };

    // ═══════════════════════════════════════════════════════════════
    // INIT 3D SCENE
    // ═══════════════════════════════════════════════════════════════

    function initSiteModel() {
        var container = document.getElementById('site-model-canvas');
        if (!container) return;

        var isMobile = window.innerWidth <= 768;
        var W = container.clientWidth;
        var H = container.clientHeight;

        // Scene
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080c10);

        // Camera — viewing from SE corner looking NW along the property
        var camera = new THREE.PerspectiveCamera(40, W / H, 1, 2000);
        camera.position.set(300, 250, 280);
        camera.lookAt(-50, 0, -30);

        // Renderer
        var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        renderer.shadowMap.enabled = !isMobile;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // ─── Drag Controls (OrbitControls) ────────────────────────
        var controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.07;
            controls.enableZoom = true;
            controls.minDistance = 150;
            controls.maxDistance = 700;
            controls.maxPolarAngle = Math.PI / 2.3;
            controls.minPolarAngle = 0.3;
            controls.target.set(-50, 0, -30);
            controls.enablePan = true;
            controls.panSpeed = 0.6;
            controls.rotateSpeed = 0.4;
            controls.zoomSpeed = 0.8;
            controls.update();
        }

        // ─── Lighting ─────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x4a5a6a, 0.7));

        var sun = new THREE.DirectionalLight(0xfff4e0, 0.9);
        sun.position.set(150, 350, -200);
        sun.castShadow = !isMobile;
        if (sun.castShadow) {
            sun.shadow.mapSize.set(2048, 2048);
            sun.shadow.camera.left = -500;
            sun.shadow.camera.right = 500;
            sun.shadow.camera.top = 300;
            sun.shadow.camera.bottom = -300;
            sun.shadow.camera.far = 900;
            sun.shadow.bias = -0.0005;
        }
        scene.add(sun);

        scene.add(new THREE.HemisphereLight(0x6688aa, 0x223322, 0.3));

        var accentLight = new THREE.PointLight(0x038184, 0.5, 400);
        accentLight.position.set(100, 50, 100);
        scene.add(accentLight);

        // ─── Ground Plane (Satellite Image) ──────────────────────
        var loader = new THREE.TextureLoader();
        var groundTex = loader.load('workshop_reference_images/background.png');
        groundTex.encoding = THREE.sRGBEncoding;
        groundTex.minFilter = THREE.LinearFilter;
        groundTex.magFilter = THREE.LinearFilter;

        var groundGeo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
        var groundMat = new THREE.MeshBasicMaterial({ map: groundTex });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        scene.add(ground);

        // ─── Hardstand Pads (semi-transparent concrete overlays) ──
        var concreteMat = new THREE.MeshStandardMaterial({
            color: 0x9a8a7a,
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.35
        });

        SITE.hardstands.forEach(function(hs) {
            var pos = imgToWorld(hs.pctX, hs.pctZ);
            var geo = new THREE.BoxGeometry(hs.w, 0.4, hs.d);
            var mesh = new THREE.Mesh(geo, concreteMat);
            mesh.position.set(pos.x, 0.2, pos.z);
            mesh.rotation.y = PROP_ANGLE;
            mesh.receiveShadow = true;
            scene.add(mesh);
        });

        // ─── Sheds ───────────────────────────────────────────────
        SITE.sheds.forEach(function(shed) {
            var pos = imgToWorld(shed.pctX, shed.pctZ);
            var group = new THREE.Group();

            // Walls
            var wallMat = new THREE.MeshStandardMaterial({
                color: 0x1a2535,
                roughness: 0.45,
                metalness: 0.4,
                emissive: 0x0a1520,
                emissiveIntensity: 0.3
            });
            var wallGeo = new THREE.BoxGeometry(shed.w, shed.h, shed.d);
            var walls = new THREE.Mesh(wallGeo, wallMat);
            walls.position.y = shed.h / 2;
            walls.castShadow = true;
            walls.receiveShadow = true;
            group.add(walls);

            // Metallic roof
            var roofMat = new THREE.MeshStandardMaterial({
                color: 0x2a3a4a,
                roughness: 0.3,
                metalness: 0.6
            });
            var roofGeo = new THREE.BoxGeometry(shed.w + 1.5, 1, shed.d + 1.5);
            var roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = shed.h + 0.5;
            roof.castShadow = true;
            group.add(roof);

            // Subtle edge highlight
            var edgeMat = new THREE.LineBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.25 });
            var edges = new THREE.LineSegments(new THREE.EdgesGeometry(wallGeo), edgeMat);
            edges.position.y = shed.h / 2;
            group.add(edges);

            // Roller doors
            var doorCount = Math.max(1, Math.floor(Math.max(shed.w, shed.d) / 12));
            var doorFace = shed.w > shed.d ? 'front' : 'side';
            var doorMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
            for (var i = 0; i < doorCount; i++) {
                var dw, dh, dx, dz;
                dh = shed.h * 0.65;
                if (doorFace === 'front') {
                    dw = (shed.w * 0.6) / doorCount;
                    dx = -shed.w * 0.3 + (i + 0.5) * (shed.w * 0.6 / doorCount);
                    dz = shed.d / 2 + 0.1;
                    var doorGeo = new THREE.PlaneGeometry(dw, dh);
                    var door = new THREE.Mesh(doorGeo, doorMat);
                    door.position.set(dx, dh / 2 + 0.5, dz);
                    group.add(door);
                } else {
                    dw = (shed.d * 0.6) / doorCount;
                    dz = -shed.d * 0.3 + (i + 0.5) * (shed.d * 0.6 / doorCount);
                    dx = shed.w / 2 + 0.1;
                    var doorGeo2 = new THREE.PlaneGeometry(dw, dh);
                    var door2 = new THREE.Mesh(doorGeo2, doorMat);
                    door2.position.set(dx, dh / 2 + 0.5, dz);
                    door2.rotation.y = Math.PI / 2;
                    group.add(door2);
                }
            }

            group.position.set(pos.x, 0, pos.z);
            group.rotation.y = PROP_ANGLE;
            scene.add(group);
        });

        // ─── Mining Vehicles ──────────────────────────────────────
        SITE.vehicles.forEach(function(v) {
            var pos = imgToWorld(v.pctX, v.pctZ);
            var vGroup = new THREE.Group();
            var catYellow = 0xd4a020;
            var darkMetal = 0x1a1a1a;

            if (v.type === 'excavator') {
                var body = new THREE.Mesh(
                    new THREE.BoxGeometry(6, 3, 4),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 })
                );
                body.position.y = 2.5;
                body.castShadow = true;
                vGroup.add(body);
                for (var s = -1; s <= 1; s += 2) {
                    var trk = new THREE.Mesh(
                        new THREE.BoxGeometry(7, 1.5, 1.5),
                        new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.9 })
                    );
                    trk.position.set(0, 0.75, s * 2.2);
                    vGroup.add(trk);
                }
                var cab = new THREE.Mesh(
                    new THREE.BoxGeometry(2.5, 2.5, 2.5),
                    new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.3, metalness: 0.5 })
                );
                cab.position.set(-0.5, 5, 0);
                vGroup.add(cab);
            } else if (v.type === 'truck') {
                var tray = new THREE.Mesh(
                    new THREE.BoxGeometry(9, 3, 5),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 })
                );
                tray.position.set(1.5, 3, 0);
                tray.castShadow = true;
                vGroup.add(tray);
                var tcab = new THREE.Mesh(
                    new THREE.BoxGeometry(3.5, 3, 4),
                    new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.4, metalness: 0.4 })
                );
                tcab.position.set(-4, 3, 0);
                vGroup.add(tcab);
                var wheelGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
                var wheelMat = new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.9 });
                [[-3, -2.8], [-3, 2.8], [3, -2.8], [3, 2.8]].forEach(function(wp) {
                    var wh = new THREE.Mesh(wheelGeo, wheelMat);
                    wh.rotation.x = Math.PI / 2;
                    wh.position.set(wp[0], 1.5, wp[1]);
                    vGroup.add(wh);
                });
            } else {
                var dzBody = new THREE.Mesh(
                    new THREE.BoxGeometry(5.5, 2.5, 4),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 })
                );
                dzBody.position.y = 2;
                dzBody.castShadow = true;
                vGroup.add(dzBody);
                var blade = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 2.5, 5.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 })
                );
                blade.position.set(3.5, 1.2, 0);
                vGroup.add(blade);
                for (var ds = -1; ds <= 1; ds += 2) {
                    var dt = new THREE.Mesh(
                        new THREE.BoxGeometry(6, 1.2, 1.2),
                        new THREE.MeshStandardMaterial({ color: darkMetal, roughness: 0.9 })
                    );
                    dt.position.set(0, 0.6, ds * 2);
                    vGroup.add(dt);
                }
            }

            vGroup.position.set(pos.x, 0.5, pos.z);
            vGroup.rotation.y = PROP_ANGLE + (Math.random() - 0.5) * 0.6;
            vGroup.scale.setScalar(0.7);
            scene.add(vGroup);
        });

        // ─── Entrance Gates ──────────────────────────────────────
        SITE.entrances.forEach(function(gate) {
            var pos = imgToWorld(gate.pctX, gate.pctZ);
            var gGroup = new THREE.Group();

            // White posts
            var postMat = new THREE.MeshStandardMaterial({
                color: 0xe8e8e8,
                roughness: 0.3,
                metalness: 0.1,
                emissive: 0x038184,
                emissiveIntensity: 0.15
            });
            for (var p = -1; p <= 1; p += 2) {
                var post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 8), postMat);
                post.position.set(p * 5, 2.5, 0);
                post.castShadow = true;
                gGroup.add(post);
            }

            // Crossbar
            var bar = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 0.5), postMat);
            bar.position.y = 5;
            gGroup.add(bar);

            // Ground ring glow
            var ringGeo = new THREE.RingGeometry(6, 7, 32);
            var ringMat = new THREE.MeshBasicMaterial({
                color: 0x038184,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.3;
            gGroup.add(ring);

            gGroup.position.set(pos.x, 0, pos.z);
            gGroup.rotation.y = PROP_ANGLE;
            scene.add(gGroup);
        });

        // ─── Atmosphere ───────────────────────────────────────────
        if (!isMobile) {
            var dustCount = 150;
            var dustGeo = new THREE.BufferGeometry();
            var dustPos = new Float32Array(dustCount * 3);
            for (var i = 0; i < dustCount; i++) {
                dustPos[i * 3] = (Math.random() - 0.5) * 600;
                dustPos[i * 3 + 1] = Math.random() * 60 + 3;
                dustPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
            }
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
            var dustMat = new THREE.PointsMaterial({
                color: 0x038184,
                size: 1.0,
                transparent: true,
                opacity: 0.25
            });
            scene.add(new THREE.Points(dustGeo, dustMat));
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER LOOP
        // ═══════════════════════════════════════════════════════════

        var visible = false;
        var observer = new IntersectionObserver(function(entries) {
            visible = entries[0].isIntersecting;
        }, { rootMargin: '200px' });
        observer.observe(container);

        var frame = 0;
        function animate() {
            requestAnimationFrame(animate);
            if (!visible) return;
            frame++;
            if (isMobile && frame % 2 !== 0) return;

            if (controls) controls.update();
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
