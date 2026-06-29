/* ======================================================
   GRB Mining — 3D Site Model (EDITOR MODE)
   Drag groups to position them. Hold SHIFT+drag to rotate.
   Click "Copy Positions" to get the final code.
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

    function worldToImg(x, z) {
        return {
            pctX: x / PLANE_W + 0.5,
            pctZ: z / PLANE_H + 0.5
        };
    }

    // Current positions & rotation — these are what you're adjusting
    var STATE = {
        cluster1: { pctX: 0.49, pctZ: 0.60, angle: -0.30 },
        cluster2: { pctX: 0.60, pctZ: 0.66, angle: -0.30 },
        entrance1: { pctX: 0.38, pctZ: 0.36, angle: -0.30 },
        entrance2: { pctX: 0.52, pctZ: 0.36, angle: -0.30 }
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
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        var controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.07;
            controls.enableZoom = true;
            controls.minDistance = 100;
            controls.maxDistance = 900;
            controls.maxPolarAngle = Math.PI / 2.1;
            controls.minPolarAngle = 0.2;
            controls.target.set(-50, 0, -30);
            controls.enablePan = true;
            controls.panSpeed = 0.6;
            controls.rotateSpeed = 0.4;
            controls.zoomSpeed = 0.8;
            controls.update();
        }

        // Lighting
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

        // Ground plane with satellite image
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
        ground.name = 'ground';
        scene.add(ground);

        // ═══════════════════════════════════════════════════════════════
        // BUILD 4 DRAGGABLE GROUPS
        // ═══════════════════════════════════════════════════════════════

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

        function buildShed(w, d, h) {
            var g = new THREE.Group();
            var walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            walls.position.y = h / 2;
            walls.castShadow = true;
            g.add(walls);
            var roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.5, 1, d + 1.5), roofMat);
            roof.position.y = h + 0.5;
            g.add(roof);
            return g;
        }

        function buildVehicle(type) {
            var vg = new THREE.Group();
            var catYellow = 0xd4a020;
            var darkMetal = 0x1a1a1a;
            if (type === 'excavator') {
                var body = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 }));
                body.position.y = 2.5;
                vg.add(body);
                var cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5),
                    new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.3, metalness: 0.5 }));
                cab.position.set(-0.5, 5, 0);
                vg.add(cab);
            } else if (type === 'truck') {
                var tray = new THREE.Mesh(new THREE.BoxGeometry(9, 3, 5),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 }));
                tray.position.set(1.5, 3, 0);
                vg.add(tray);
                var tcab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3, 4),
                    new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.4, metalness: 0.4 }));
                tcab.position.set(-4, 3, 0);
                vg.add(tcab);
            } else {
                var dzBody = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.5, 4),
                    new THREE.MeshStandardMaterial({ color: catYellow, roughness: 0.6, metalness: 0.3 }));
                dzBody.position.y = 2;
                vg.add(dzBody);
                var blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 5.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.6 }));
                blade.position.set(3.5, 1.2, 0);
                vg.add(blade);
            }
            vg.scale.setScalar(0.7);
            return vg;
        }

        function buildEntrance() {
            var g = new THREE.Group();
            var postMat = new THREE.MeshStandardMaterial({
                color: 0xe8e8e8, roughness: 0.3, metalness: 0.1,
                emissive: 0x038184, emissiveIntensity: 0.15
            });
            for (var p = -1; p <= 1; p += 2) {
                var post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 8), postMat);
                post.position.set(p * 5, 2.5, 0);
                g.add(post);
            }
            var bar = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 0.5), postMat);
            bar.position.y = 5;
            g.add(bar);
            var ringGeo = new THREE.RingGeometry(6, 7, 32);
            var ringMat = new THREE.MeshBasicMaterial({ color: 0x038184, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.3;
            g.add(ring);
            return g;
        }

        // --- CLUSTER 1: Left hardstand + storage shed + 4 vehicles ---
        var cluster1 = new THREE.Group();
        cluster1.userData = { id: 'cluster1', label: 'Left Cluster (Laydown + Storage Shed)' };
        var hs1 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.4, 80), concreteMat);
        hs1.position.y = 0.2;
        cluster1.add(hs1);
        var shed1 = buildShed(14, 14, 6);
        shed1.position.set(8, 0, 8);
        cluster1.add(shed1);
        var v1Offsets = [[-15, -10], [0, 5], [10, -5], [-10, 10]];
        var v1Types = ['excavator', 'truck', 'truck', 'dozer'];
        v1Offsets.forEach(function(off, i) {
            var v = buildVehicle(v1Types[i]);
            v.position.set(off[0], 0.5, off[1]);
            v.rotation.y = (Math.random() - 0.5) * 0.6;
            cluster1.add(v);
        });
        scene.add(cluster1);

        // --- CLUSTER 2: Right hardstand + workshop + equipment bay + 4 vehicles ---
        var cluster2 = new THREE.Group();
        cluster2.userData = { id: 'cluster2', label: 'Right Cluster (Staging + Workshop + Equipment Bay)' };
        var hs2 = new THREE.Mesh(new THREE.BoxGeometry(100, 0.4, 80), concreteMat);
        hs2.position.y = 0.2;
        cluster2.add(hs2);
        var workshop = buildShed(70, 16, 14);
        workshop.position.set(0, 0, -20);
        cluster2.add(workshop);
        var eqBay = buildShed(16, 50, 12);
        eqBay.position.set(30, 0, 5);
        cluster2.add(eqBay);
        var v2Offsets = [[-20, 15], [0, 20], [-15, 25], [15, 20]];
        var v2Types = ['excavator', 'truck', 'dozer', 'truck'];
        v2Offsets.forEach(function(off, i) {
            var v = buildVehicle(v2Types[i]);
            v.position.set(off[0], 0.5, off[1]);
            v.rotation.y = (Math.random() - 0.5) * 0.6;
            cluster2.add(v);
        });
        scene.add(cluster2);

        // --- ENTRANCE 1 ---
        var ent1 = buildEntrance();
        ent1.userData = { id: 'entrance1', label: 'Main Gate' };
        scene.add(ent1);

        // --- ENTRANCE 2 ---
        var ent2 = buildEntrance();
        ent2.userData = { id: 'entrance2', label: 'Service Entry' };
        scene.add(ent2);

        // Store groups for raycasting
        var draggableGroups = [cluster1, cluster2, ent1, ent2];
        var stateKeys = ['cluster1', 'cluster2', 'entrance1', 'entrance2'];

        function applyState() {
            stateKeys.forEach(function(key, i) {
                var grp = draggableGroups[i];
                var s = STATE[key];
                var pos = imgToWorld(s.pctX, s.pctZ);
                grp.position.set(pos.x, 0, pos.z);
                grp.rotation.y = s.angle;
            });
        }
        applyState();

        // ═══════════════════════════════════════════════════════════════
        // DRAG EDITOR
        // ═══════════════════════════════════════════════════════════════

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        var dragTarget = null;
        var dragOffset = new THREE.Vector3();
        var isShift = false;
        var rotateStart = 0;
        var rotateAngleStart = 0;

        function getGroupFromObject(obj) {
            var current = obj;
            while (current) {
                if (draggableGroups.indexOf(current) !== -1) return current;
                current = current.parent;
            }
            return null;
        }

        function onPointerDown(e) {
            if (e.button !== 0) return;
            isShift = e.shiftKey;

            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            var allMeshes = [];
            draggableGroups.forEach(function(grp) {
                grp.traverse(function(child) {
                    if (child.isMesh) allMeshes.push(child);
                });
            });

            var hits = raycaster.intersectObjects(allMeshes, false);
            if (hits.length > 0) {
                var grp = getGroupFromObject(hits[0].object);
                if (grp) {
                    dragTarget = grp;
                    if (controls) controls.enabled = false;

                    if (isShift) {
                        rotateStart = e.clientX;
                        var key = stateKeys[draggableGroups.indexOf(grp)];
                        rotateAngleStart = STATE[key].angle;
                    } else {
                        var intersection = new THREE.Vector3();
                        raycaster.ray.intersectPlane(groundPlane, intersection);
                        dragOffset.copy(grp.position).sub(intersection);
                    }

                    highlightGroup(grp, true);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }

        function onPointerMove(e) {
            if (!dragTarget) return;

            var rect = renderer.domElement.getBoundingClientRect();

            if (isShift) {
                var dx = e.clientX - rotateStart;
                var key = stateKeys[draggableGroups.indexOf(dragTarget)];
                STATE[key].angle = rotateAngleStart + dx * 0.005;
                dragTarget.rotation.y = STATE[key].angle;
            } else {
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);

                var intersection = new THREE.Vector3();
                raycaster.ray.intersectPlane(groundPlane, intersection);
                intersection.add(dragOffset);

                dragTarget.position.set(intersection.x, 0, intersection.z);

                var key = stateKeys[draggableGroups.indexOf(dragTarget)];
                var img = worldToImg(intersection.x, intersection.z);
                STATE[key].pctX = Math.round(img.pctX * 1000) / 1000;
                STATE[key].pctZ = Math.round(img.pctZ * 1000) / 1000;
            }

            updatePanel();
            e.preventDefault();
        }

        function onPointerUp(e) {
            if (dragTarget) {
                highlightGroup(dragTarget, false);
                dragTarget = null;
                if (controls) controls.enabled = true;
                updatePanel();
            }
        }

        var highlightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.4 });
        var highlightedMeshes = [];

        function highlightGroup(grp, on) {
            if (!on) {
                highlightedMeshes.forEach(function(obj) {
                    obj.mesh.material = obj.original;
                });
                highlightedMeshes = [];
                return;
            }
            grp.traverse(function(child) {
                if (child.isMesh && child.material !== highlightMat) {
                    highlightedMeshes.push({ mesh: child, original: child.material });
                }
            });
        }

        renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
        renderer.domElement.addEventListener('pointermove', onPointerMove, false);
        renderer.domElement.addEventListener('pointerup', onPointerUp, false);
        renderer.domElement.addEventListener('pointerleave', onPointerUp, false);

        // ═══════════════════════════════════════════════════════════════
        // EDITOR UI PANEL
        // ═══════════════════════════════════════════════════════════════

        var panel = document.createElement('div');
        panel.id = 'editor-panel';
        panel.style.cssText = 'position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.9);color:#0f8;font-family:monospace;font-size:12px;padding:12px;border-radius:8px;border:1px solid #038184;z-index:9999;max-width:380px;pointer-events:auto;';
        container.style.position = 'relative';
        container.appendChild(panel);

        var instructions = document.createElement('div');
        instructions.style.cssText = 'margin-bottom:10px;color:#aaa;font-size:11px;line-height:1.4;';
        instructions.innerHTML = '<b style="color:#0ff">EDITOR MODE</b><br>• Click+drag to MOVE a group<br>• SHIFT+drag to ROTATE a group<br>• Right-click drag to PAN camera<br>• Scroll to zoom';
        panel.appendChild(instructions);

        var posDisplay = document.createElement('pre');
        posDisplay.style.cssText = 'margin:0;white-space:pre-wrap;font-size:11px;line-height:1.5;color:#0f8;';
        panel.appendChild(posDisplay);

        var copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Positions';
        copyBtn.style.cssText = 'margin-top:10px;padding:6px 14px;background:#038184;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;';
        copyBtn.addEventListener('click', function() {
            var code = generateCode();
            navigator.clipboard.writeText(code).then(function() {
                copyBtn.textContent = 'Copied!';
                setTimeout(function() { copyBtn.textContent = 'Copy Positions'; }, 2000);
            });
        });
        panel.appendChild(copyBtn);

        function updatePanel() {
            var lines = [];
            stateKeys.forEach(function(key, i) {
                var s = STATE[key];
                var label = draggableGroups[i].userData.label;
                lines.push('<span style="color:#0ff">' + label + '</span>');
                lines.push('  pctX: ' + s.pctX.toFixed(3) + '  pctZ: ' + s.pctZ.toFixed(3));
                lines.push('  angle: ' + s.angle.toFixed(3) + ' rad (' + (s.angle * 180 / Math.PI).toFixed(1) + '°)');
                lines.push('');
            });
            posDisplay.innerHTML = lines.join('\n');
        }

        function generateCode() {
            return 'var PROP_ANGLE = ' + STATE.cluster1.angle.toFixed(4) + ';\n\n' +
                'var SITE = {\n' +
                '    sheds: [\n' +
                '        { name: \'Storage Shed\', pctX: ' + STATE.cluster1.pctX.toFixed(3) + ', pctZ: ' + STATE.cluster1.pctZ.toFixed(3) + ', w: 14, d: 14, h: 6 },\n' +
                '        { name: \'Main Workshop\', pctX: ' + STATE.cluster2.pctX.toFixed(3) + ', pctZ: ' + STATE.cluster2.pctZ.toFixed(3) + ', w: 70, d: 16, h: 14 },\n' +
                '        { name: \'Equipment Bay\', pctX: ' + STATE.cluster2.pctX.toFixed(3) + ', pctZ: ' + STATE.cluster2.pctZ.toFixed(3) + ', w: 16, d: 50, h: 12 }\n' +
                '    ],\n' +
                '    hardstands: [\n' +
                '        { name: \'Laydown Yard\', pctX: ' + STATE.cluster1.pctX.toFixed(3) + ', pctZ: ' + STATE.cluster1.pctZ.toFixed(3) + ', w: 80, d: 80 },\n' +
                '        { name: \'Staging Area\', pctX: ' + STATE.cluster2.pctX.toFixed(3) + ', pctZ: ' + STATE.cluster2.pctZ.toFixed(3) + ', w: 100, d: 80 }\n' +
                '    ],\n' +
                '    entrances: [\n' +
                '        { name: \'Main Gate\', pctX: ' + STATE.entrance1.pctX.toFixed(3) + ', pctZ: ' + STATE.entrance1.pctZ.toFixed(3) + ' },\n' +
                '        { name: \'Service Entry\', pctX: ' + STATE.entrance2.pctX.toFixed(3) + ', pctZ: ' + STATE.entrance2.pctZ.toFixed(3) + ' }\n' +
                '    ]\n' +
                '};\n\n' +
                '// Angles:\n' +
                '// Cluster 1: ' + STATE.cluster1.angle.toFixed(4) + ' rad\n' +
                '// Cluster 2: ' + STATE.cluster2.angle.toFixed(4) + ' rad\n' +
                '// Entrance 1: ' + STATE.entrance1.angle.toFixed(4) + ' rad\n' +
                '// Entrance 2: ' + STATE.entrance2.angle.toFixed(4) + ' rad\n';
        }

        updatePanel();

        // Atmosphere particles
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
            var dustMat = new THREE.PointsMaterial({ color: 0x038184, size: 1.0, transparent: true, opacity: 0.25 });
            scene.add(new THREE.Points(dustGeo, dustMat));
        }

        // Render loop
        var visible = true;
        var observer = new IntersectionObserver(function(entries) {
            visible = entries[0].isIntersecting;
        }, { rootMargin: '200px' });
        observer.observe(container);

        function animate() {
            requestAnimationFrame(animate);
            if (!visible) return;
            if (controls) controls.update();
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', function() {
            var w = container.clientWidth;
            var h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteModel);
    } else {
        initSiteModel();
    }

})();
