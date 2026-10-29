import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameState, GameStats, GameTheme, InputState, CAR_COLORS } from '../types';
import { soundManager } from '../audio/soundManager';
import {
  createPlayerCar,
  PlayerCarComponents,
  createTrafficVehicle,
  TrafficCarComponents,
  TrafficVehicleType,
  createCoinMesh,
  createNitroPickupMesh,
} from './proceduralModels';
import {
  buildEnvironment,
  EnvironmentScene,
  LANE_X_POSITIONS,
  THEME_CONFIGS,
  ROAD_WIDTH,
} from './environment';
import { ParticleSystem } from './particles';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
  onNearMiss: (bonus: number, combo: number) => void;
  onCoinCollect: (coins: number) => void;
  onNitroPickup: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  private environment: EnvironmentScene;
  private particles: ParticleSystem;

  private playerCar: PlayerCarComponents;
  private traffic: TrafficCarComponents[] = [];
  private pickups: { mesh: THREE.Group; type: 'coin' | 'nitro'; lane: number; z: number }[] = [];

  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private clock: THREE.Clock;
  private isDestroyed: boolean = false;

  // Game state
  private gameState: GameState = 'MENU';
  private currentTheme: GameTheme = 'sunset';
  private selectedCarColorId: string = 'crimson';

  // Stats
  private stats: GameStats = {
    score: 0,
    distance: 0,
    coins: 0,
    nearMisses: 0,
    currentSpeed: 0,
    maxSpeedReached: 0,
    nitro: 50,
    multiplier: 1,
  };

  // High score tracking
  private highScore: number = 0;

  // Player physics
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelX: number = 0;
  private currentForwardSpeed: number = 0; // units/sec in Three.js world
  private targetForwardSpeed: number = 0;
  private steerAngle: number = 0;
  private bodyRoll: number = 0;

  // Speed configs (1 Three.js unit ~ 4 meters)
  private readonly MIN_SPEED = 24; // ~90 km/h
  private readonly BASE_SPEED = 32; // ~120 km/h
  private readonly MAX_SPEED_CAP = 75; // ~280 km/h
  private currentBaseSpeed = 32;

  // Inputs
  public inputs: InputState = {
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
    horn: false,
  };

  // Camera & Effects
  private cameraBaseOffset = new THREE.Vector3(0, 3.4, -6.8);
  private cameraLookOffset = new THREE.Vector3(0, 1.2, 5.0);
  private cameraShakeIntensity: number = 0;
  private hitstopTimer: number = 0;
  private nearMissCooldown: number = 0;
  private trafficSpawnTimer: number = 0;
  private pickupSpawnTimer: number = 0;
  private titlePanAngle: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Load high score
    const saved = localStorage.getItem('turbo_racer_high_score');
    this.highScore = saved ? parseInt(saved, 10) : 0;

    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    const cfg = THEME_CONFIGS[this.currentTheme];
    this.scene.background = new THREE.Color(cfg.sky);
    this.scene.fog = new THREE.FogExp2(cfg.fog, 0.007);

    this.camera = new THREE.PerspectiveCamera(
      65,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 4.5, -9);

    // 4. Lighting Rig (Key + Fill + Horizon)
    this.hemiLight = new THREE.HemisphereLight(cfg.ambient, cfg.ground, 0.9);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(cfg.sun, 1.8);
    this.dirLight.position.set(15, 28, -12);
    this.dirLight.castShadow = !this.isSoftwareGl;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 100;
      this.dirLight.shadow.camera.left = -16;
      this.dirLight.shadow.camera.right = 16;
      this.dirLight.shadow.camera.top = 25;
      this.dirLight.shadow.camera.bottom = -25;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // Procedural RoomEnvironment reflection map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Environment & Particles
    this.environment = buildEnvironment(this.currentTheme);
    this.scene.add(this.environment.group);

    this.particles = new ParticleSystem(this.scene);

    // 6. Player Car
    const initColor = CAR_COLORS[0];
    this.playerCar = createPlayerCar(initColor.bodyColor, initColor.accentColor);
    this.scene.add(this.playerCar.group);

    // Event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('blur', this.onBlur);

    // Start loop
    this.startLoop();
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onBlur = () => {
    this.inputs = {
      steerLeft: false,
      steerRight: false,
      accelerate: false,
      brake: false,
      nitro: false,
      horn: false,
    };
    soundManager.stopHorn();
  };

  public setGameState(state: GameState) {
    const prevState = this.gameState;
    this.gameState = state;

    if (state === 'PLAYING') {
      if (prevState === 'MENU' || prevState === 'GAMEOVER') {
        this.resetGame();
      }
      soundManager.startEngine();
    } else if (state === 'PAUSED') {
      soundManager.stopEngine();
      soundManager.stopTireScreech();
      soundManager.stopHorn();
    } else if (state === 'GAMEOVER') {
      soundManager.stopEngine();
      soundManager.stopTireScreech();
      soundManager.stopHorn();
    } else if (state === 'MENU') {
      soundManager.stopEngine();
      soundManager.stopTireScreech();
      soundManager.stopHorn();
      this.resetPlayerToCenter();
    }
  }

  public setTheme(theme: GameTheme) {
    this.currentTheme = theme;
    this.environment.retheme(theme, this.scene, this.dirLight, this.hemiLight);
  }

  public setCarColor(colorId: string) {
    this.selectedCarColorId = colorId;
    const preset = CAR_COLORS.find((c) => c.id === colorId) || CAR_COLORS[0];

    // Replace player car with new color
    this.scene.remove(this.playerCar.group);
    this.playerCar = createPlayerCar(preset.bodyColor, preset.accentColor);
    this.playerCar.group.position.copy(this.playerPos);
    this.scene.add(this.playerCar.group);
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public resetGame() {
    this.stats = {
      score: 0,
      distance: 0,
      coins: 0,
      nearMisses: 0,
      currentSpeed: 0,
      maxSpeedReached: 0,
      nitro: 60,
      multiplier: 1,
    };

    this.currentBaseSpeed = this.BASE_SPEED;
    this.currentForwardSpeed = this.BASE_SPEED;
    this.targetForwardSpeed = this.BASE_SPEED;
    this.playerPos.set(0, 0, 0);
    this.playerVelX = 0;
    this.steerAngle = 0;
    this.bodyRoll = 0;
    this.cameraShakeIntensity = 0;
    this.hitstopTimer = 0;
    this.trafficSpawnTimer = 0;
    this.pickupSpawnTimer = 0;

    // Clear traffic
    for (const t of this.traffic) {
      this.scene.remove(t.group);
    }
    this.traffic = [];

    // Clear pickups
    for (const p of this.pickups) {
      this.scene.remove(p.mesh);
    }
    this.pickups = [];
    this.particles.clear();

    this.callbacks.onStatsUpdate(this.stats);
  }

  private resetPlayerToCenter() {
    this.playerPos.set(0, 0, 0);
    this.playerCar.group.position.set(0, 0, 0);
    this.playerCar.group.rotation.set(0, 0, 0);
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private update(dt: number) {
    if (this.gameState === 'MENU') {
      this.updateMenuAnimation(dt);
      return;
    }

    if (this.gameState === 'PAUSED') {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      // Shake during hitstop
      this.applyCameraShake(dt);
      return;
    }

    if (this.gameState === 'PLAYING') {
      this.updatePlayingState(dt);
    } else if (this.gameState === 'GAMEOVER') {
      this.updateGameOverState(dt);
    }
  }

  private updateMenuAnimation(dt: number) {
    this.titlePanAngle += dt * 0.4;

    // Slowly scroll road in background for a live dynamic scene!
    this.environment.update(12, dt);

    // Orbit camera gracefully around hero player car
    const camRadius = 7.5;
    const camHeight = 2.4;
    this.camera.position.x = Math.sin(this.titlePanAngle) * camRadius;
    this.camera.position.z = Math.cos(this.titlePanAngle) * camRadius;
    this.camera.position.y = camHeight + Math.sin(this.titlePanAngle * 2) * 0.3;
    this.camera.lookAt(0, 0.7, 0);

    // Subtle breathing car hover
    this.playerCar.group.position.y = Math.sin(this.titlePanAngle * 3) * 0.04;
  }

  private updatePlayingState(dt: number) {
    // 1. Accelerate progressive difficulty: base speed rises with distance
    const speedRamp = Math.min(this.stats.distance / 1200, 1.0); // 0 to 1 over 1.2km
    this.currentBaseSpeed = this.BASE_SPEED + speedRamp * 26; // up to ~220 km/h

    // 2. Handle Inputs & Speed Targets
    let targetSpeed = this.currentBaseSpeed;
    const isNitroActive = this.inputs.nitro && this.stats.nitro > 0;

    if (isNitroActive) {
      targetSpeed += 22; // nitro thrust
      this.stats.nitro = Math.max(0, this.stats.nitro - dt * 25);
      this.playerCar.nitroFlames.visible = true;
      this.particles.emitExhaust(this.playerPos.x, this.playerPos.y + 0.3, this.playerPos.z, true);
    } else {
      this.playerCar.nitroFlames.visible = false;
      // Passive nitro trickle recharge
      this.stats.nitro = Math.min(100, this.stats.nitro + dt * 2);
    }

    if (this.inputs.accelerate) {
      targetSpeed += 12;
    } else if (this.inputs.brake) {
      targetSpeed = Math.max(this.MIN_SPEED, targetSpeed - 18);
    }

    // Smooth speed interpolation
    const accelRate = this.inputs.brake ? 3.5 : 1.8;
    this.currentForwardSpeed = THREE.MathUtils.damp(this.currentForwardSpeed, targetSpeed, accelRate, dt);

    // Brake lights response
    if (this.inputs.brake) {
      this.playerCar.taillightsMat.emissiveIntensity = 3.0;
    } else {
      this.playerCar.taillightsMat.emissiveIntensity = 0.9;
    }

    // Horn input
    if (this.inputs.horn) {
      soundManager.startHorn();
    } else {
      soundManager.stopHorn();
    }

    // 3. Lateral Steering Physics
    const steerForce = 22;
    let targetVelX = 0;
    if (this.inputs.steerLeft) targetVelX -= steerForce;
    if (this.inputs.steerRight) targetVelX += steerForce;

    this.playerVelX = THREE.MathUtils.damp(this.playerVelX, targetVelX, 7.5, dt);
    this.playerPos.x += this.playerVelX * dt;

    // Highway road boundaries constraint
    const maxRoadX = (ROAD_WIDTH / 2) - 1.1;
    if (this.playerPos.x < -maxRoadX) {
      this.playerPos.x = -maxRoadX;
      this.playerVelX = 0;
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.15);
    } else if (this.playerPos.x > maxRoadX) {
      this.playerPos.x = maxRoadX;
      this.playerVelX = 0;
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.15);
    }

    // Dynamic car body lean & wheel turn
    const targetRoll = (-this.playerVelX / steerForce) * 0.12;
    this.bodyRoll = THREE.MathUtils.damp(this.bodyRoll, targetRoll, 8.0, dt);
    this.playerCar.group.rotation.z = this.bodyRoll;
    this.playerCar.group.rotation.y = (-this.playerVelX / steerForce) * 0.15;

    // Wheel rotation speed
    const wheelRotSpeed = this.currentForwardSpeed * 1.8 * dt;
    for (const w of this.playerCar.wheels) {
      w.rotation.x += wheelRotSpeed;
    }

    // Tire screech sound on sharp steering
    const steerIntensity = Math.abs(this.playerVelX) / steerForce;
    if (steerIntensity > 0.65) {
      soundManager.playTireScreech(steerIntensity);
    } else {
      soundManager.stopTireScreech();
    }

    // Exhaust particles
    if (Math.random() > 0.35) {
      this.particles.emitExhaust(this.playerPos.x, this.playerPos.y + 0.3, this.playerPos.z, isNitroActive);
    }

    this.playerCar.group.position.copy(this.playerPos);

    // 4. Update Audio Engine
    const speedNorm = (this.currentForwardSpeed - this.MIN_SPEED) / (this.MAX_SPEED_CAP - this.MIN_SPEED);
    soundManager.updateEngine(speedNorm, isNitroActive);

    // 5. Update Environment
    this.environment.update(this.currentForwardSpeed, dt);

    // 6. Distance & Score Tracking
    const kmhSpeed = Math.round(this.currentForwardSpeed * 3.6);
    const distDelta = (this.currentForwardSpeed * dt) * 1.2;
    this.stats.distance += distDelta;
    this.stats.currentSpeed = kmhSpeed;
    if (kmhSpeed > this.stats.maxSpeedReached) {
      this.stats.maxSpeedReached = kmhSpeed;
    }
    this.stats.score += Math.round(distDelta * 1.5 * this.stats.multiplier);

    // Check & save high score
    if (this.stats.score > this.highScore) {
      this.highScore = this.stats.score;
      localStorage.setItem('turbo_racer_high_score', String(this.highScore));
    }

    // 7. Update Traffic & Collision Detection
    this.updateTraffic(dt);

    // 8. Update Pickups (Coins / Nitro)
    this.updatePickups(dt);

    // 9. Update Particles
    this.particles.update(dt);

    // 10. Update Camera & FOV Speed Sensation
    this.updateCamera(dt, speedNorm, isNitroActive);

    // 11. Cooldowns
    if (this.nearMissCooldown > 0) this.nearMissCooldown -= dt;

    // Send updated stats to React HUD
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private updateGameOverState(dt: number) {
    // Decelerate after crash
    this.currentForwardSpeed = THREE.MathUtils.damp(this.currentForwardSpeed, 0, 2.5, dt);
    this.environment.update(this.currentForwardSpeed, dt);
    this.particles.update(dt);
    this.applyCameraShake(dt);

    // Slowly push camera back for dramatic wreck view
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.playerPos.z - 9, 2, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 4.0, 2, dt);
    this.camera.lookAt(this.playerPos.x, 0.5, this.playerPos.z);
  }

  private updateTraffic(dt: number) {
    this.trafficSpawnTimer += dt;

    // Spawn traffic ahead (z = 90 to 140)
    // Faster spawn rate as distance increases
    const spawnInterval = Math.max(0.85, 2.2 - (this.stats.distance / 1000) * 0.9);
    if (this.trafficSpawnTimer >= spawnInterval && this.traffic.length < 9) {
      this.trafficSpawnTimer = 0;
      this.spawnTrafficCar();
    }

    const playerBox = new THREE.Box3().setFromObject(this.playerCar.bodyMesh);
    // Slightly shrink player collision box for fair, tight hitbox
    playerBox.min.x += 0.25;
    playerBox.max.x -= 0.25;
    playerBox.min.z += 0.35;
    playerBox.max.z -= 0.35;

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];

      // Move traffic relative to player
      // Relative speed = traffic's own forward speed minus player forward speed
      const relativeZ = (car.speed - this.currentForwardSpeed) * dt;
      car.group.position.z += relativeZ;

      // Animate wheels
      const wheelRot = car.speed * 1.6 * dt;
      for (const w of car.wheels) {
        w.rotation.x += wheelRot;
      }

      // Police flashing lightbar
      if (car.policeLights) {
        const flashPhase = (Date.now() / 120) % 2 > 1;
        car.policeLights.redLight.visible = flashPhase;
        car.policeLights.blueLight.visible = !flashPhase;
      }

      // Lane switching AI
      if (car.changingLane) {
        const laneX = LANE_X_POSITIONS[car.changingLane.targetLane];
        car.changingLane.progress += dt * 1.8;
        car.group.position.x = THREE.MathUtils.lerp(
          LANE_X_POSITIONS[car.lane],
          laneX,
          Math.min(car.changingLane.progress, 1)
        );
        if (car.changingLane.progress >= 1) {
          car.lane = car.changingLane.targetLane;
          car.changingLane = undefined;
        }
      } else if (Math.random() < 0.003 && Math.abs(car.group.position.z - this.playerPos.z) > 15) {
        // Occasionally initiate a lane change
        const dir = Math.random() > 0.5 ? 1 : -1;
        const target = car.lane + dir;
        if (target >= 0 && target < LANE_X_POSITIONS.length) {
          car.changingLane = { targetLane: target, progress: 0 };
        }
      }

      // Traffic Collision Check
      const trafficBox = new THREE.Box3().setFromObject(car.group);
      trafficBox.min.x += 0.2;
      trafficBox.max.x -= 0.2;

      if (playerBox.intersectsBox(trafficBox)) {
        this.triggerCrash(car);
        return;
      }

      // Near-Miss detection
      // If player passed car closely at high speed without hitting
      if (
        this.nearMissCooldown <= 0 &&
        Math.abs(car.group.position.z - this.playerPos.z) < 2.5 &&
        Math.abs(car.group.position.x - this.playerPos.x) < 2.3 &&
        Math.abs(car.group.position.x - this.playerPos.x) > 1.2 &&
        this.currentForwardSpeed > this.BASE_SPEED
      ) {
        this.triggerNearMiss();
      }

      // Despawn traffic when far behind or far ahead
      if (car.group.position.z < -25 || car.group.position.z > 160) {
        this.scene.remove(car.group);
        this.traffic.splice(i, 1);
      }
    }
  }

  private spawnTrafficCar() {
    // Pick lane
    const availableLanes = [0, 1, 2, 3];
    // Filter out lanes that currently have a car near spawn point z ~ 110
    const filteredLanes = availableLanes.filter((laneIdx) => {
      return !this.traffic.some((t) => t.lane === laneIdx && t.group.position.z > 85);
    });

    if (filteredLanes.length === 0) return;
    const lane = filteredLanes[Math.floor(Math.random() * filteredLanes.length)];

    // Vehicle types & colors
    const types: TrafficVehicleType[] = ['sedan', 'suv', 'truck', 'sport', 'police'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const colors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#e2e8f0', '#0f172a'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const car = createTrafficVehicle(chosenType, chosenColor);
    car.lane = lane;
    car.group.position.set(LANE_X_POSITIONS[lane], 0, 105 + Math.random() * 25);

    // Speed: trucks slower, sports faster
    let speedMult = 0.55;
    if (chosenType === 'truck') speedMult = 0.42;
    else if (chosenType === 'sport') speedMult = 0.72;
    else if (chosenType === 'police') speedMult = 0.65;

    car.speed = this.currentBaseSpeed * (speedMult + Math.random() * 0.15);

    this.scene.add(car.group);
    this.traffic.push(car);
  }

  private updatePickups(dt: number) {
    this.pickupSpawnTimer += dt;
    if (this.pickupSpawnTimer >= 2.6 && this.pickups.length < 5) {
      this.pickupSpawnTimer = 0;
      this.spawnPickup();
    }

    const playerBox = new THREE.Box3().setFromObject(this.playerCar.bodyMesh);

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.z -= this.currentForwardSpeed * dt;
      p.mesh.position.z = p.z;

      // Animate rotation & bobbing
      p.mesh.rotation.y += dt * 3.5;
      p.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.005 + p.lane) * 0.15;

      const pickupBox = new THREE.Box3().setFromObject(p.mesh);

      // Collect check
      if (playerBox.intersectsBox(pickupBox)) {
        if (p.type === 'coin') {
          this.stats.coins += 1;
          this.stats.score += 500 * this.stats.multiplier;
          soundManager.playCoin();
          this.particles.emitCoinSparkles(p.mesh.position);
          this.callbacks.onCoinCollect(this.stats.coins);
        } else if (p.type === 'nitro') {
          this.stats.nitro = Math.min(100, this.stats.nitro + 45);
          soundManager.playNitroWhoosh();
          this.callbacks.onNitroPickup();
        }

        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      // Despawn if passed
      if (p.z < -20) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  private spawnPickup() {
    const isNitro = Math.random() > 0.75;
    const mesh = isNitro ? createNitroPickupMesh() : createCoinMesh();
    const lane = Math.floor(Math.random() * LANE_X_POSITIONS.length);
    const z = 95 + Math.random() * 20;

    mesh.position.set(LANE_X_POSITIONS[lane], 0.8, z);
    this.scene.add(mesh);

    this.pickups.push({
      mesh,
      type: isNitro ? 'nitro' : 'coin',
      lane,
      z,
    });
  }

  private triggerNearMiss() {
    this.nearMissCooldown = 0.8;
    this.stats.nearMisses += 1;
    this.stats.multiplier = Math.min(5, this.stats.multiplier + 1);
    const bonus = 150 * this.stats.multiplier;
    this.stats.score += bonus;

    soundManager.playNearMiss();
    this.callbacks.onNearMiss(bonus, this.stats.multiplier);
  }

  private triggerCrash(hitCar: TrafficCarComponents) {
    this.setGameState('GAMEOVER');

    // Juice: Hitstop & intense camera shake
    this.hitstopTimer = 0.08;
    this.cameraShakeIntensity = 0.85;

    // Crash sound
    soundManager.playCrash();

    // Visual sparks & debris
    const crashOrigin = this.playerPos.clone().add(hitCar.group.position).multiplyScalar(0.5);
    this.particles.emitCrashSparks(crashOrigin);

    // Turn car violently
    this.playerCar.group.rotation.y = (Math.random() > 0.5 ? 1 : -1) * 0.7;
    this.playerCar.group.rotation.z = 0.4;

    this.callbacks.onGameOver({ ...this.stats });
  }

  private updateCamera(dt: number, speedNorm: number, isNitro: boolean) {
    // Dynamic FOV for speed sensation (zoom-out tunnel vision)
    const targetFov = 65 + speedNorm * 12 + (isNitro ? 8 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
    this.camera.updateProjectionMatrix();

    // Smooth camera chase
    const targetCamX = this.playerPos.x * 0.65;
    const targetCamY = this.cameraBaseOffset.y + Math.abs(this.bodyRoll) * 0.4;
    const targetCamZ = this.playerPos.z + this.cameraBaseOffset.z - speedNorm * 0.8;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 9.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 7.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 9.0, dt);

    // Look at point ahead of car
    const lookTarget = new THREE.Vector3(
      this.playerPos.x * 0.8,
      this.cameraLookOffset.y,
      this.playerPos.z + this.cameraLookOffset.z
    );
    this.camera.lookAt(lookTarget);

    this.applyCameraShake(dt);
  }

  private applyCameraShake(dt: number) {
    if (this.cameraShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.6;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.6;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.cameraShakeIntensity = THREE.MathUtils.damp(this.cameraShakeIntensity, 0, 5.0, dt);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('blur', this.onBlur);

    soundManager.stopEngine();
    soundManager.stopTireScreech();
    soundManager.stopHorn();

    this.particles.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
