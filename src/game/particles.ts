import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 400;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Create a circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  public emitExhaust(x: number, y: number, z: number, isNitro: boolean) {
    if (this.particles.length >= this.maxParticles) return;

    const count = isNitro ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const p: Particle = {
        pos: new THREE.Vector3(
          x + (Math.random() - 0.5) * 0.4,
          y + (Math.random() - 0.5) * 0.1,
          z - 1.8
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.3,
          -12 - Math.random() * 8
        ),
        color: isNitro
          ? new THREE.Color(0x38bdf8)
          : new THREE.Color(0x94a3b8),
        size: isNitro ? 0.8 : 0.45,
        life: 0,
        maxLife: isNitro ? 0.35 : 0.5,
        alpha: 1,
      };
      this.particles.push(p);
    }
  }

  public emitCrashSparks(origin: THREE.Vector3) {
    const burstCount = 60;
    for (let i = 0; i < burstCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      const vy = 2 + Math.random() * 8;

      const p: Particle = {
        pos: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.4, (Math.random() - 0.5) * 0.5)),
        vel: new THREE.Vector3(Math.cos(angle) * speed, vy, Math.sin(angle) * speed),
        color: Math.random() > 0.4 ? new THREE.Color(0xfacc15) : new THREE.Color(0xef4444),
        size: 0.7 + Math.random() * 0.5,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        alpha: 1,
      };
      this.particles.push(p);
    }
  }

  public emitCoinSparkles(origin: THREE.Vector3) {
    const count = 25;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;

      const p: Particle = {
        pos: origin.clone(),
        vel: new THREE.Vector3(Math.cos(angle) * speed, 1 + Math.random() * 4, Math.sin(angle) * speed),
        color: new THREE.Color(0xfef08a),
        size: 0.6,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
        alpha: 1,
      };
      this.particles.push(p);
    }
  }

  public update(delta: number) {
    let writeIdx = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.pos.addScaledVector(p.vel, delta);
      p.vel.y -= 9.8 * delta; // Gravity on sparks
      p.vel.multiplyScalar(0.96); // Air drag

      // Write to buffers
      const progress = p.life / p.maxLife;
      const fade = 1 - progress;

      this.positions[writeIdx * 3] = p.pos.x;
      this.positions[writeIdx * 3 + 1] = Math.max(0.05, p.pos.y);
      this.positions[writeIdx * 3 + 2] = p.pos.z;

      this.colors[writeIdx * 3] = p.color.r * fade;
      this.colors[writeIdx * 3 + 1] = p.color.g * fade;
      this.colors[writeIdx * 3 + 2] = p.color.b * fade;

      writeIdx++;
    }

    // Clear unused slots
    for (let j = writeIdx; j < this.maxParticles; j++) {
      this.positions[j * 3] = 0;
      this.positions[j * 3 + 1] = -999;
      this.positions[j * 3 + 2] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public clear() {
    this.particles = [];
    for (let j = 0; j < this.maxParticles; j++) {
      this.positions[j * 3 + 1] = -999;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
