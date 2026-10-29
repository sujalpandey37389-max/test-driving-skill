import * as THREE from 'three';
import { GameTheme } from '../types';

export interface EnvironmentThemeColors {
  sky: number;
  fog: number;
  ambient: number;
  sun: number;
  ground: number;
  roadAsphalt: string;
}

export const THEME_CONFIGS: Record<GameTheme, EnvironmentThemeColors> = {
  sunset: {
    sky: 0x2e1065,
    fog: 0x7c2d12,
    ambient: 0xf97316,
    sun: 0xfb923c,
    ground: 0x431407,
    roadAsphalt: '#1e1b2e',
  },
  neon: {
    sky: 0x09090b,
    fog: 0x18182f,
    ambient: 0x6366f1,
    sun: 0xec4899,
    ground: 0x090d16,
    roadAsphalt: '#11131c',
  },
  day: {
    sky: 0x38bdf8,
    fog: 0xbae6fd,
    ambient: 0xffffff,
    sun: 0xfef08a,
    ground: 0x166534,
    roadAsphalt: '#27272a',
  },
};

export const LANE_WIDTH = 3.0;
export const NUM_LANES = 4;
export const ROAD_WIDTH = LANE_WIDTH * NUM_LANES; // 12 units
export const LANE_X_POSITIONS = [-4.5, -1.5, 1.5, 4.5];

/**
 * Creates procedural seamless road texture with dashed lines and borders
 */
