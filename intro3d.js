// 3D opening: a red sports car goes from dull and dirty to mirror-polished.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const V = window.vzIntro;
if (V && !V.isEnded()) start().catch(() => V.endIntro());

async function start() {
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  let W = innerWidth, H = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060607);
  scene.fog = new THREE.Fog(0x060607, 9, 20);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(W < H ? 50 : 34, W / H, 0.1, 60);
  const far = W < H ? 1.55 : 1;

  // studio: glossy dark floor and a soft light strip overhead
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.08 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  strip.position.set(0, 4.2, 0); strip.rotation.x = Math.PI / 2;
  scene.add(strip);
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a3d, 0.25); rim.position.set(-4, 2, -5); scene.add(rim);

  // car paint with a polish front: dirty behind uSweep, clean and clearcoated in front of it
  const uniforms = { uSweep: { value: 9 } };
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xa30d17, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02 });
  paint.onBeforeCompile = sh => {
    sh.uniforms.uSweep = uniforms.uSweep;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = `uniform float uSweep;varying vec3 vWP;
float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
float edge=uSweep+(vn(vWP*2.5)-.5)*.5;
float D=1.-smoothstep(edge-.1,edge+.1,vWP.z);
float n=vn(vWP*9.)*.55+vn(vWP*33.)*.45;
D*=.7+.3*smoothstep(1.,.25,vWP.y);
vec3 cl=fract(vWP*20.)-.5;float rr=.12+h3(floor(vWP*20.))*.25;
float spot=step(.78,h3(floor(vWP*20.)+7.))*(smoothstep(rr,rr-.04,length(cl))-smoothstep(rr-.06,rr-.1,length(cl)));
vec3 grime=mix(vec3(.22,.16,.11),vec3(.45,.37,.29),n);
diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb*.6,grime,.45)+spot*.22,D);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.85,D);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.05,D);')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.clearcoat*=1.-D;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.5,.2)*exp(-pow((vWP.z-uSweep)*7.,2.))*.05;');
  };
  const dark = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.42, envMapIntensity: 0.45 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.6, clearcoat: 1 });

  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/gltf/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('media/ferrari.glb');
  if (V.isEnded()) return;
  const car = gltf.scene.children[0];
  const body = car.getObjectByName('body');
  body.material = paint;
  // M-style dark wheels, no yellow accents, lamps that can light up
  const glow = [];
  car.traverse(o => {
    if (!o.isMesh) return;
    if (/^(wheel|rim_)/.test(o.name)) o.material = dark;
    else if (/^(yellow_trim|centre)/.test(o.name)) o.material = new THREE.MeshStandardMaterial({ color: 0x232327, metalness: 0.6, roughness: 0.4 });
    else if (/^(lights|leds|lights_red)$/.test(o.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(o.name === 'lights_red' ? 0xff1a1a : 0xeaf2ff); o.material.emissiveIntensity = 0; glow.push(o.material); }
  });
  car.getObjectByName('glass').material = glass;
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), new THREE.MeshBasicMaterial({ map: await new THREE.TextureLoader().loadAsync('media/ferrari_ao.png'), blending: THREE.MultiplyBlending, toneMapped: false, transparent: true }));
  ao.rotation.x = -Math.PI / 2; ao.position.y = 0.002; ao.renderOrder = 2;
  car.add(ao);
  car.rotation.y = Math.PI; // model faces -z; turn it so the front is +z
  scene.add(car);
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const zA = box.max.z + 0.15, zB = box.min.z - 0.15, halfW = (box.max.x - box.min.x) / 2;
  uniforms.uSweep.value = zA + 0.4;

  // headlight glows, switched on at the end
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,245,230,.8)'); g.addColorStop(1, 'rgba(255,220,180,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const lamps = [];
  for (const s of [-1, 1]) {
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, color: 0xdfeaff }));
    core.scale.set(0.5, 0.5, 1);
    core.position.set(s * 0.58, 0.61, 1.92);
    const streak = new THREE.Sprite(core.material.clone()); streak.scale.set(1.6, 0.05, 1); streak.position.copy(core.position);
    scene.add(core, streak); lamps.push(core.material, streak.material);
  }

  // polisher: orange foam pad, black backing plate, motor and handle
  const pol = new THREE.Group(), spin = new THREE.Group();
  const m = (c, r = 0.5, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });
  const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.165, 0.05, 40), m(0xff6a13, 0.95));
  foam.position.y = 0.025;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.13, 0.025, 32), m(0x151517, 0.4));
  plate.position.y = 0.062;
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.02), m(0xffffff, 0.4)); mark.position.set(0.06, 0.077, 0);
  spin.add(foam, plate, mark);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.2, 28), m(0x222226, 0.35, 0.6)); motor.position.y = 0.17;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.087, 0.087, 0.03, 28), m(0xff6a13, 0.5)); band.position.y = 0.11;
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.32, 6, 12), m(0x111113, 0.6)); handle.rotation.z = Math.PI / 2; handle.position.y = 0.27;
  pol.add(spin, motor, band, handle);
  pol.traverse(o => o.isMesh && (o.material.envMapIntensity = 0.6));
  pol.visible = false;
  scene.add(pol);

  // foam spray particles
  const NP = 220, pPos = new Float32Array(NP * 3), pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xfff1e0, size: 0.018, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(pts);
  let pNext = 0;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.18, 0.5, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  addEventListener('resize', () => { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); });

  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), up = new THREE.Vector3(0, 1, 0);
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(0, 0.5, 0), tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  const padAt = new THREE.Vector3(0, 2, zA), padN = new THREE.Vector3(0, 1, 0);
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const HOLD = 1.8, POL = 6.5, FIN = 4.2;
  const orbit = (a, r, y) => tPos.set(Math.sin(a) * r * far, y, Math.cos(a) * r * far);

  V.phase(0, 'Pintura opaca, poeira e chuva ácida');
  V.el.classList.add('ready');
  orbit(0.95, 7.2, 1.9); camPos.copy(tPos); camera.position.copy(camPos);
  await renderer.compileAsync(scene, camera);
  if (V.isEnded()) return;
  let T = +new URLSearchParams(location.search).get('t') || 0, last = performance.now(), stage = 0;

  renderer.setAnimationLoop(now => {
    if (V.isEnded()) { renderer.setAnimationLoop(null); renderer.dispose(); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    V.progress(T / (HOLD + POL + FIN));

    if (T < HOLD) {
      orbit(0.95 - T * 0.08, 7.2 - T * 0.5, 1.9 - T * 0.15); tLook.set(0, 0.45, 0);
    } else if (T < HOLD + POL) {
      if (stage === 0) { stage = 1; V.phase(1, 'Polimento técnico, painel por painel'); pol.visible = true; }
      const p = (T - HOLD) / POL, e = ease(p);
      const sweep = zA + (zB - zA) * e;
      uniforms.uSweep.value = sweep;
      // pad zig-zags across the car just behind the polish front
      const x = Math.sin(p * Math.PI * 2 * 6) * halfW * 0.62;
      ray.set(new THREE.Vector3(x, 3, Math.min(box.max.z - 0.35, Math.max(box.min.z + 0.45, sweep - 0.08))), down);
      const hit = ray.intersectObject(body, false)[0];
      if (hit) { padAt.lerp(hit.point, 0.5); padN.lerp(hit.face.normal.clone().transformDirection(body.matrixWorld), 0.3).normalize(); }
      const lift = Math.max(0, 1 - (T - HOLD) * 3) * 0.6 + Math.max(0, (p - 0.94) * 10);
      pol.position.copy(padAt).addScaledVector(padN, 0.005 + lift);
      pol.quaternion.setFromUnitVectors(up, padN);
      spin.rotation.y += dt * 40;
      // spray
      for (let k = 0; k < 4; k++) {
        const i = pNext++ % NP, a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * 1.4;
        pPos.set([padAt.x + Math.cos(a) * 0.17, padAt.y + 0.03, padAt.z + Math.sin(a) * 0.17], i * 3);
        pVel.set([Math.cos(a) * v, 0.6 + Math.random() * 1.2, Math.sin(a) * v], i * 3); pLife[i] = 1;
      }
      // camera: close over the right side first, then swings over the roof to the rear left
      if (p < 0.5) { tPos.set(2.4 * far, 2.2, sweep + 2.2 * far); tLook.copy(padAt); }
      else { tPos.set(-2.6 * far, 1.4, sweep - 2.6 * far); tLook.copy(padAt); }
    } else {
      if (stage === 1) {
        stage = 2; pol.visible = false; uniforms.uSweep.value = -9;
        V.phase(2, 'Brilho de volta');
        V.el.classList.add('shine');
        setTimeout(() => V.el.classList.add('brand'), 1500);
      }
      const q = T - HOLD - POL;
      orbit(-0.5 + q * 0.32, 5.6, 0.75); tLook.set(0, 0.5, 0);
      scene.environmentRotation.y = q * 1.4;
      scene.environmentIntensity = 0.55 + Math.min(1, q) * 0.35;
      strip.position.z = 4 - q * 2.5;
      bloom.strength = 0.18 + Math.min(1, q / 1.2) * 0.22;
      const on = q < 0.6 ? 0 : q < 0.75 ? 1 : q < 0.85 ? 0.2 : q < 1 ? 1 : 1;
      lamps.forEach((mat, i) => mat.opacity = on * (i % 2 ? 0.6 : 0.9));
      glow.forEach(mat => mat.emissiveIntensity = on * 2.5);
      if (q > FIN) { V.endIntro(); }
    }

    for (let i = 0; i < NP; i++) {
      if (pLife[i] <= 0) { pPos[i * 3 + 1] = -10; continue; }
      pLife[i] -= dt * 1.6;
      pVel[i * 3 + 1] -= dt * 4;
      for (let k = 0; k < 3; k++) pPos[i * 3 + k] += pVel[i * 3 + k] * dt;
    }
    pGeo.attributes.position.needsUpdate = true;

    const kk = 1 - Math.exp(-dt * 2.4);
    camPos.lerp(tPos, kk); look.lerp(tLook, kk);
    camera.position.copy(camPos); camera.lookAt(look);
    composer.render();
  });
}
