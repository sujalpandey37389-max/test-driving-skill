import * as THREE from 'three';

// Procedural contact shadow canvas texture
function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const shadowTexture = createRadialShadowTexture();

export interface PlayerCarComponents {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  taillightsMat: THREE.MeshStandardMaterial;
  headlightsMat: THREE.MeshStandardMaterial;
  nitroFlames: THREE.Group;
  bodyMesh: THREE.Mesh;
}

/**
 * Creates a high-fidelity 3-12 part procedural player sports car
 */
export function createPlayerCar(bodyColorHex: string, accentColorHex: string): PlayerCarComponents {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // 1. Contact shadow plane
  const shadowGeo = new THREE.PlaneGeometry(2.4, 4.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // Materials
  const carPaintMat = new THREE.MeshStandardMaterial({
    color: bodyColorHex,
    roughness: 0.25,
    metalness: 0.85,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    roughness: 0.3,
    metalness: 0.7,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.2,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.95,
  });

  const taillightsMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const headlightsMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  // 2. Main lower chassis / body
  const chassisGeo = new THREE.BoxGeometry(1.8, 0.45, 3.8);
  const chassis = new THREE.Mesh(chassisGeo, carPaintMat);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  group.add(chassis);

  // 3. Cabin / Cockpit Roof
  const cabinGeo = new THREE.BoxGeometry(1.4, 0.4, 2.0);
  const cabin = new THREE.Mesh(cabinGeo, carPaintMat);
  cabin.position.set(0, 0.82, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // 4. Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(1.36, 0.36, 1.85);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 0.82, -0.2);
  group.add(windshield);

  // 5. Hood scoop / stripe accent
  const hoodStripeGeo = new THREE.BoxGeometry(0.5, 0.04, 1.4);
  const hoodStripe = new THREE.Mesh(hoodStripeGeo, accentMat);
  hoodStripe.position.set(0, 0.7, 0.9);
  group.add(hoodStripe);

  // 6. Front splitter / bumper
  const splitterGeo = new THREE.BoxGeometry(1.84, 0.08, 0.4);
  const splitter = new THREE.Mesh(splitterGeo, darkTrimMat);
  splitter.position.set(0, 0.24, 1.8);
  group.add(splitter);

  // 7. Headlights
  const headlightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightsMat);
  leftHeadlight.position.set(-0.62, 0.5, 1.88);
  const rightHeadlight = new THREE.Mesh(headlightGeo, headlightsMat);
  rightHeadlight.position.set(0.62, 0.5, 1.88);
  group.add(leftHeadlight, rightHeadlight);

  // 8. Taillights
  const taillightGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
  const leftTaillight = new THREE.Mesh(taillightGeo, taillightsMat);
  leftTaillight.position.set(-0.6, 0.55, -1.9);
  const rightTaillight = new THREE.Mesh(taillightGeo, taillightsMat);
  rightTaillight.position.set(0.6, 0.55, -1.9);
  group.add(leftTaillight, rightTaillight);

  // 9. Rear Spoiler / Wing
  const wingPlankGeo = new THREE.BoxGeometry(1.8, 0.06, 0.35);
  const wingPlank = new THREE.Mesh(wingPlankGeo, accentMat);
  wingPlank.position.set(0, 1.08, -1.65);
  wingPlank.rotation.x = -0.05;

  const stanchionGeo = new THREE.BoxGeometry(0.06, 0.32, 0.15);
  const leftStanchion = new THREE.Mesh(stanchionGeo, darkTrimMat);
  leftStanchion.position.set(-0.6, 0.88, -1.65);
  const rightStanchion = new THREE.Mesh(stanchionGeo, darkTrimMat);
  rightStanchion.position.set(0.6, 0.88, -1.65);
  group.add(wingPlank, leftStanchion, rightStanchion);

  // 10. Dual Chrome Exhausts
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const leftExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
  leftExhaust.position.set(-0.35, 0.28, -1.92);
  const rightExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
  rightExhaust.position.set(0.35, 0.28, -1.92);
  group.add(leftExhaust, rightExhaust);

  // 11. Nitro Flame Cones (hidden until nitro active)
  const nitroFlames = new THREE.Group();
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });
  const flameGeo = new THREE.ConeGeometry(0.12, 0.7, 10);
  flameGeo.rotateX(-Math.PI / 2);

  const leftFlame = new THREE.Mesh(flameGeo, flameMat);
  leftFlame.position.set(-0.35, 0.28, -2.4);
  const rightFlame = new THREE.Mesh(flameGeo, flameMat);
  rightFlame.position.set(0.35, 0.28, -2.4);

  // Core orange inner flame
  const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const innerFlameGeo = new THREE.ConeGeometry(0.06, 0.45, 8);
  innerFlameGeo.rotateX(-Math.PI / 2);
  const leftInner = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  leftInner.position.set(-0.35, 0.28, -2.25);
  const rightInner = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  rightInner.position.set(0.35, 0.28, -2.25);

  nitroFlames.add(leftFlame, rightFlame, leftInner, rightInner);
  nitroFlames.visible = false;
  group.add(nitroFlames);

  // 12. 4 Wheels (Tire + Rim)
  const wheelPositions = [
    [-0.92, 0.32, 1.15],  // front left
    [0.92, 0.32, 1.15],   // front right
    [-0.92, 0.32, -1.15], // rear left
    [0.92, 0.32, -1.15],  // rear right
  ];

  const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e24,
    roughness: 0.9,
    metalness: 0.1,
  });

  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.27, 10);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.2,
    metalness: 0.9,
  });

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Mesh(tireGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);
    wheelGroup.position.set(x, y, z);
    wheelGroup.castShadow = true;
    group.add(wheelGroup);
    wheels.push(wheelGroup);
  });

  return {
    group,
    wheels,
    taillightsMat,
    headlightsMat,
    nitroFlames,
    bodyMesh: chassis,
  };
}

