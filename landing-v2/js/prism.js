/**
 * Tanvelo — "The Monolith" 3D key visual
 *
 * A smoked-glass slab floats over a dark stage. Three provider light trails
 * converge into a warm seam and leave as a single beam: many models, one
 * contract. The scene is intentionally quiet — no particles-as-confetti,
 * no camera tricks, no scroll hijacking.
 *
 * Interactions:
 *  - idle float + a slow breathing seam
 *  - damped pointer parallax
 *  - horizontal drag to orbit (vertical scroll remains native on touch)
 *  - pauses offscreen and when the tab is hidden
 *  - static composition for prefers-reduced-motion
 *  - graceful CSS fallback if WebGL is unavailable
 */

import * as THREE from "./vendor/three.module.js";

const GLOW_TEXTURE = createGlowTexture();

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.42, "rgba(255,255,255,0.22)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEnvironmentTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "#24201d");
  base.addColorStop(0.35, "#12100e");
  base.addColorStop(0.7, "#090807");
  base.addColorStop(1, "#030303");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  // Warm key glow, upper left
  let glow = ctx.createRadialGradient(260, 150, 0, 260, 150, 300);
  glow.addColorStop(0, "rgba(255,226,198,0.95)");
  glow.addColorStop(0.22, "rgba(255,190,145,0.5)");
  glow.addColorStop(1, "rgba(255,160,110,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1024, 512);

  // Cool rim, right side
  glow = ctx.createRadialGradient(790, 230, 0, 790, 230, 270);
  glow.addColorStop(0, "rgba(150,175,255,0.5)");
  glow.addColorStop(0.45, "rgba(100,125,220,0.16)");
  glow.addColorStop(1, "rgba(80,100,200,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1024, 512);

  // Thin horizontal reflection strip
  const strip = ctx.createLinearGradient(0, 240, 0, 290);
  strip.addColorStop(0, "rgba(255,255,255,0)");
  strip.addColorStop(0.5, "rgba(255,236,215,0.22)");
  strip.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = strip;
  ctx.fillRect(0, 240, 1024, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createRoundedSlab(width, height, depth, radius) {
  const shape = roundedRectShape(width, height, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.045,
    bevelSegments: 5,
    curveSegments: 14
  });
  geometry.center();
  return geometry;
}

function createGlowSprite(color, opacity, scaleX, scaleY) {
  const material = new THREE.SpriteMaterial({
    map: GLOW_TEXTURE,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

function createThread(points, color, radius, opacity) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    "catmullrom",
    0.35
  );

  const group = new THREE.Group();

  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: opacity * 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glowThread = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, radius * 3.2, 5, false),
    glowMaterial
  );
  group.add(glowThread);

  const coreMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coreThread = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 96, radius, 6, false),
    coreMaterial
  );
  group.add(coreThread);

  return { group, curve, color };
}

