/* ======================================================
   GRB Mining — 3D Site Model (Production)
====================================================== */

(function () {
    'use strict';

    var PLANE_W = 900;
    var PLANE_H = 514;

    function imgToWorld(pctX, pctZ) {
        return {
            x: (pctX - 0.5) * PLANE_W,
            z: (pctZ - 0.5) * PLANE_H
        };
    }

    var POSITIONS = {
        cluster1: { pctX: 0.503, pctZ: 0.656, angle: -0.8056 },
        cluster2: { pctX: 0.633, pctZ: 0.732, angle: -0.7611 },
        entrance1: { pctX: 0.622, pctZ: 0.567, angle: -0.6000 },
        entrance2: { pctX: 0.491, pctZ: 0.363, angle: -0.5056 }
    };

    function initSiteModel() {
        var container = document.getElementById('site-model-canvas');
        if (!container) return;

        var isMobile = window.innerWidth <= 768;
        var W = container.clientWidth;
        var H = container.clientHeight;

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080c10);

        var camera = new THREE.PerspectiveCamera(40, W / H, 1, 2000);
        camera.position.set(300, 250, 280);
        camera.lookAt(-50, 0, -30);

        var renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        renderer.shadowMap.enabled = !isMobile;
        if (renderer.shadowMap.enabled) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Orbit controls
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

        // Shared materials
        scene.add(new THREE.AmbientLight(0x4a5a6a, 0.7));
        var sun = new THREE.DirectionalLight(0xfff4e0, 0.9);
        sun.position.set(150, 350, -200);
        if (!isMobile) {
            sun.castShadow = true;
            sun.shadow.mapSize.set(1024, 1024);
            sun.shadow.camera.left = -400;
            sun.shadow.camera.right = 400;
            sun.shadow.camera.top = 250;
            sun.shadow.camera.bottom = -250;
            sun.shadow.camera.far = 800;
            sun.shadow.bias = -0.001;
        }
        scene.add(sun);
        scene.add(new THREE.HemisphereLight(0x6688aa, 0x223322, 0.3));

        // Ground plane
        var loader = new THREE.TextureLoader();
        var groundTex = loader.load('workshop_reference_images/background.png');
        groundTex.encoding = THREE.sRGBEncoding;
        groundTex.minFilter = THREE.LinearFilter;
        groundTex.magFilter = THREE.LinearFilter;

        var ground = new THREE.Mesh(
            new THREE.PlaneGeometry(PLANE_W, PLANE_H),
            new THREE.MeshBasicMaterial({ map: groundTex })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        scene.add(ground);

        // Shared materials for buildings
        var concreteMat = new THREE.MeshStandardMaterial({
            color: 0x9a8a7a, roughness: 0.9, metalness: 0.0,
            transparent: true, opacity: 0.45
        });
        var wallMat = new THREE.MeshStandardMaterial({
            color: 0x1a2535, roughness: 0.45, metalness: 0.4,
            emissive: 0x0a1520, emissiveIntensity: 0.3
        });
        var roofMat = new THREE.MeshStandardMaterial({
            color: 0x2a3a4a, roughness: 0.3, metalness: 0.6
        });
        var catYellowMat = new THREE.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.6, metalness: 0.3 });
        var darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        var cabMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.3, metalness: 0.5 });
        var bladeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 });
        var postMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8, roughness: 0.3, metalness: 0.1,
            emissive: 0x038184, emissiveIntensity: 0.15
        });

        function buildShed(w, d, h) {
            var g = new THREE.Group();
            var walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            walls.position.y = h / 2;
            walls.castShadow = !isMobile;
            g.add(walls);
            var roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.5, 1, d + 1.5), roofMat);
            roof.position.y = h + 0.5;
            roof.castShadow = !isMobile;
            g.add(roof);
            return g;
        }

        function buildVehicle(type) {
            var vg = new THREE.Group();
            if (type === 'excavator') {
                var body = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4), catYellowMat);
                body.position.y = 2.5;
                vg.add(body);
                var cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), cabMat);
                cab.position.set(-0.5, 5, 0);
                vg.add(cab);
            } else if (type === 'truck') {
                var tray = new THREE.Mesh(new THREE.BoxGeometry(9, 3, 5), catYellowMat);
                tray.position.set(1.5, 3, 0);
                vg.add(tray);
                var tcab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3, 4), darkMetalMat);
                tcab.position.set(-4, 3, 0);
                vg.add(tcab);
            } else {
                var dzBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.5, 4), catYellowMat);
                dzBody.position.y = 2;
                vg.add(dzBody);
                var bl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 5.5), bladeMat);
                bl.position.set(3.5, 1.2, 0);
                vg.add(bl);
            }
            vg.scale.setScalar(0.7);
            return vg;
        }

        function buildEntrance() {
            var g = new THREE.Group();
            for (var p = -1; p <= 1; p += 2) {
                var post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 6), postMat);
                post.position.set(p * 5, 2.5, 0);
                g.add(post);
            }
            var bar = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 0.5), postMat);
            bar.position.y = 5;
            g.add(bar);
            var ring = new THREE.Mesh(
                new THREE.RingGeometry(6, 7, 16),
                new THREE.MeshBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
            );
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.3;
            g.add(ring);
            return g;
        }

        // --- CLUSTER 1: Left hardstand + storage shed + vehicles ---
        var cluster1 = new THREE.Group();
        cluster1.add(new THREE.Mesh(new THREE.BoxGeometry(80, 0.4, 80), concreteMat));
        cluster1.children[0].position.y = 0.2;
        var shed1 = buildShed(14, 14, 6);
        shed1.position.set(8, 0, 8);
        cluster1.add(shed1);
        [['excavator', -15, -10], ['truck', 0, 5], ['truck', 10, -5], ['dozer', -10, 10]].forEach(function(v) {
            var veh = buildVehicle(v[0]);
            veh.position.set(v[1], 0.5, v[2]);
            veh.rotation.y = (Math.random() - 0.5) * 0.6;
            cluster1.add(veh);
        });
        var pos1 = imgToWorld(POSITIONS.cluster1.pctX, POSITIONS.cluster1.pctZ);
        cluster1.position.set(pos1.x, 0, pos1.z);
        cluster1.rotation.y = POSITIONS.cluster1.angle;
        scene.add(cluster1);

        // --- CLUSTER 2: Right hardstand + workshop + equipment bay + vehicles ---
        var cluster2 = new THREE.Group();
        cluster2.add(new THREE.Mesh(new THREE.BoxGeometry(120, 0.4, 110), concreteMat));
        cluster2.children[0].position.y = 0.2;
        var workshop = buildShed(70, 16, 14);
        workshop.position.set(0, 0, -30);
        cluster2.add(workshop);
        var eqBay = buildShed(16, 50, 12);
        eqBay.position.set(25, 0, 30);
        cluster2.add(eqBay);
        [['excavator', -20, 15], ['truck', 0, 20], ['dozer', -15, 25], ['truck', 15, 20]].forEach(function(v) {
            var veh = buildVehicle(v[0]);
            veh.position.set(v[1], 0.5, v[2]);
            veh.rotation.y = (Math.random() - 0.5) * 0.6;
            cluster2.add(veh);
        });
        var pos2 = imgToWorld(POSITIONS.cluster2.pctX, POSITIONS.cluster2.pctZ);
        cluster2.position.set(pos2.x, 0, pos2.z);
        cluster2.rotation.y = POSITIONS.cluster2.angle;
        scene.add(cluster2);

        // --- ENTRANCES ---
        var ent1 = buildEntrance();
        var p1 = imgToWorld(POSITIONS.entrance1.pctX, POSITIONS.entrance1.pctZ);
        ent1.position.set(p1.x, 0, p1.z);
        ent1.rotation.y = POSITIONS.entrance1.angle;
        scene.add(ent1);

        var ent2 = buildEntrance();
        var p2 = imgToWorld(POSITIONS.entrance2.pctX, POSITIONS.entrance2.pctZ);
        ent2.position.set(p2.x, 0, p2.z);
        ent2.rotation.y = POSITIONS.entrance2.angle;
        scene.add(ent2);

        // Atmosphere particles (reduced count)
        if (!isMobile) {
            var dustCount = 80;
            var dustGeo = new THREE.BufferGeometry();
            var dustPos = new Float32Array(dustCount * 3);
            for (var i = 0; i < dustCount; i++) {
                dustPos[i * 3] = (Math.random() - 0.5) * 600;
                dustPos[i * 3 + 1] = Math.random() * 60 + 3;
                dustPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
            }
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
            scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
                color: 0x038184, size: 1.0, transparent: true, opacity: 0.25
            })));
        }

        // Render loop with frame limiting
        var visible = false;
        var observer = new IntersectionObserver(function(entries) {
            visible = entries[0].isIntersecting;
        }, { rootMargin: '200px' });
        observer.observe(container);

        var lastRender = 0;
        var targetInterval = isMobile ? 50 : 33; // 20fps mobile, 30fps desktop

        function animate(now) {
            requestAnimationFrame(animate);
            if (!visible) return;
            if (now - lastRender < targetInterval) return;
            lastRender = now;
            if (controls) controls.update();
            renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);

        // Resize
        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                var w = container.clientWidth;
                var h = container.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }, 150);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteModel);
    } else {
        initSiteModel();
    }

})();