export type TrafficVehicleType = 'sedan' | 'suv' | 'truck' | 'sport' | 'police';

export interface TrafficCarComponents {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  type: TrafficVehicleType;
  policeLights?: { redLight: THREE.Mesh; blueLight: THREE.Mesh };
  lane: number;
  speed: number;
  length: number;
  width: number;
  changingLane?: { targetLane: number; progress: number };
}

/**
 * Creates distinct procedural traffic vehicles with composite parts
 */
export function createTrafficVehicle(type: TrafficVehicleType, colorHex: string): TrafficCarComponents {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const mainMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.6,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.8,
    metalness: 0.2,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.1,
    metalness: 0.8,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.0,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  let length = 4.0;
  let width = 1.9;
  let policeLights: { redLight: THREE.Mesh; blueLight: THREE.Mesh } | undefined;

  // Add contact shadow
  const shadowGeo = new THREE.PlaneGeometry(width + 0.6, length + 0.6);
  const shadowMesh = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // Wheel helpers
  const makeWheels = (xPos: number, zFront: number, zRear: number, radius = 0.32, thickness = 0.26) => {
    const tireGeo = new THREE.CylinderGeometry(radius, radius, thickness, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.85 });

    [
      [-xPos, radius, zFront],
      [xPos, radius, zFront],
      [-xPos, radius, zRear],
      [xPos, radius, zRear],
    ].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(tireGeo, tireMat);
      w.position.set(x, y, z);
      w.castShadow = true;
      group.add(w);
      wheels.push(w);
    });
  };

  if (type === 'truck') {
    length = 7.5;
    width = 2.4;

    // Semi-cab
    const cabGeo = new THREE.BoxGeometry(2.3, 1.8, 2.2);
    const cab = new THREE.Mesh(cabGeo, mainMat);
    cab.position.set(0, 1.15, 2.2);
    cab.castShadow = true;
    group.add(cab);

    // Cab windshield
    const cabWinGeo = new THREE.BoxGeometry(2.1, 0.7, 0.4);
    const cabWin = new THREE.Mesh(cabWinGeo, glassMat);
    cabWin.position.set(0, 1.5, 3.1);
    group.add(cabWin);

    // Cargo Container trailer
    const trailerGeo = new THREE.BoxGeometry(2.4, 2.4, 5.0);
    const trailerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.4,
    });
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.set(0, 1.45, -1.2);
    trailer.castShadow = true;
    group.add(trailer);

    // Truck lights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.85, 0.55, 3.32);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.85, 0.55, 3.32);
    group.add(hlL, hlR);

    // Tail lights on trailer
    const tlGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.9, 0.5, -3.72);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.9, 0.5, -3.72);
    group.add(tlL, tlR);

    // 6 Big Truck Wheels
    makeWheels(1.15, 2.2, -2.6, 0.42, 0.32);
    // extra mid wheels
    const midTireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14);
    midTireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.85 });
    [-1.15, 1.15].forEach((x) => {
      const w = new THREE.Mesh(midTireGeo, tireMat);
      w.position.set(x, 0.42, -1.4);
      group.add(w);
      wheels.push(w);
    });
  } else if (type === 'suv') {
    length = 4.4;
    width = 2.0;

    const bodyGeo = new THREE.BoxGeometry(1.9, 0.7, 4.2);
    const body = new THREE.Mesh(bodyGeo, mainMat);
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    group.add(body);

    const roofGeo = new THREE.BoxGeometry(1.6, 0.65, 2.6);
    const roof = new THREE.Mesh(roofGeo, mainMat);
    roof.position.set(0, 1.25, -0.2);
    group.add(roof);

    const winGeo = new THREE.BoxGeometry(1.55, 0.55, 2.5);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 1.25, -0.2);
    group.add(win);

    // Roof rails
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, 2.4);
    const leftRail = new THREE.Mesh(railGeo, darkTrimMat);
    leftRail.position.set(-0.7, 1.62, -0.2);
    const rightRail = new THREE.Mesh(railGeo, darkTrimMat);
    rightRail.position.set(0.7, 1.62, -0.2);
    group.add(leftRail, rightRail);

    // Lights
    const hlGeo = new THREE.BoxGeometry(0.38, 0.16, 0.1);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.65, 0.65, 2.12);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.65, 0.65, 2.12);
    group.add(hlL, hlR);

    const tlGeo = new THREE.BoxGeometry(0.38, 0.16, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.65, 0.7, -2.12);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.65, 0.7, -2.12);
    group.add(tlL, tlR);

    makeWheels(0.96, 1.25, -1.25, 0.36, 0.28);
  } else if (type === 'police') {
    length = 4.2;
    width = 1.85;

    // Cruiser body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.45, 4.0);
    const policeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, policeMat);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    group.add(body);

    // White door panel
    const doorGeo = new THREE.BoxGeometry(1.82, 0.38, 1.8);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.4 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.46, -0.1);
    group.add(door);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.42, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, policeMat);
    cabin.position.set(0, 0.82, -0.2);
    group.add(cabin);

    const winGeo = new THREE.BoxGeometry(1.36, 0.38, 1.85);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 0.82, -0.2);
    group.add(win);

    // Police lightbar
    const barBaseGeo = new THREE.BoxGeometry(0.8, 0.05, 0.2);
    const barBase = new THREE.Mesh(barBaseGeo, darkTrimMat);
    barBase.position.set(0, 1.05, -0.2);
    group.add(barBase);

    const lightGeo = new THREE.BoxGeometry(0.35, 0.1, 0.16);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const redLight = new THREE.Mesh(lightGeo, redMat);
    redLight.position.set(-0.25, 1.12, -0.2);
    const blueLight = new THREE.Mesh(lightGeo, blueMat);
    blueLight.position.set(0.25, 1.12, -0.2);
    group.add(redLight, blueLight);

    policeLights = { redLight, blueLight };

    // Lights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.62, 0.5, 2.02);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.62, 0.5, 2.02);
    group.add(hlL, hlR);

    const tlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.62, 0.5, -2.02);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.62, 0.5, -2.02);
    group.add(tlL, tlR);

    makeWheels(0.92, 1.2, -1.2, 0.32, 0.24);
  } else {
    // Sedan & Sport
    length = 4.0;
    width = 1.8;

    const bodyGeo = new THREE.BoxGeometry(1.8, 0.44, 3.8);
    const body = new THREE.Mesh(bodyGeo, mainMat);
    body.position.set(0, 0.44, 0);
    body.castShadow = true;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(1.36, 0.4, 1.9);
    const cabin = new THREE.Mesh(cabinGeo, mainMat);
    cabin.position.set(0, 0.8, -0.2);
    group.add(cabin);

    const winGeo = new THREE.BoxGeometry(1.32, 0.36, 1.78);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 0.8, -0.2);
    group.add(win);

    if (type === 'sport') {
      const spoilerGeo = new THREE.BoxGeometry(1.7, 0.05, 0.3);
      const spoiler = new THREE.Mesh(spoilerGeo, darkTrimMat);
      spoiler.position.set(0, 0.95, -1.6);
      group.add(spoiler);
    }

    // Lights
    const hlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.1);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.6, 0.48, 1.92);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.6, 0.48, 1.92);
    group.add(hlL, hlR);

    const tlGeo = new THREE.BoxGeometry(0.32, 0.12, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.6, 0.48, -1.92);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.6, 0.48, -1.92);
    group.add(tlL, tlR);

    makeWheels(0.9, 1.15, -1.15, 0.32, 0.24);
  }

  return {
    group,
    wheels,
    type,
    policeLights,
    lane: 0,
    speed: 0,
    length,
    width,
  };
}

/**
 * Procedural Gold Coin Pickup
 */
export function createCoinMesh(): THREE.Group {
  const group = new THREE.Group();

  const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24);
  coinGeo.rotateZ(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.9,
  });

  const coin = new THREE.Mesh(coinGeo, coinMat);
  group.add(coin);

  // Outer glow ring
  const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  group.position.y = 0.8;
  return group;
}

/**
 * Procedural Nitro Booster Canister Pickup
 */
export function createNitroPickupMesh(): THREE.Group {
  const group = new THREE.Group();

  const tankGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.8, 16);
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8,
  });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  group.add(tank);

  const glowRingGeo = new THREE.TorusGeometry(0.48, 0.05, 8, 20);
  const glowRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ring = new THREE.Mesh(glowRingGeo, glowRingMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  group.position.y = 0.8;
  return group;
}