export function initGatewayScene(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const stage = container.closest(".stage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.warn("Tanvelo 3D: WebGL unavailable.", error);
    if (stage) stage.classList.add("has-fallback");
    return null;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0807, 0.032);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.32, 9.3);
  camera.lookAt(0, 0.02, 0);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ---------------------------------------------------------------------
  // Lighting & environment
  // ---------------------------------------------------------------------
  const environment = createEnvironmentTexture();
  scene.environment = environment;

  const hemisphere = new THREE.HemisphereLight(0xffefdf, 0x050505, 0.28);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffddbc, 3.4);
  keyLight.position.set(-4.5, 6.5, 6.5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x91a8ff, 3.1);
  rimLight.position.set(5.5, 2.4, -5.5);
  scene.add(rimLight);

  const lowFill = new THREE.PointLight(0xff6a3c, 0.0, 6, 2);
  lowFill.position.set(-2.2, -1.2, 3.8);
  scene.add(lowFill);

  const seamLight = new THREE.PointLight(0xff7a45, 4.2, 5.5, 2);
  seamLight.position.set(0, 0, 1.65);
  scene.add(seamLight);

  // ---------------------------------------------------------------------
  // The monolith
  // ---------------------------------------------------------------------
  const world = new THREE.Group();
  scene.add(world);

  const monolith = new THREE.Group();
  monolith.rotation.set(-0.015, -0.27, -0.012);
  world.add(monolith);

  const slabMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0b0a09,
    metalness: 0.34,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.11,
    transmission: 0.14,
    thickness: 1.9,
    ior: 1.46,
    envMapIntensity: 1.28
  });

  const fresnelMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xffb38b) },
      uCool: { value: new THREE.Color(0x93a9ff) },
      uIntensity: { value: 0.34 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uCool;
      uniform float uIntensity;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;

      void main() {
        float facing = 1.0 - abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float rim = pow(facing, 2.7);
        float warmSide = smoothstep(-0.9, 0.6, vWorldNormal.x);
        vec3 color = mix(uCool, uColor, warmSide);
        gl_FragColor = vec4(color, rim * uIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide
  });

  const slabWidth = 2.0;
  const slabDepth = 0.46;
  const halfHeight = 1.46;
  const gap = 0.045;

  const topGeometry = createRoundedSlab(slabWidth, halfHeight, slabDepth, 0.17);
  const bottomGeometry = createRoundedSlab(slabWidth, halfHeight, slabDepth, 0.17);

  const topSlab = new THREE.Mesh(topGeometry, slabMaterial);
  topSlab.position.y = gap + halfHeight / 2;
  monolith.add(topSlab);

  const bottomSlab = new THREE.Mesh(bottomGeometry, slabMaterial);
  bottomSlab.position.y = -gap - halfHeight / 2;
  monolith.add(bottomSlab);

  const topFresnel = new THREE.Mesh(topGeometry, fresnelMaterial);
  topFresnel.position.copy(topSlab.position);
  topFresnel.scale.setScalar(1.006);
  monolith.add(topFresnel);

  const bottomFresnel = new THREE.Mesh(bottomGeometry, fresnelMaterial);
  bottomFresnel.position.copy(bottomSlab.position);
  bottomFresnel.scale.setScalar(1.006);
  monolith.add(bottomFresnel);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xd9b49a,
    transparent: true,
    opacity: 0.11
  });
  [topSlab, bottomSlab].forEach((slab) => {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(slab.geometry, 38),
      edgeMaterial
    );
    edges.position.copy(slab.position);
    monolith.add(edges);
  });

  // Seam
  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(slabWidth - 0.24, 0.043, slabDepth + 0.035),
    new THREE.MeshBasicMaterial({ color: 0xffe2c8 })
  );
  monolith.add(seam);

  const seamInner = new THREE.Mesh(
    new THREE.BoxGeometry(slabWidth - 0.46, 0.014, slabDepth + 0.06),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  monolith.add(seamInner);

  const seamHaloWide = createGlowSprite(0xff6a3a, 0.2, 3.7, 0.95);
  seamHaloWide.position.set(0, 0, 0.38);
  monolith.add(seamHaloWide);

  const seamHaloCore = createGlowSprite(0xffd6b4, 0.38, 1.9, 0.44);
  seamHaloCore.position.set(0, 0, 0.44);
  monolith.add(seamHaloCore);

  // A faint mark, etched at the base
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.012, 0.006),
    new THREE.MeshBasicMaterial({
      color: 0xffc4a4,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    })
  );
  mark.position.set(0, -1.1, slabDepth / 2 + 0.06);
  monolith.add(mark);

  // ---------------------------------------------------------------------
  // Provider light trails
  // ---------------------------------------------------------------------
  const threadSpecs = [
    {
      color: 0x10a37f,
      points: [
        [-4.15, 2.35, 1.0],
        [-3.0, 1.55, 0.9],
        [-1.7, 0.55, 0.55],
        [-0.66, 0.045, 0.33]
      ]
    },
    {
      color: 0xd97757,
      points: [
        [-4.35, 0.28, 0.78],
        [-3.0, 0.22, 0.68],
        [-1.7, 0.1, 0.48],
        [-0.82, 0.012, 0.33]
      ]
    },
    {
      color: 0x6c8cff,
      points: [
        [-4.15, -1.85, 1.0],
        [-3.0, -1.18, 0.9],
        [-1.7, -0.4, 0.55],
        [-0.6, -0.035, 0.33]
      ]
    }
  ];

  const threads = [];
  threadSpecs.forEach((spec) => {
    const thread = createThread(spec.points, spec.color, 0.0095, 0.5);
    world.add(thread.group);

    const startGlow = createGlowSprite(spec.color, 0.38, 0.5, 0.5);
    startGlow.position.set(...spec.points[0]);
    world.add(startGlow);

    thread.startGlow = startGlow;
    thread.particles = [];
    thread.speed = 0.055 + Math.random() * 0.02;
    thread.offset = Math.random() * 0.7;

    for (let i = 0; i < 2; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      const particleGlow = createGlowSprite(spec.color, 0.5, 0.2, 0.2);
      particle.add(particleGlow);
      world.add(particle);
      thread.particles.push({
        mesh: particle,
        offset: thread.offset + i * 0.5
      });
    }

    threads.push(thread);
  });

  const outbound = createThread(
    [
      [1.02, 0.01, 0.33],
      [2.1, 0.07, 0.5],
      [3.3, 0.12, 0.8],
      [4.25, 0.15, 1.0]
    ],
    0xffc19b,
    0.011,
    0.62
  );
  world.add(outbound.group);
  outbound.particles = [];
  for (let i = 0; i < 2; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffd2b4,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    const particleGlow = createGlowSprite(0xffb38b, 0.55, 0.24, 0.24);
    particle.add(particleGlow);
    world.add(particle);
    outbound.particles.push({ mesh: particle, offset: i * 0.5 });
  }

  // ---------------------------------------------------------------------
  // Stage floor & dust
  // ---------------------------------------------------------------------
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc9ab,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const ringGeometry = new THREE.RingGeometry(2.05, 2.062, 160);
  const floorRing = new THREE.Mesh(ringGeometry, ringMaterial);
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.scale.set(1, 0.38, 1);
  floorRing.position.y = -1.68;
  world.add(floorRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(2.7, 2.707, 180),
    new THREE.MeshBasicMaterial({
      color: 0xffd8c2,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.scale.set(1, 0.38, 1);
  outerRing.position.y = -1.68;
  world.add(outerRing);

  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.7),
    new THREE.MeshBasicMaterial({
      map: GLOW_TEXTURE,
      color: 0xff6a3a,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.68;
  world.add(floorGlow);

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = 42;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 9.5;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 5.4;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xffd8bd,
      size: 0.018,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  world.add(dust);

  // ---------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const drag = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    offsetX: 0,
    offsetY: 0
  };

  const baseRotation = { x: -0.015, y: -0.12 };
  let visible = true;
  let elapsed = 0;

  function setSize() {
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    camera.aspect = aspect;
    camera.position.z = aspect < 0.95 ? 10.15 : aspect < 1.2 ? 9.65 : 9.3;
    camera.updateProjectionMatrix();

    world.scale.setScalar(aspect < 0.9 ? 0.84 : 1);
    world.position.y = aspect < 0.9 ? 0.06 : 0;

    renderer.setSize(width, height, false);
  }

  setSize();
  const resizeObserver = new ResizeObserver(setSize);
  resizeObserver.observe(container);

  function handlePointerMove(event) {
    const rect = container.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    pointer.x = Math.max(-1, Math.min(1, normalizedX));
    pointer.y = Math.max(-1, Math.min(1, normalizedY));

    if (drag.active && event.pointerId === drag.pointerId) {
      drag.offsetX = Math.max(
        -0.34,
        Math.min(0.34, drag.baseX + (event.clientX - drag.startX) * 0.0045)
      );
      drag.offsetY = Math.max(
        -0.16,
        Math.min(0.16, drag.baseY + (event.clientY - drag.startY) * 0.0025)
      );
    }
  }

  function handlePointerDown(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (event.target.closest("button, a")) return;

    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.baseX = drag.offsetX;
    drag.baseY = drag.offsetY;

    stage?.classList.add("is-dragging");
    container.setPointerCapture?.(event.pointerId);
  }

  function endDrag(event) {
    if (!drag.active) return;
    if (event && drag.pointerId !== null && event.pointerId !== drag.pointerId) return;

    drag.active = false;
    drag.pointerId = null;
    stage?.classList.remove("is-dragging");
  }

  container.addEventListener("pointermove", handlePointerMove, { passive: true });
  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);
  container.addEventListener("pointerleave", () => {
    if (!drag.active) {
      pointer.x = 0;
      pointer.y = 0;
    }
  });

  container.addEventListener(
    "touchmove",
    (event) => {
      if (drag.active) event.preventDefault();
    },
    { passive: false }
  );

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.02 }
  );
  intersectionObserver.observe(container);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) visible = false;
    else visible = true;
  });

  // ---------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------
  let animationFrame = 0;
  let lastTime = performance.now();

  function animate(now) {
    animationFrame = requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!visible) return;

    elapsed += delta;
    const idleTime = reducedMotion ? 0 : elapsed;

    const parallaxX = reducedMotion ? 0 : pointer.x * 0.13;
    const parallaxY = reducedMotion ? 0 : pointer.y * 0.06;

    const targetRotY = baseRotation.y + drag.offsetX + parallaxX;
    const targetRotX = baseRotation.x + drag.offsetY + parallaxY;

    world.rotation.y = THREE.MathUtils.damp(world.rotation.y, targetRotY, 4.2, delta);
    world.rotation.x = THREE.MathUtils.damp(world.rotation.x, targetRotX, 4.2, delta);
    world.rotation.z = Math.sin(idleTime * 0.28) * 0.005;

    world.position.y = Math.sin(idleTime * 0.45) * 0.035;

    monolith.rotation.z = -0.012 + Math.sin(idleTime * 0.33 + 0.6) * 0.004;

    const breath = 0.5 + Math.sin(idleTime * 0.9) * 0.5;
    seamHaloWide.material.opacity = 0.18 + breath * 0.05;
    seamHaloCore.material.opacity = 0.34 + breath * 0.08;
    seamLight.intensity = 3.8 + breath * 1.2;

    // Particles follow their threads
    const allFlows = [...threads, outbound];
    allFlows.forEach((flow) => {
      const isOutbound = flow === outbound;
      flow.particles.forEach((particle) => {
        const progress =
          (idleTime * (isOutbound ? 0.07 : flow.speed) + particle.offset) % 1;
        const point = flow.curve.getPointAt(isOutbound ? progress : 1 - progress);
        particle.mesh.position.copy(point);
      });
    });

    dust.rotation.y = idleTime * 0.008;

    renderer.render(scene, camera);
  }

  // First frame is immediate, even if reduced motion is enabled.
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);

  // Pause completely when the page is hidden to save battery.
  document.addEventListener("visibilitychange", () => {
    lastTime = performance.now();
  });

  return {
    dispose() {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