export function createRoadTexture(theme: GameTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const cfg = THEME_CONFIGS[theme];

  // Base asphalt
  ctx.fillStyle = cfg.roadAsphalt;
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle asphalt noise
  for (let i = 0; i < 15000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 1024;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  // Left & Right yellow solid boundary lines
  ctx.fillStyle = '#facc15';
  ctx.fillRect(16, 0, 8, 1024);
  ctx.fillRect(512 - 24, 0, 8, 1024);

  // Dashed white lane dividers
  // 3 dividers separating 4 lanes at 25%, 50%, 75%
  const dividers = [128, 256, 384];
  const dashLength = 48;
  const gapLength = 40;
  const totalPeriod = dashLength + gapLength;

  ctx.fillStyle = '#ffffff';
  for (const divX of dividers) {
    for (let y = 0; y < 1024; y += totalPeriod) {
      ctx.fillRect(divX - 3, y, 6, dashLength);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface EnvironmentScene {
  group: THREE.Group;
  roadSegments: THREE.Mesh[];
  roadTexture: THREE.CanvasTexture;
  propsGroup: THREE.Group;
  buildingsGroup: THREE.Group;
  lampLights: THREE.PointLight[];
  update: (speedZ: number, delta: number) => void;
  retheme: (theme: GameTheme, scene: THREE.Scene, dirLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight) => void;
}

export function buildEnvironment(initialTheme: GameTheme): EnvironmentScene {
  const group = new THREE.Group();
  const roadTexture = createRoadTexture(initialTheme);

  // Two infinite road segments that scroll
  const ROAD_SEGMENT_LENGTH = 180;
  const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_SEGMENT_LENGTH);
  roadGeo.rotateX(-Math.PI / 2);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.7,
    metalness: 0.15,
  });

  const roadSegments: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.z = i * ROAD_SEGMENT_LENGTH;
    road.receiveShadow = true;
    group.add(road);
    roadSegments.push(road);
  }

  // Left & Right Guardrails
  const railGeo = new THREE.BoxGeometry(0.3, 0.7, ROAD_SEGMENT_LENGTH * 2);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 });
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-ROAD_WIDTH / 2 - 0.2, 0.35, ROAD_SEGMENT_LENGTH / 2);
  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(ROAD_WIDTH / 2 + 0.2, 0.35, ROAD_SEGMENT_LENGTH / 2);
  group.add(leftRail, rightRail);

  // Ground planes (terrain beyond shoulders)
  const terrainGeo = new THREE.PlaneGeometry(300, ROAD_SEGMENT_LENGTH * 2);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: THEME_CONFIGS[initialTheme].ground,
    roughness: 0.9,
    metalness: 0.05,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.position.set(0, -0.05, ROAD_SEGMENT_LENGTH / 2);
  terrain.receiveShadow = true;
  group.add(terrain);

  // Props: Street lamps and palm trees that cycle along the road
  const propsGroup = new THREE.Group();
  const buildingsGroup = new THREE.Group();
  group.add(propsGroup, buildingsGroup);

  const lampLights: THREE.PointLight[] = [];

  // Create roadside street lamp poles
  const lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 8);
  const lampArmGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
  const lampHeadGeo = new THREE.BoxGeometry(0.4, 0.1, 0.2);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.6 });
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const numLamps = 12;
  const lampSpacing = 28;
  const lampInstances: THREE.Group[] = [];

  for (let i = 0; i < numLamps; i++) {
    const isLeft = i % 2 === 0;
    const xSide = isLeft ? -ROAD_WIDTH / 2 - 1.2 : ROAD_WIDTH / 2 + 1.2;
    const armDir = isLeft ? 1 : -1;

    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(lampPoleGeo, poleMat);
    pole.position.y = 3;
    lamp.add(pole);

    const arm = new THREE.Mesh(lampArmGeo, poleMat);
    arm.position.set(armDir * 0.8, 5.8, 0);
    lamp.add(arm);

    const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
    head.position.set(armDir * 1.5, 5.75, 0);
    lamp.add(head);

    lamp.position.set(xSide, 0, i * lampSpacing - 40);
    propsGroup.add(lamp);
    lampInstances.push(lamp);
  }

  // Distant City Skyline / Cyber Skyscrapers
  const buildingBoxes: THREE.Mesh[] = [];
  const bldgMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.7,
  });

  for (let i = 0; i < 24; i++) {
    const bWidth = 8 + Math.random() * 12;
    const bHeight = 25 + Math.random() * 45;
    const bDepth = 8 + Math.random() * 12;

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMesh = new THREE.Mesh(bGeo, bldgMat);

    const isLeft = i % 2 === 0;
    const x = isLeft ? -25 - Math.random() * 35 : 25 + Math.random() * 35;
    const z = (i * 18) - 50;

    bMesh.position.set(x, bHeight / 2 - 2, z);
    buildingsGroup.add(bMesh);
    buildingBoxes.push(bMesh);
  }

  // Roadside Trees / Palm Trees
  const treeInstances: THREE.Group[] = [];
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.5, 6);
  const foliageGeo = new THREE.ConeGeometry(2.0, 4.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

  for (let i = 0; i < 18; i++) {
    const isLeft = i % 2 === 0;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 5.2;
    tree.add(trunk, foliage);

    const x = isLeft ? -ROAD_WIDTH / 2 - 4.5 - Math.random() * 8 : ROAD_WIDTH / 2 + 4.5 + Math.random() * 8;
    tree.position.set(x, 0, i * 20 - 40);
    propsGroup.add(tree);
    treeInstances.push(tree);
  }

  const update = (speedZ: number, delta: number) => {
    // Scroll road segments backward
    const moveDist = speedZ * delta;

    for (const road of roadSegments) {
      road.position.z -= moveDist;
      if (road.position.z < -ROAD_SEGMENT_LENGTH) {
        road.position.z += ROAD_SEGMENT_LENGTH * 2;
      }
    }

    // Scroll lamps
    for (const lamp of lampInstances) {
      lamp.position.z -= moveDist;
      if (lamp.position.z < -40) {
        lamp.position.z += numLamps * lampSpacing;
      }
    }

    // Scroll trees
    for (const tree of treeInstances) {
      tree.position.z -= moveDist;
      if (tree.position.z < -40) {
        tree.position.z += 18 * 20;
      }
    }

    // Distant buildings scroll slower for parallax depth
    const bldgMoveDist = moveDist * 0.35;
    for (const bldg of buildingBoxes) {
      bldg.position.z -= bldgMoveDist;
      if (bldg.position.z < -60) {
        bldg.position.z += 24 * 18;
      }
    }
  };

  const retheme = (
    newTheme: GameTheme,
    scene: THREE.Scene,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight
  ) => {
    const cfg = THEME_CONFIGS[newTheme];
    scene.background = new THREE.Color(cfg.sky);
    scene.fog = new THREE.FogExp2(cfg.fog, 0.007);
    dirLight.color.setHex(cfg.sun);
    hemiLight.color.setHex(cfg.ambient);
    hemiLight.groundColor.setHex(cfg.ground);
    terrainMat.color.setHex(cfg.ground);

    // Re-generate road texture for theme
    const newTex = createRoadTexture(newTheme);
    roadMat.map = newTex;
    roadMat.needsUpdate = true;
  };

  return {
    group,
    roadSegments,
    roadTexture,
    propsGroup,
    buildingsGroup,
    lampLights,
    update,
    retheme,
  };
}
