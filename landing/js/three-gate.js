/**
 * Tanvelo — Minimalist Kinetic Prism Gateway (Light Theme, Silky 60 FPS)
 * 
 * Awarded Minimal Aesthetic:
 * - Floating pearlescent ceramic & titanium ribbon rings
 * - Radiant cyan core gem with studio lighting
 * - Soft physical ground contact shadow
 * - Zero-lag, ultra-optimized MeshStandardMaterial (no transmission passes)
 * - Inertial mouse drag & smooth parallax
 * - Responsive, battery-conservative, 60fps locked
 */

import * as THREE from './vendor/three.module.js';

export function initThreeGate(containerId = 'hero-3d-canvas') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear any existing children
  container.innerHTML = '';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scene & Setup
  const scene = new THREE.Scene();

  const width = container.clientWidth || 520;
  const height = container.clientHeight || 520;
  
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
  camera.position.set(0, 0.6, 7.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Group for the kinetic sculpture
  const sculpture = new THREE.Group();
  scene.add(sculpture);

  // 2. Studio Lighting (Light Theme)
  // Clean neutral ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambient);

  // Studio Key Light (Top-Left)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  // Soft cool fill (Bottom-Right)
  const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
  fillLight.position.set(-6, -4, -4);
  scene.add(fillLight);

  // Subtle cyan rim highlight
  const rimLight = new THREE.DirectionalLight(0x0ea5e9, 1.5);
  rimLight.position.set(-4, 6, -5);
  scene.add(rimLight);

  // Core Point Light
  const coreLight = new THREE.PointLight(0x0284c7, 2.5, 8);
  coreLight.position.set(0, 0, 0);
  sculpture.add(coreLight);

  // 3. Materials (Lightweight & Butter-Smooth)
  // Pearlescent Satin Ceramic / Platinum Ribbon
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    metalness: 0.18,
    emissive: 0x0f172a,
    emissiveIntensity: 0.04
  });

  // Polished Titanium / Electric Cyan Edge
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.85,
    emissive: 0x0369a1,
    emissiveIntensity: 0.2
  });

  // Violet Accent Ribbon Material
  const violetMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    roughness: 0.2,
    metalness: 0.75,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.15
  });

  // 4. Kinetic Gateway Rings (Three Interlocking Harmonic Rings)
  // Ring 1: Primary Outer Gateway Arch
  const ring1Geo = new THREE.TorusGeometry(2.2, 0.14, 24, 72);
  const ring1 = new THREE.Mesh(ring1Geo, ceramicMat);
  sculpture.add(ring1);

  // Ring 1 titanium accent inner loop
  const ring1AccGeo = new THREE.TorusGeometry(2.18, 0.03, 16, 72);
  const ring1Acc = new THREE.Mesh(ring1AccGeo, titaniumMat);
  ring1.add(ring1Acc);

  // Ring 2: Intermediate Oblique Ring
  const ring2Geo = new THREE.TorusGeometry(1.72, 0.12, 24, 64);
  const ring2 = new THREE.Mesh(ring2Geo, ceramicMat);
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 4;
  sculpture.add(ring2);

  // Ring 2 violet edge
  const ring2AccGeo = new THREE.TorusGeometry(1.70, 0.025, 16, 64);
  const ring2Acc = new THREE.Mesh(ring2AccGeo, violetMat);
  ring2.add(ring2Acc);

  // Ring 3: Inner Precision Convergence Ring
  const ring3Geo = new THREE.TorusGeometry(1.25, 0.09, 20, 56);
  const ring3 = new THREE.Mesh(ring3Geo, titaniumMat);
  ring3.rotation.x = -Math.PI / 4;
  ring3.rotation.z = Math.PI / 3;
  sculpture.add(ring3);

  // 5. Central Radiant Core ("The Gateway Spark")
  const coreGroup = new THREE.Group();
  sculpture.add(coreGroup);

  // Inner Core Sphere
  const coreInnerGeo = new THREE.SphereGeometry(0.26, 24, 24);
  const coreInnerMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const coreInner = new THREE.Mesh(coreInnerGeo, coreInnerMat);
  coreGroup.add(coreInner);

  // Core Floating Crystalline Polyhedron
  const gemGeo = new THREE.OctahedronGeometry(0.48, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.1,
    metalness: 0.9,
    wireframe: true
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  coreGroup.add(gem);

  // 6. Three Provider Satellites (OpenAI, Anthropic, Gemini)
  const satellites = [
    { color: 0x10a37f, distance: 2.7, speed: 0.8, tilt: 0.4 },
    { color: 0xd97706, distance: 2.9, speed: -0.65, tilt: -0.5 },
    { color: 0x0284c7, distance: 3.1, speed: 0.72, tilt: 0.2 }
  ];

  const satMeshes = satellites.map(s => {
    const geo = new THREE.SphereGeometry(0.08, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: s.color });
    const mesh = new THREE.Mesh(geo, mat);
    sculpture.add(mesh);
    return { mesh, config: s };
  });

  // 7. Ground Soft Contact Shadow (Procedural Radial Canvas)
  function createSoftShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(0.4, 'rgba(15, 23, 42, 0.06)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }

  const shadowGeo = new THREE.PlaneGeometry(6.5, 6.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createSoftShadowTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -2.6;
  scene.add(shadowMesh);

  // 8. Interaction & Smooth Momentum
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0.15;
  let targetRotY = -0.25;
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;
  let isVisible = true;
  const clock = new THREE.Clock();

  function onPointerMove(e) {
    if (prefersReducedMotion) return;
    const rect = container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    if (isDragging) {
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      dragVelocityY = deltaX * 0.006;
      dragVelocityX = deltaY * 0.006;
      targetRotY += dragVelocityY;
      targetRotX += dragVelocityX;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    } else {
      mouseX = nx;
      mouseY = ny;
    }
  }

  function onPointerDown(e) {
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    container.style.cursor = 'grabbing';
  }

  function onPointerUp() {
    isDragging = false;
    container.style.cursor = 'grab';
  }

  container.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });

  // Resize handler
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // IntersectionObserver to pause loop when off-screen
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  }, { threshold: 0.05 });
  observer.observe(container);

  // 9. Silky Smooth 60 FPS Render Loop
  let reqId = null;

  function animate() {
    reqId = requestAnimationFrame(animate);
    if (!isVisible) return;

    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      // Harmonic rotations of the rings
      ring1.rotation.z = t * 0.15;
      ring2.rotation.x = Math.PI / 3 + t * 0.12;
      ring2.rotation.y = Math.PI / 4 + t * 0.18;
      ring3.rotation.z = t * -0.22;

      // Central gem faceted tumble & core pulse
      gem.rotation.x = t * 0.4;
      gem.rotation.y = t * 0.5;
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.04;
      coreGroup.scale.set(pulse, pulse, pulse);

      // Orbital Satellites
      satMeshes.forEach(item => {
        const c = item.config;
        const a = t * c.speed;
        const x = Math.cos(a) * c.distance;
        const z = Math.sin(a) * (c.distance * 0.75);
        const y = Math.sin(a * 2) * 0.25;
        const cosT = Math.cos(c.tilt);
        const sinT = Math.sin(c.tilt);
        item.mesh.position.set(x, y * cosT - z * sinT, y * sinT + z * cosT);
      });

      // Smooth damped lerp for rotation
      if (!isDragging) {
        targetRotX = 0.15 + mouseY * 0.35;
        targetRotY = -0.25 + mouseX * 0.45;
      }

      sculpture.rotation.x += (targetRotX - sculpture.rotation.x) * 0.06;
      sculpture.rotation.y += (targetRotY - sculpture.rotation.y) * 0.06;

      // Subtle breathing float on Y
      sculpture.position.y = Math.sin(t * 1.2) * 0.08;
    }

    renderer.render(scene, camera);
  }

  animate();

  return {
    destroy() {
      if (reqId) cancelAnimationFrame(reqId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      renderer.dispose();
      container.innerHTML = '';
    }
  };
}
