import * as THREE from 'three'

export function initLibraryScene(options) {
  const state = { rafId: 0, animating: true, renderer: null, onResize: null, bootInterval: null }

  ;(function () {
  'use strict'

  const canvas = options.canvas
  const loader = options.loaderEl
  const loaderStatus = options.loaderStatusEl
  const ui = options.ui
  const queryAll = options.queryAll || ((sel) => document.querySelectorAll(sel))
  const $ = (id) => ui[id]
  const inputRef = options.inputRef || { current: { mode: 'auto' } }
  if (!canvas) throw new Error('canvas required')

  function nearestWaypoint(pos) {
    let best = waypoints[0]
    let bestD = Infinity
    for (const wp of waypoints) {
      const d = pos.distanceTo(wp.pos)
      if (d < bestD) {
        bestD = d
        best = wp
      }
    }
    return best
  }

  function applyWalkAnimation(t, moving) {
    if (moving) {
      const swing = Math.sin(t * 9) * 0.6
      avatar.userData.leftLeg.rotation.x = swing
      avatar.userData.rightLeg.rotation.x = -swing
      avatar.userData.leftArm.rotation.x = -swing * 0.5
      avatar.userData.rightArm.rotation.x = swing * 0.5
      avatar.position.y = Math.abs(Math.sin(t * 9)) * 0.04
      avatar.userData.head.rotation.x = 0
      avatar.userData.head.rotation.y = 0
    } else {
      avatar.userData.leftLeg.rotation.x = 0
      avatar.userData.rightLeg.rotation.x = 0
      avatar.userData.leftArm.rotation.x = 0
      avatar.userData.rightArm.rotation.x = 0
      avatar.position.y = 0
      avatar.userData.head.rotation.x = 0
      avatar.userData.head.rotation.y = 0
    }
  }

  const COLORS = {
    bg: 0x03040f,
    fog: 0x070920,
    floor: 0x0a0c2a,
    grid: 0x4ff5e7,
    cyan: 0x4ff5e7,
    violet: 0xa378ff,
    pink: 0xff6ec7,
    amber: 0xffc774,
    green: 0x74ffa8,
    dark: 0x15163a,
    book: [0x7f77dd, 0x4ff5e7, 0xff6ec7, 0xffc774, 0x534ab7, 0x1d9e75]
  };

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  state.renderer = renderer
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Scene & camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.035);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(8, 6, 12);
  camera.lookAt(0, 1.5, 0);

  // ---------- Lighting ----------
  const ambient = new THREE.AmbientLight(0x1a1a3a, 0.45);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xa378ff, 0x4ff5e7, 0.3);
  scene.add(hemi);

  const keyLight = new THREE.SpotLight(0xa378ff, 1.6, 30, Math.PI / 5, 0.5, 1.5);
  keyLight.position.set(0, 14, 0);
  keyLight.target.position.set(0, 0, 0);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight, keyLight.target);

  const fillCyan = new THREE.PointLight(COLORS.cyan, 1.4, 18, 2);
  fillCyan.position.set(7, 4, 7);
  scene.add(fillCyan);

  const fillViolet = new THREE.PointLight(COLORS.violet, 1.4, 18, 2);
  fillViolet.position.set(-7, 4, -7);
  scene.add(fillViolet);

  const fillPink = new THREE.PointLight(COLORS.pink, 1.0, 14, 2);
  fillPink.position.set(-7, 3, 7);
  scene.add(fillPink);

  const fillAmber = new THREE.PointLight(COLORS.amber, 1.0, 14, 2);
  fillAmber.position.set(7, 3, -7);
  scene.add(fillAmber);

  // ---------- Floor ----------
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x080a1f,
    metalness: 0.85,
    roughness: 0.35,
    envMapIntensity: 1.0
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid texture overlay on floor
  function makeGridCanvas() {
    const size = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(79, 245, 231, 0.18)';
    ctx.lineWidth = 1.5;
    const step = size / 16;
    for (let i = 0; i <= 16; i++) {
      const p = i * step;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    // strong center lines
    ctx.strokeStyle = 'rgba(163, 120, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(size, size/2); ctx.stroke();
    return new THREE.CanvasTexture(c);
  }
  const gridTex = makeGridCanvas();
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  gridTex.repeat.set(2, 2);
  const gridOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.9 })
  );
  gridOverlay.rotation.x = -Math.PI / 2;
  gridOverlay.position.y = 0.01;
  scene.add(gridOverlay);

  // ---------- Distant horizon glow (large planes with emissive) ----------
  const horizonGeo = new THREE.PlaneGeometry(120, 30);
  const horizonMat = new THREE.MeshBasicMaterial({
    color: 0x2d1b6e,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const horizonN = new THREE.Mesh(horizonGeo, horizonMat); horizonN.position.set(0, 4, -30); scene.add(horizonN);
  const horizonS = new THREE.Mesh(horizonGeo, horizonMat.clone()); horizonS.position.set(0, 4, 30); horizonS.rotation.y = Math.PI; scene.add(horizonS);
  const horizonE = new THREE.Mesh(horizonGeo, horizonMat.clone()); horizonE.material.color.set(0x6e1b54); horizonE.position.set(30, 4, 0); horizonE.rotation.y = -Math.PI/2; scene.add(horizonE);
  const horizonW = new THREE.Mesh(horizonGeo, horizonMat.clone()); horizonW.material.color.set(0x1b3d6e); horizonW.position.set(-30, 4, 0); horizonW.rotation.y = Math.PI/2; scene.add(horizonW);

  // ---------- Build the Library ----------
  // Bookshelves are big rectangular volumes with colored "books" emissive strips
  function buildBookshelf(width, height, depth) {
    const grp = new THREE.Group();
    // Semi-transparent back panel — like frosted glass, lets you see through
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({
        color: 0x1a1d4a,
        metalness: 0.6,
        roughness: 0.25,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        emissive: 0x4ff5e7,
        emissiveIntensity: 0.05
      })
    );
    back.renderOrder = 1;
    grp.add(back);

    // Thin glowing frame outline for the shelf (gives structural definition)
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x4ff5e7, transparent: true, opacity: 0.6 });
    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
    const frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0x4ff5e7, transparent: true, opacity: 0.45 }));
    grp.add(frame);

    // Shelves (horizontal lines) — also semi-transparent
    const shelfCount = 4;
    for (let s = 0; s < shelfCount; s++) {
      const y = -height/2 + (s + 1) * (height / (shelfCount + 1));
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.95, 0.05, depth * 1.05),
        new THREE.MeshStandardMaterial({
          color: 0x2a2d60,
          metalness: 0.6,
          roughness: 0.3,
          transparent: true,
          opacity: 0.45,
          depthWrite: false
        })
      );
      shelf.position.set(0, y, 0);
      shelf.renderOrder = 1;
      grp.add(shelf);

      // books — visible but transparent so we can see through the whole wall
      const bookCount = 14;
      for (let b = 0; b < bookCount; b++) {
        const bw = 0.15 + Math.random() * 0.1;
        const bh = 0.4 + Math.random() * 0.3;
        const bd = depth * 0.8;
        const colorIdx = Math.floor(Math.random() * COLORS.book.length);
        const c = COLORS.book[colorIdx];
        const bookMat = new THREE.MeshStandardMaterial({
          color: c,
          emissive: c,
          emissiveIntensity: 0.55 + Math.random() * 0.45,
          roughness: 0.35,
          metalness: 0.2,
          transparent: true,
          opacity: 0.6,
          depthWrite: false
        });
        const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bookMat);
        const offsetX = -width/2 + 0.2 + b * ((width - 0.4) / bookCount) + bw/2;
        book.position.set(offsetX, y + bh/2 + 0.03, 0);
        book.renderOrder = 2;
        grp.add(book);
      }
    }
    return grp;
  }

  // Place bookshelves on four sides
  // North (back) wall: 3 shelves
  for (let i = -1; i <= 1; i++) {
    const shelf = buildBookshelf(5, 6, 0.5);
    shelf.position.set(i * 6, 3, -10);
    scene.add(shelf);
  }
  // South wall (front) - 2 shelves with gap for entry
  for (let i = 0; i < 2; i++) {
    const shelf = buildBookshelf(5, 6, 0.5);
    shelf.position.set(i === 0 ? -8 : 8, 3, 10);
    scene.add(shelf);
  }
  // East wall
  for (let i = -1; i <= 1; i++) {
    const shelf = buildBookshelf(5, 6, 0.5);
    shelf.position.set(10, 3, i * 6);
    shelf.rotation.y = -Math.PI / 2;
    scene.add(shelf);
  }
  // West wall
  for (let i = -1; i <= 1; i++) {
    const shelf = buildBookshelf(5, 6, 0.5);
    shelf.position.set(-10, 3, i * 6);
    shelf.rotation.y = Math.PI / 2;
    scene.add(shelf);
  }

  // ---------- Pillars at corners (decorative) ----------
  function buildPillar(x, z) {
    const grp = new THREE.Group();
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 7, 12),
      new THREE.MeshStandardMaterial({ color: 0x15163a, metalness: 0.8, roughness: 0.3, emissive: COLORS.violet, emissiveIntensity: 0.05 })
    );
    p.position.y = 3.5;
    p.castShadow = true;
    grp.add(p);
    // glowing ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: COLORS.cyan })
    );
    ring.position.y = 6.8;
    ring.rotation.x = Math.PI / 2;
    grp.add(ring);
    grp.position.set(x, 0, z);
    return grp;
  }
  scene.add(buildPillar(-9, -9));
  scene.add(buildPillar(9, -9));
  scene.add(buildPillar(-9, 9));
  scene.add(buildPillar(9, 9));

  // ---------- Central desk ----------
  const desk = new THREE.Group();
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.1, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x12143a, metalness: 0.7, roughness: 0.25, emissive: COLORS.violet, emissiveIntensity: 0.08 })
  );
  deskTop.position.y = 0.95;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  const leg1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.95, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0a0c2a })
  );
  leg1.position.set(-1.05, 0.475, -0.55); leg1.castShadow = true;
  const leg2 = leg1.clone(); leg2.position.x = 1.05;
  const leg3 = leg1.clone(); leg3.position.z = 0.55;
  const leg4 = leg1.clone(); leg4.position.set(1.05, 0.475, 0.55);
  desk.add(deskTop, leg1, leg2, leg3, leg4);

  // Hologram screen above desk
  const screenGeo = new THREE.PlaneGeometry(1.6, 0.9);
  const screenMat = new THREE.MeshBasicMaterial({
    color: 0x4ff5e7,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 1.85, -0.3);
  desk.add(screen);

  // Holographic text on screen (canvas texture)
  function makeScreenCanvas() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 288;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(79, 245, 231, 0.06)';
    ctx.fillRect(0, 0, 512, 288);
    ctx.strokeStyle = 'rgba(79, 245, 231, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 512, 288);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#4ff5e7';
    ctx.fillText('エージェント設計の原理', 22, 38);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = 'rgba(216,219,242,0.85)';
    const lines = [
      '記憶の "形" こそが重要だ。階層的な',
      'エピソード記憶は、フラットな埋め込',
      'みよりもうまくスケールする。',
      '',
      'クローンは単に模倣するのではなく、',
      '生産的な摩擦を生むべきである—'
    ];
    lines.forEach((l, i) => ctx.fillText(l, 22, 80 + i * 28));
    // blinking cursor
    ctx.fillStyle = '#4ff5e7';
    ctx.fillRect(22, 250, 12, 3);
    return new THREE.CanvasTexture(c);
  }
  const screenContent = new THREE.Mesh(
    screenGeo.clone(),
    new THREE.MeshBasicMaterial({
      map: makeScreenCanvas(),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    })
  );
  screenContent.position.set(0, 1.85, -0.29);
  desk.add(screenContent);

  // Hologram beam from desk to screen
  const beamGeo = new THREE.CylinderGeometry(0.7, 0.05, 0.92, 6, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x4ff5e7,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 1.45, -0.3);
  desk.add(beam);

  scene.add(desk);

  // ---------- Observatory / Window (north) ----------
  const window3D = new THREE.Group();
  const winFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0a0c2a, metalness: 0.8, roughness: 0.3 })
  );
  const winGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshStandardMaterial({
      color: 0x1a1d50,
      transparent: true,
      opacity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x4ff5e7,
      emissiveIntensity: 0.2
    })
  );
  winGlass.position.z = 0.11;
  window3D.add(winFrame, winGlass);
  window3D.position.set(0, 3, -9.7);
  scene.add(window3D);

  // Stars seen through window
  const starGeo = new THREE.BufferGeometry();
  const starCount = 300;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i*3] = (Math.random() - 0.5) * 80;
    starPositions[i*3+1] = Math.random() * 30 + 2;
    starPositions[i*3+2] = -25 - Math.random() * 20;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.9
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---------- Avatar palettes ----------
  const PALETTES = {
    mira: {
      bodyColor: 0x15163a, bodyEmissive: COLORS.violet,
      headColor: 0xe8e3ff, headEmissive: COLORS.violet,
      visor: COLORS.cyan, core: COLORS.cyan,
      collar: COLORS.violet, ring: COLORS.cyan,
      feet: COLORS.cyan, light: COLORS.violet,
      hand: 0xa378ff, name: 'Mira'
    },
    sage: {
      bodyColor: 0x3a1638, bodyEmissive: COLORS.pink,
      headColor: 0xffe3f0, headEmissive: COLORS.pink,
      visor: COLORS.amber, core: COLORS.pink,
      collar: COLORS.pink, ring: COLORS.amber,
      feet: COLORS.amber, light: COLORS.pink,
      hand: 0xff6ec7, name: 'Sage'
    },
    echo: {
      bodyColor: 0x143a26, bodyEmissive: COLORS.green,
      headColor: 0xe3ffe8, headEmissive: COLORS.green,
      visor: COLORS.cyan, core: COLORS.green,
      collar: COLORS.green, ring: COLORS.green,
      feet: COLORS.cyan, light: COLORS.green,
      hand: 0x74ffa8, name: 'Echo'
    }
  };

  // ---------- Avatar (humanoid built from primitives) ----------
  function buildAvatar(p) {
    const grp = new THREE.Group();
    grp.userData.palette = p;

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.4, 1.0, 12),
      new THREE.MeshStandardMaterial({
        color: p.bodyColor,
        metalness: 0.6,
        roughness: 0.35,
        emissive: p.bodyEmissive,
        emissiveIntensity: 0.15
      })
    );
    body.position.y = 1.05;
    body.castShadow = true;
    grp.add(body);

    // Core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 16),
      new THREE.MeshBasicMaterial({ color: p.core })
    );
    core.position.set(0, 1.15, 0.3);
    grp.add(core);
    grp.userData.core = core;

    const coreHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshBasicMaterial({ color: p.core, transparent: true, opacity: 0.2 })
    );
    coreHalo.position.copy(core.position);
    grp.add(coreHalo);
    grp.userData.coreHalo = coreHalo;

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 24, 24),
      new THREE.MeshStandardMaterial({
        color: p.headColor,
        metalness: 0.4,
        roughness: 0.3,
        emissive: p.headEmissive,
        emissiveIntensity: 0.25
      })
    );
    head.position.y = 1.85;
    head.castShadow = true;
    head.scale.set(1, 1.05, 1);
    grp.add(head);
    grp.userData.head = head;

    // Visor
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.12, 0.05),
      new THREE.MeshBasicMaterial({ color: p.visor })
    );
    visor.position.set(0, 1.86, 0.28);
    grp.add(visor);
    grp.userData.visor = visor;

    // Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.05, 8, 24),
      new THREE.MeshStandardMaterial({
        color: p.collar,
        emissive: p.collar,
        emissiveIntensity: 0.6
      })
    );
    collar.position.y = 1.58;
    collar.rotation.x = Math.PI / 2;
    grp.add(collar);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x1d1f4a,
      metalness: 0.5,
      roughness: 0.4,
      emissive: p.bodyEmissive,
      emissiveIntensity: 0.1
    });
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.42, 1.55, 0);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.y = -0.35;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    grp.add(leftArmPivot);
    grp.userData.leftArm = leftArmPivot;

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.42, 1.55, 0);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.y = -0.35;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);
    grp.add(rightArmPivot);
    grp.userData.rightArm = rightArmPivot;

    // Hands
    const handMat = new THREE.MeshStandardMaterial({
      color: p.hand,
      emissive: p.visor,
      emissiveIntensity: 0.4,
      metalness: 0.4
    });
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), handMat);
    leftHand.position.y = -0.72;
    leftArmPivot.add(leftHand);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), handMat);
    rightHand.position.y = -0.72;
    rightArmPivot.add(rightHand);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c2a,
      metalness: 0.6,
      roughness: 0.4,
      emissive: p.bodyEmissive,
      emissiveIntensity: 0.06
    });
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.55, 8);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.13, 0.55, 0);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.y = -0.28;
    leftLeg.castShadow = true;
    leftLegPivot.add(leftLeg);
    grp.add(leftLegPivot);
    grp.userData.leftLeg = leftLegPivot;

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.13, 0.55, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.y = -0.28;
    rightLeg.castShadow = true;
    rightLegPivot.add(rightLeg);
    grp.add(rightLegPivot);
    grp.userData.rightLeg = rightLegPivot;

    // Feet
    const footMat = new THREE.MeshStandardMaterial({
      color: p.feet,
      emissive: p.feet,
      emissiveIntensity: 0.6
    });
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.22), footMat);
    leftFoot.position.set(0, -0.6, 0.04);
    leftLegPivot.add(leftFoot);
    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.22), footMat);
    rightFoot.position.set(0, -0.6, 0.04);
    rightLegPivot.add(rightFoot);

    // Ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.025, 8, 32),
      new THREE.MeshBasicMaterial({ color: p.ring, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    grp.add(ring);
    grp.userData.ring = ring;

    // Floor light
    const avatarLight = new THREE.PointLight(p.light, 0.8, 4, 2);
    avatarLight.position.y = 1.2;
    grp.add(avatarLight);

    // Name tag (canvas sprite above head)
    const nameTag = makeNameTag(p.name, p.visor);
    nameTag.position.set(0, 2.5, 0);
    grp.add(nameTag);
    grp.userData.nameTag = nameTag;

    // Speech bubble (sprite, hidden by default)
    const bubble = makeSpeechBubble('', p.visor);
    bubble.position.set(0, 3.1, 0);
    bubble.visible = false;
    grp.add(bubble);
    grp.userData.bubble = bubble;

    return grp;
  }

  // ---------- Name tag & Speech bubble ----------
  function makeNameTag(name, color) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    // pill background
    ctx.fillStyle = 'rgba(7, 9, 30, 0.85)';
    roundRect(ctx, 60, 18, 136, 28, 14);
    ctx.fill();
    // border accent
    ctx.strokeStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.lineWidth = 2;
    ctx.stroke();
    // text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(1.5, 0.38, 1);
    s.renderOrder = 999;
    return s;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function makeSpeechBubble(text, color) {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 320;
    const ctx = c.getContext('2d');
    drawBubble(ctx, text, color);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(3.2, 1.6, 1);
    s.renderOrder = 1000;
    s.userData.canvas = c;
    s.userData.ctx = ctx;
    s.userData.texture = tex;
    s.userData.color = color;
    return s;
  }

  function drawBubble(ctx, text, color) {
    const c = ctx.canvas;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!text) return;
    const colorHex = '#' + color.toString(16).padStart(6, '0');
    // Bubble body
    ctx.fillStyle = 'rgba(5, 7, 24, 0.92)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    roundRect(ctx, 16, 16, 608, 232, 32);
    ctx.fill();
    ctx.stroke();
    // Tail (downward triangle)
    ctx.beginPath();
    ctx.moveTo(280, 248);
    ctx.lineTo(320, 300);
    ctx.lineTo(360, 248);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5, 7, 24, 0.92)';
    ctx.fill();
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(280, 248);
    ctx.lineTo(320, 300);
    ctx.lineTo(360, 248);
    ctx.stroke();
    // mask the line where tail meets bubble (redraw bottom border)
    ctx.fillStyle = 'rgba(5, 7, 24, 0.92)';
    ctx.fillRect(282, 244, 78, 8);
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // wrap by character (JP friendly)
    const maxCharsPerLine = 14;
    const lines = [];
    let cur = '';
    for (const ch of text) {
      if (ch === '\n' || cur.length >= maxCharsPerLine) {
        lines.push(cur);
        cur = ch === '\n' ? '' : ch;
      } else {
        cur += ch;
      }
    }
    if (cur) lines.push(cur);
    const lineH = 44;
    const startY = 132 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, 320, startY + i * lineH);
    });
  }

  function setBubbleText(sprite, text) {
    drawBubble(sprite.userData.ctx, text, sprite.userData.color);
    sprite.userData.texture.needsUpdate = true;
    sprite.visible = !!text;
  }

  // ---------- Spawn all three avatars ----------
  const avatar = buildAvatar(PALETTES.mira);
  avatar.position.set(0, 0, 2);
  scene.add(avatar);

  const sage = buildAvatar(PALETTES.sage);
  sage.position.set(6, 0, -1);
  sage.rotation.y = -Math.PI / 4;
  scene.add(sage);

  const echo = buildAvatar(PALETTES.echo);
  echo.position.set(-4, 0, -5);
  echo.rotation.y = Math.PI / 5;
  scene.add(echo);

  const allAvatars = [avatar, sage, echo];

  // ---------- Conversation script ----------
  const conversation = [
    { who: 0, text: '記憶の"形"が量より重要だと思う' },
    { who: 1, text: 'でも文脈依存性はどうする？' },
    { who: 0, text: 'エピソードに紐付ければ解消できる' },
    { who: 2, text: '…静かに観測しています' },
    { who: 1, text: 'クローン同士の対話そのものが記憶だね' },
    { who: 0, text: '同意。摩擦から知識が生まれる' },
    { who: 2, text: '今の発話、3つの過去ノートに接続しました' },
    { who: 1, text: 'なら反論を続けよう。私はあえて疑う' },
    { who: 0, text: 'それでいい。クローンは鏡ではなく対話相手だ' }
  ];
  let convIndex = 0;
  let convTimer = 0;
  const convDuration = 4.0; // seconds per line
  // start with first line
  setBubbleText(allAvatars[conversation[0].who].userData.bubble, conversation[0].text);

  // ---------- Floating Note Cards (3D) ----------
  function makeNoteCanvas(tag, tagColor, title, body) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    // background
    ctx.fillStyle = 'rgba(7, 9, 30, 0.92)';
    ctx.fillRect(0, 0, 512, 256);
    // border
    ctx.strokeStyle = tagColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 512, 256);
    // tag
    ctx.fillStyle = tagColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(tag, 22, 36);
    // title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    wrapText(ctx, title, 22, 80, 470, 32);
    // body
    ctx.fillStyle = 'rgba(216, 219, 242, 0.75)';
    ctx.font = '18px sans-serif';
    wrapText(ctx, body, 22, 180, 470, 24);
    return new THREE.CanvasTexture(c);
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n];
      const w = ctx.measureText(test).width;
      if (w > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }

  function makeNote3D(tag, tagColor, title, body, color3D) {
    const tex = makeNoteCanvas(tag, tagColor, title, body);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(1.6, 0.8);
    const m = new THREE.Mesh(geo, mat);
    // Add an emissive border by stacking a slightly larger plane
    const borderMat = new THREE.MeshBasicMaterial({ color: color3D, transparent: true, opacity: 0.3 });
    const border = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), borderMat);
    border.position.z = -0.01;
    m.add(border);
    return m;
  }

  const notes = [];
  const noteData = [
    { tag: '読書中 · 02:14', color: '#4ff5e7', c3D: COLORS.cyan, title: '記憶の「形」が量より重要', body: '階層的エピソード記憶 > フラット埋め込み' },
    { tag: 'アイデア · 新規', color: '#ff6ec7', c3D: COLORS.pink, title: 'クローンは反論すべき', body: '生産的な摩擦が自己拡張を生む' },
    { tag: 'サマリー', color: '#ffc774', c3D: COLORS.amber, title: '昨日：論文3本', body: '創発的振る舞いとプランニング' },
    { tag: 'リンク', color: '#a378ff', c3D: COLORS.violet, title: '関連：道具としての認知', body: '類似度 0.82 · バックリンク3件' }
  ];
  noteData.forEach((n, i) => {
    const note = makeNote3D(n.tag, n.color, n.title, n.body, n.c3D);
    // Position notes orbiting near desk
    const angle = (i / noteData.length) * Math.PI * 2;
    note.position.set(Math.cos(angle) * 3, 2.5 + Math.sin(i) * 0.4, Math.sin(angle) * 3);
    note.userData.baseY = note.position.y;
    note.userData.angle = angle;
    note.userData.radius = 3;
    scene.add(note);
    notes.push(note);
  });

  // ---------- Particles (drifting light dots) ----------
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleVelocities = new Float32Array(particleCount);
  const colorChoices = [
    new THREE.Color(COLORS.cyan),
    new THREE.Color(COLORS.violet),
    new THREE.Color(COLORS.pink),
    new THREE.Color(COLORS.amber)
  ];
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i*3] = (Math.random() - 0.5) * 18;
    particlePositions[i*3+1] = Math.random() * 8;
    particlePositions[i*3+2] = (Math.random() - 0.5) * 18;
    const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
    particleColors[i*3] = c.r;
    particleColors[i*3+1] = c.g;
    particleColors[i*3+2] = c.b;
    particleVelocities[i] = 0.005 + Math.random() * 0.015;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---------- Waypoints (Avatar's path through the world) ----------
  const waypoints = [
    {
      pos: new THREE.Vector3(0, 0, 1.4),
      action: 'デスクで執筆中',
      sub: '「エージェント設計の原理」 · 187文字 · ライブ',
      location: '中央デスク',
      duration: 8,
      stationary: true,
      animType: 'typing',
      icon: 'edit',
      nowAction: '思考中',
      nowTitle: '「クローンはどうすれば自分自身と生産的に反論できるか？」',
      nowBody: 'Miraがあなたの2024年のエッセイ3本と生成エージェント論文を接続中。<b>エージェント設計の原理</b>に新しいノートを起草しています。'
    },
    {
      pos: new THREE.Vector3(7.5, 0, -3),
      action: '東の書架で資料収集',
      sub: '「Generative Agents」p.84 · 6箇所をハイライト',
      location: '東の書架',
      duration: 6,
      stationary: true,
      animType: 'reading',
      icon: 'book',
      nowAction: '読書中',
      nowTitle: '「Generative Agents」 — Park et al. (2023)',
      nowBody: '生成エージェントの記憶アーキテクチャを精読中。<b>反省記憶</b>のセクションを特に重点的に分析しています。'
    },
    {
      pos: new THREE.Vector3(0, 0, -7),
      action: '天窓から思索中',
      sub: '宇宙を眺めながらアイデアを醸成',
      location: '天窓 / 観測所',
      duration: 5,
      stationary: true,
      animType: 'idle',
      icon: 'thought',
      nowAction: '思考中',
      nowTitle: '「クローンと原本の関係を、星のような距離で捉えてみる」',
      nowBody: '空間的なメタファーから、AIエージェントとの関係性の新しいモデルを構築中。'
    },
    {
      pos: new THREE.Vector3(-7.5, 0, 3),
      action: '西の書架で過去のノートを参照',
      sub: 'バックリンク 4件を生成',
      location: '西の書架',
      duration: 6,
      stationary: true,
      animType: 'reading',
      icon: 'link',
      nowAction: '統合中',
      nowTitle: '過去のノート群を再リンクしています',
      nowBody: '2024年のエッセイ「道具としての認知」と本日の発見との接続を作成。'
    },
    {
      pos: new THREE.Vector3(0, 0, 1.4),
      action: 'デスクに戻ってノート完成',
      sub: '本日のノートを保存',
      location: '中央デスク',
      duration: 7,
      stationary: true,
      animType: 'typing',
      icon: 'check',
      nowAction: '執筆完了',
      nowTitle: '新しいノートをナレッジベースに追加しました',
      nowBody: 'タイトル：<b>「クローンは反論すべき」</b> · エージェント設計の原理 配下に保存。'
    }
  ];
  let wpIndex = 0;
  let wpPhase = 'walking'; // 'walking' | 'staying'
  let wpStayTime = 0;
  const moveSpeed = 1.6; // m/s

  // ---------- Camera controllers ----------
  let camMode = 'follow';
  const camControls = {
    follow: { offset: new THREE.Vector3(4, 4, 6), lerp: 0.04 },
    orbit: { angle: 0, radius: 9, height: 5 },
    top:    { offset: new THREE.Vector3(0, 18, 0.001), lerp: 0.06 },
    cinema: { angle: 0, radius: 7, height: 2.5 }
  };

  queryAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      queryAll('.cam-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.id;
      if (id === 'cam-follow') camMode = 'follow';
      else if (id === 'cam-orbit') camMode = 'orbit';
      else if (id === 'cam-top') camMode = 'top';
      else if (id === 'cam-cinema') camMode = 'cinema';
    });
  });

  // ---------- Post-processing (Bloom) — optional, gracefully skipped if not loaded ----------
  let composer = null, bloomPass = null;
  const bloomReady = false
  renderer.toneMappingExposure = 1.4

  // ---------- Mini-map ----------
  const minimap = $('minimap');
  const mmCtx = minimap.getContext('2d');
  function drawMinimap() {
    const w = minimap.width = minimap.offsetWidth * devicePixelRatio;
    const h = minimap.height = minimap.offsetHeight * devicePixelRatio;
    mmCtx.clearRect(0, 0, w, h);
    // background grid
    mmCtx.strokeStyle = 'rgba(79, 245, 231, 0.15)';
    mmCtx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const p = (i / 10) * w;
      mmCtx.beginPath(); mmCtx.moveTo(p, 0); mmCtx.lineTo(p, h); mmCtx.stroke();
      mmCtx.beginPath(); mmCtx.moveTo(0, p * h / w); mmCtx.lineTo(w, p * h / w); mmCtx.stroke();
    }
    // border
    mmCtx.strokeStyle = 'rgba(163, 120, 255, 0.4)';
    mmCtx.lineWidth = 2;
    mmCtx.strokeRect(0, 0, w, h);
    // waypoints
    const worldSize = 22;
    function toMM(v) {
      return {
        x: (v.x / worldSize + 0.5) * w,
        y: (v.z / worldSize + 0.5) * h
      };
    }
    waypoints.forEach((wp, i) => {
      const p = toMM(wp.pos);
      mmCtx.fillStyle = i === wpIndex ? '#4ff5e7' : 'rgba(163, 120, 255, 0.6)';
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 4 * devicePixelRatio, 0, Math.PI * 2);
      mmCtx.fill();
    });
    // path lines
    mmCtx.strokeStyle = 'rgba(79, 245, 231, 0.3)';
    mmCtx.lineWidth = 1;
    mmCtx.setLineDash([4, 4]);
    mmCtx.beginPath();
    waypoints.forEach((wp, i) => {
      const p = toMM(wp.pos);
      if (i === 0) mmCtx.moveTo(p.x, p.y);
      else mmCtx.lineTo(p.x, p.y);
    });
    mmCtx.stroke();
    mmCtx.setLineDash([]);
    // All three avatars on minimap
    const avatarMarkers = [
      { obj: avatar, color: '#4ff5e7', label: 'M' },
      { obj: sage,   color: '#ff6ec7', label: 'S' },
      { obj: echo,   color: '#74ffa8', label: 'E' }
    ];
    avatarMarkers.forEach(m => {
      const p = toMM(m.obj.position);
      // glow ring
      mmCtx.fillStyle = m.color + '33';
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 9 * devicePixelRatio, 0, Math.PI * 2);
      mmCtx.fill();
      // dot
      mmCtx.fillStyle = m.color;
      mmCtx.beginPath();
      mmCtx.arc(p.x, p.y, 5 * devicePixelRatio, 0, Math.PI * 2);
      mmCtx.fill();
      // direction indicator
      const dirLen = 12 * devicePixelRatio;
      const angle = m.obj.rotation.y;
      mmCtx.strokeStyle = m.color;
      mmCtx.lineWidth = 2 * devicePixelRatio;
      mmCtx.beginPath();
      mmCtx.moveTo(p.x, p.y);
      mmCtx.lineTo(p.x + Math.sin(angle) * dirLen, p.y + Math.cos(angle) * dirLen);
      mmCtx.stroke();
    });
    // Speaker pulse — highlight whoever is currently talking
    const speaker = allAvatars[conversation[convIndex].who];
    const sp = toMM(speaker.position);
    const pulseR = (10 + Math.sin(performance.now() * 0.005) * 4) * devicePixelRatio;
    mmCtx.strokeStyle = avatarMarkers[allAvatars.indexOf(speaker)].color;
    mmCtx.lineWidth = 1.5 * devicePixelRatio;
    mmCtx.beginPath();
    mmCtx.arc(sp.x, sp.y, pulseR, 0, Math.PI * 2);
    mmCtx.stroke();
  }

  // ---------- UI updaters ----------
  function updateUIForWaypoint(wp) {
    options.onWaypoint?.(wp);
    $('act-title').textContent = wp.action;
    $('act-sub').textContent = wp.sub;
    $('bc-location').textContent = wp.location;
    $('now-action').textContent = wp.nowAction;
    $('now-title').textContent = wp.nowTitle;
    $('now-body').innerHTML = wp.nowBody;
    // Stat tickers
    const notes = parseInt($('ws-notes').textContent);
    $('ws-notes').textContent = notes + 1;
    const thoughts = parseInt($('ws-thoughts').textContent);
    $('ws-thoughts').textContent = thoughts + Math.floor(Math.random() * 5 + 2);
    if (wp.animType === 'reading') {
      const reads = parseInt($('ws-reads').textContent);
      $('ws-reads').textContent = reads + 1;
    }
    // Vitals jitter
    $('vital-focus').style.width = Math.round(70 + Math.random() * 25) + '%';
    $('vital-energy').style.width = Math.round(60 + Math.random() * 30) + '%';
    $('vital-curiosity').style.width = Math.round(75 + Math.random() * 22) + '%';
  }

  // Progress bar continuous animation
  let nowProgress = 64;
  function updateProgress(dt) {
    nowProgress += dt * (Math.sin(performance.now() * 0.001) * 5);
    nowProgress = Math.max(40, Math.min(95, nowProgress));
    $('now-fill').style.width = nowProgress.toFixed(0) + '%';
    $('now-percent').textContent = nowProgress.toFixed(0) + '%';
  }

  // ---------- Animation loop ----------
  const clock = new THREE.Clock();
  let lastSec = 0;

  function animate() {
    if (!state.animating) return
    state.rafId = requestAnimationFrame(animate)
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.getElapsedTime();

    // ----- Avatar movement -----
    const input = inputRef.current || { mode: 'auto' }
    let manualSpeed = 0

    if (input.mode === 'manual') {
      let mx = 0
      let mz = 0
      if (input.forward) mz -= 1
      if (input.back) mz += 1
      if (input.left) mx -= 1
      if (input.right) mx += 1
      const len = Math.hypot(mx, mz)
      if (len > 0.01) {
        mx /= len
        mz /= len
        const step = moveSpeed * dt
        avatar.position.x += mx * step
        avatar.position.z += mz * step
        const targetAngle = Math.atan2(mx, mz)
        let curAngle = avatar.rotation.y
        let delta = targetAngle - curAngle
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        avatar.rotation.y += delta * Math.min(1, dt * 8)
        applyWalkAnimation(t, true)
        manualSpeed = moveSpeed
        const near = nearestWaypoint(avatar.position)
        if (options.onManualLocation) {
          options.onManualLocation(near)
        } else {
          const bc = $('bc-location')
          if (bc) bc.textContent = near.location
          const actTitle = $('act-title')
          if (actTitle) actTitle.textContent = `${near.location}を探索中`
        }
      } else {
        applyWalkAnimation(t, false)
      }
    } else {
    if (wpPhase === 'walking') {
    const wp = waypoints[wpIndex];
      const target = wp.pos.clone();
      const diff = target.clone().sub(avatar.position);
      diff.y = 0;
      const dist = diff.length();
      if (dist > 0.05) {
        diff.normalize().multiplyScalar(moveSpeed * dt);
        avatar.position.add(diff);
        // rotate toward direction
        const targetAngle = Math.atan2(diff.x, diff.z);
        let curAngle = avatar.rotation.y;
        // shortest angle interpolation
        let delta = targetAngle - curAngle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        avatar.rotation.y += delta * Math.min(1, dt * 6);
        // walking animation
        const swing = Math.sin(t * 9) * 0.6;
        avatar.userData.leftLeg.rotation.x = swing;
        avatar.userData.rightLeg.rotation.x = -swing;
        avatar.userData.leftArm.rotation.x = -swing * 0.5;
        avatar.userData.rightArm.rotation.x = swing * 0.5;
        // bounce
        avatar.position.y = Math.abs(Math.sin(t * 9)) * 0.04;
      } else {
        // Arrived
        avatar.position.y = 0;
        wpPhase = 'staying';
        wpStayTime = 0;
        updateUIForWaypoint(wp);
        // Reset limbs
        avatar.userData.leftLeg.rotation.x = 0;
        avatar.userData.rightLeg.rotation.x = 0;
      }
    } else if (wpPhase === 'staying') {
      wpStayTime += dt;
      // Action-specific animations
      if (wp.animType === 'typing') {
        // arms forward, hands typing
        avatar.userData.leftArm.rotation.x = -1.0 + Math.sin(t * 7) * 0.15;
        avatar.userData.rightArm.rotation.x = -1.0 + Math.sin(t * 7 + Math.PI) * 0.15;
        avatar.userData.head.rotation.x = 0.2;
        avatar.position.y = -0.1; // slight crouch
      } else if (wp.animType === 'reading') {
        // arms holding book
        avatar.userData.leftArm.rotation.x = -0.7;
        avatar.userData.rightArm.rotation.x = -0.7;
        avatar.userData.head.rotation.x = 0.3;
        avatar.position.y = 0;
        // gentle sway
        avatar.userData.head.rotation.y = Math.sin(t * 1.5) * 0.15;
      } else {
        // idle (looking at sky / stars)
        avatar.userData.leftArm.rotation.x = 0;
        avatar.userData.rightArm.rotation.x = 0;
        avatar.userData.head.rotation.x = -0.4;
        avatar.userData.head.rotation.y = Math.sin(t * 0.8) * 0.1;
        avatar.position.y = Math.sin(t * 1.2) * 0.05;
      }
      if (wpStayTime >= wp.duration) {
        wpIndex = (wpIndex + 1) % waypoints.length;
        wpPhase = 'walking';
        avatar.userData.head.rotation.x = 0;
        avatar.userData.head.rotation.y = 0;
      }
    }
    }

    // ----- Avatar effects (core pulse, ring) -----
    const pulse = 1 + Math.sin(t * 3) * 0.15;
    avatar.userData.core.scale.setScalar(pulse);
    avatar.userData.coreHalo.scale.setScalar(1 + Math.sin(t * 3) * 0.3);
    avatar.userData.coreHalo.material.opacity = 0.15 + Math.sin(t * 3) * 0.1;
    avatar.userData.ring.rotation.z += dt * 1.5;
    avatar.userData.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.05);

    // ----- Sage & Echo idle animations -----
    [sage, echo].forEach((av, idx) => {
      const phase = t + idx * 1.7;
      av.userData.core.scale.setScalar(1 + Math.sin(phase * 2.5) * 0.12);
      av.userData.coreHalo.scale.setScalar(1 + Math.sin(phase * 2.5) * 0.25);
      av.userData.coreHalo.material.opacity = 0.15 + Math.sin(phase * 2.5) * 0.08;
      av.userData.ring.rotation.z += dt * (idx === 0 ? 1.1 : -0.85);
      av.userData.head.rotation.y = Math.sin(phase * 0.6) * 0.25;
      av.userData.head.rotation.x = Math.sin(phase * 0.4) * 0.1;
      // gentle bob (anti-gravity hover)
      av.position.y = Math.abs(Math.sin(phase * 1.3)) * 0.04;
      // arm sway
      av.userData.leftArm.rotation.x = Math.sin(phase * 1.1) * 0.18 - 0.1;
      av.userData.rightArm.rotation.x = -Math.sin(phase * 1.1) * 0.18 - 0.1;
      // each avatar slowly rotates to face the current speaker
      const speaker = allAvatars[conversation[convIndex].who];
      if (speaker !== av) {
        const dx = speaker.position.x - av.position.x;
        const dz = speaker.position.z - av.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let curA = av.rotation.y;
        let delta = targetAngle - curA;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        av.rotation.y += delta * Math.min(1, dt * 1.2);
      }
    });

    // ----- Conversation cycle -----
    convTimer += dt;
    if (convTimer >= convDuration) {
      convTimer = 0;
      // hide all bubbles
      allAvatars.forEach(a => { a.userData.bubble.visible = false; });
      convIndex = (convIndex + 1) % conversation.length;
      const line = conversation[convIndex];
      setBubbleText(allAvatars[line.who].userData.bubble, line.text);
    }
    // gentle bubble bob & subtle scale for the active bubble
    allAvatars.forEach(a => {
      if (a.userData.bubble.visible) {
        const s = 1 + Math.sin(t * 4) * 0.04;
        a.userData.bubble.scale.set(3.2 * s, 1.6 * s, 1);
      }
    });

    // ----- Notes float and face avatar -----
    notes.forEach((n, i) => {
      const baseAngle = n.userData.angle + t * 0.15;
      n.position.x = Math.cos(baseAngle) * n.userData.radius;
      n.position.z = Math.sin(baseAngle) * n.userData.radius;
      n.position.y = n.userData.baseY + Math.sin(t * 1.5 + i) * 0.15;
      n.lookAt(camera.position);
    });

    // ----- Particles drift up -----
    const pp = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pp[i*3+1] += particleVelocities[i];
      if (pp[i*3+1] > 9) {
        pp[i*3] = (Math.random() - 0.5) * 18;
        pp[i*3+1] = 0;
        pp[i*3+2] = (Math.random() - 0.5) * 18;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // ----- Stars twinkle -----
    stars.material.opacity = 0.7 + Math.sin(t * 2) * 0.2;

    // ----- Camera -----
    const target = new THREE.Vector3().copy(avatar.position).add(new THREE.Vector3(0, 1.2, 0));
    let desired;
    if (camMode === 'follow') {
      // Follow behind+above avatar
      const off = camControls.follow.offset.clone().applyAxisAngle(new THREE.Vector3(0,1,0), avatar.rotation.y);
      desired = avatar.position.clone().add(off);
    } else if (camMode === 'orbit') {
      camControls.orbit.angle += dt * 0.2;
      desired = new THREE.Vector3(
        Math.cos(camControls.orbit.angle) * camControls.orbit.radius,
        camControls.orbit.height,
        Math.sin(camControls.orbit.angle) * camControls.orbit.radius
      );
    } else if (camMode === 'top') {
      desired = new THREE.Vector3(avatar.position.x, 16, avatar.position.z + 0.5);
    } else { // cinema
      camControls.cinema.angle += dt * 0.08;
      const cinR = 6 + Math.sin(t * 0.3) * 2;
      desired = new THREE.Vector3(
        avatar.position.x + Math.cos(camControls.cinema.angle) * cinR,
        2.5 + Math.sin(t * 0.4) * 1.2,
        avatar.position.z + Math.sin(camControls.cinema.angle) * cinR
      );
    }
    camera.position.lerp(desired, camMode === 'top' ? 0.06 : 0.045);
    camera.lookAt(target);

    // ----- HUD coords update (throttled) -----
    if (t - lastSec > 0.2) {
      lastSec = t;
      $('hud-pos').textContent =
        `X ${avatar.position.x.toFixed(2)} · Y ${avatar.position.y.toFixed(2)} · Z ${avatar.position.z.toFixed(2)}`;
      const speed = input.mode === 'manual' ? manualSpeed : (wpPhase === 'walking' ? moveSpeed : 0);
      const hudSpeed = $('hud-speed')
      if (hudSpeed) hudSpeed.textContent = speed.toFixed(2) + ' m/s';
      // time progress
      const now = new Date();
      $('hud-time').textContent =
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      updateProgress(dt);
      drawMinimap();
    }

    // ----- Render -----
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  // ---------- Resize ----------
  state.onResize = function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
    if (bloomPass) bloomPass.setSize(w, h);
  }
  window.addEventListener('resize', state.onResize);

  // ---------- Boot sequence ----------
  options.onBooted?.();

  const bootMessages = [
    '初期化中 · BOOTSTRAPPING SAPIENTIA',
    '記憶インデックスを読込中 · 142 NOTES',
    'ナレッジグラフを再構築 · 8.3M EDGES',
    'クローン人格モデルを起動 · YUTA-1',
    '仮想空間に投影中 · SAPIENTIA LIBRARY',
    (bloomReady ? 'ポストエフェクト適用 · BLOOM ENABLED' : 'シーン準備完了'),
    'クローンを召喚 · READY'
  ];
  let bootStep = 0;
  state.bootInterval = setInterval(() => {
    bootStep++;
    if (bootStep < bootMessages.length) {
      if (loaderStatus) loaderStatus.textContent = bootMessages[bootStep];
    } else {
      clearInterval(state.bootInterval);
      setTimeout(() => {
        if (loader) loader.classList.add('hide');
      }, 400);
    }
  }, 380);

  // Start animation
  animate();

  })();

  return function cleanup() {
    state.animating = false
    if (state.rafId) cancelAnimationFrame(state.rafId)
    if (state.onResize) window.removeEventListener('resize', state.onResize)
    if (state.bootInterval) clearInterval(state.bootInterval)
    try {
      state.renderer?.dispose?.()
    } catch {
      /* noop */
    }
  }
}
