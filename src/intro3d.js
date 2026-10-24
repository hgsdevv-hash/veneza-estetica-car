// 3D opening: a red sports car goes from dull and dirty to mirror-polished.
// Built into ../intro3d.min.js with esbuild (see README.md).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// injected from <head>, so it can run before the page script has set up window.vzIntro
if (document.readyState === 'loading') await new Promise(r => addEventListener('DOMContentLoaded', r));
const V = window.vzIntro;
if (V && !V.isEnded()) start().catch(e => { console.error(e); V.endIntro(); });

async function start() {
  let W = innerWidth, H = innerHeight;
  // quality tier: phones and weak machines get no bloom, 1x pixels and fewer particles
  const weak = matchMedia('(pointer: coarse)').matches || Math.min(W, H) < 700 ||
    (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  let pixelRatio = Math.min(devicePixelRatio, weak ? 1 : 1.5);
  let useBloom = !weak;

  const canvas = document.getElementById('gl');
  canvas.addEventListener('webglcontextlost', () => V.endIntro());
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060607);
  scene.fog = new THREE.Fog(0x060607, 9, 20);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(W < H ? 50 : 34, W / H, 0.1, 60);
  const far = W < H ? 1.55 : 1;

  // studio: dark floor and a soft light strip overhead
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.08 }));
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

  const draco = new DRACOLoader().setDecoderPath('vendor/draco/').setDecoderConfig({ type: 'wasm' });
  const [gltf, aoTex] = await Promise.all([
    new GLTFLoader().setDRACOLoader(draco).loadAsync('media/ferrari.glb'),
    new THREE.TextureLoader().loadAsync('media/ferrari_ao.png'),
  ]);
  draco.dispose();
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
  const glassMesh = car.getObjectByName('glass');
  glassMesh.material = glass;
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), new THREE.MeshBasicMaterial({ map: aoTex, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true }));
  ao.rotation.x = -Math.PI / 2; ao.position.y = 0.002; ao.renderOrder = 2;
  car.add(ao);
  car.rotation.y = Math.PI; // model faces -z; turn it so the front is +z
  scene.add(car);
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const zA = box.max.z + 0.15, zB = box.min.z - 0.15, halfW = (box.max.x - box.min.x) / 2;
  uniforms.uSweep.value = zA + 0.4;

  // height map of the car's top surface, so the polisher glides instead of snapping between panels.
  // The open cockpit is a hole: it gets bridged and the tool lifts gently over it.
  const NX = 21, NZ = 56, x0 = -halfW * 0.8, x1 = halfW * 0.8, z0 = box.min.z + 0.3, z1 = box.max.z - 0.25;
  // one pass over the vertices (raycasting a mesh this dense would freeze slow phones for seconds)
  const hf = new Float32Array(NX * NZ).fill(-1), hole = new Uint8Array(NX * NZ);
  const v = new THREE.Vector3();
  for (const mesh of [body, glassMesh]) {
    const pos = mesh.geometry.attributes.position;
    for (let n = 0; n < pos.count; n++) {
      v.fromBufferAttribute(pos, n).applyMatrix4(mesh.matrixWorld);
      const i = Math.round((v.x - x0) / (x1 - x0) * (NX - 1)), j = Math.round((v.z - z0) / (z1 - z0) * (NZ - 1));
      if (i < 0 || i >= NX || j < 0 || j >= NZ) continue;
      const k = i * NZ + j;
      if (v.y > hf[k]) hf[k] = v.y;
    }
  }
  for (let k = 0; k < NX * NZ; k++) if (hf[k] < 0.7) hole[k] = 1;
  for (let i = 0; i < NX; i++) { // bridge holes along each lane, raised a little
    for (let j = 0; j < NZ; j++) {
      if (!hole[i * NZ + j]) continue;
      let a = j, b = j;
      while (a >= 0 && hole[i * NZ + a]) a--;
      while (b < NZ && hole[i * NZ + b]) b++;
      const ha = a >= 0 ? hf[i * NZ + a] : (b < NZ ? hf[i * NZ + b] : 1);
      const hb = b < NZ ? hf[i * NZ + b] : ha;
      const t = b > a ? (j - a) / (b - a) : 0;
      hf[i * NZ + j] = ha + (hb - ha) * t + 0.22 * Math.sin(Math.PI * t);
    }
  }
  for (let pass = 0; pass < 3; pass++) { // blur
    const c = hf.slice();
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      let s = 0, n = 0;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const a = i + di, b = j + dj;
        if (a >= 0 && a < NX && b >= 0 && b < NZ) { s += c[a * NZ + b]; n++; }
      }
      hf[i * NZ + j] = s / n;
    }
  }
  const heightAt = (x, z) => {
    const fx = THREE.MathUtils.clamp((x - x0) / (x1 - x0) * (NX - 1), 0, NX - 1.001), fz = THREE.MathUtils.clamp((z - z0) / (z1 - z0) * (NZ - 1), 0, NZ - 1.001);
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j;
    const h = (a, b) => hf[a * NZ + b];
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
  };

  // headlight glows, switched on at the end
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,245,230,.8)'); g.addColorStop(1, 'rgba(255,220,180,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const lamps = [];
  for (const s of [-1, 1]) {
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, color: 0xdfeaff }));
    core.scale.set(0.5, 0.5, 1);
    core.position.set(s * 0.58, 0.61, 1.92);
    const streak = new THREE.Sprite(core.material.clone()); streak.scale.set(1.6, 0.05, 1); streak.position.copy(core.position);
    scene.add(core, streak); lamps.push(core.material, streak.material);
  }

  // rotary polisher: foam pad, backing plate, gear head, motor body, D-handle, side handle and cable
  const pol = new THREE.Group(), tool = new THREE.Group(), spin = new THREE.Group();
  const mat = (c, r = 0.5, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt, envMapIntensity: 0.7 });
  const add = (parent, geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, material); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o); return o; };
  const orange = mat(0xff6a13, 0.9), black = mat(0x141416, 0.55), body2 = mat(0x232327, 0.38, 0.35), steel = mat(0x9a9da4, 0.3, 0.9), rubber = mat(0x0d0d0f, 0.85);
  add(spin, new THREE.CylinderGeometry(0.155, 0.16, 0.04, 40), orange, 0, 0.022);
  add(spin, new THREE.TorusGeometry(0.155, 0.021, 10, 40), orange, 0, 0.022, 0, Math.PI / 2);
  add(spin, new THREE.CylinderGeometry(0.06, 0.06, 0.002, 24), mat(0xff8a3d, 0.9), 0, 0.0005); // pad face center
  add(spin, new THREE.CylinderGeometry(0.12, 0.125, 0.018, 32), black, 0, 0.052);
  add(spin, new THREE.BoxGeometry(0.09, 0.004, 0.016), mat(0xffffff, 0.5), 0.05, 0.062);
  add(tool, new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16), steel, 0, 0.08);
  add(tool, new THREE.CylinderGeometry(0.062, 0.07, 0.085, 28), steel, 0, 0.135);               // gear head
  add(tool, new THREE.CylinderGeometry(0.066, 0.066, 0.012, 28), black, 0, 0.18);
  add(tool, new THREE.CapsuleGeometry(0.058, 0.26, 8, 24), body2, 0.19, 0.17, 0, 0, 0, Math.PI / 2); // motor body
  add(tool, new THREE.CylinderGeometry(0.061, 0.061, 0.035, 28), orange, 0.11, 0.17, 0, 0, 0, Math.PI / 2); // brand band
  for (let v = 0; v < 4; v++) add(tool, new THREE.BoxGeometry(0.05, 0.006, 0.008), black, 0.24, 0.226, -0.03 + v * 0.02); // vents
  add(tool, new THREE.TorusGeometry(0.075, 0.017, 10, 28, Math.PI), rubber, 0.37, 0.19, 0);          // D-handle
  add(tool, new THREE.CylinderGeometry(0.02, 0.024, 0.16, 16), rubber, 0.02, 0.16, 0.14, Math.PI / 2); // side handle
  add(tool, new THREE.SphereGeometry(0.026, 16, 12), rubber, 0.02, 0.16, 0.22);
  const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(0.45, 0.16, 0), new THREE.Vector3(0.6, 0.12, 0.02), new THREE.Vector3(0.8, 0.02, 0.1), new THREE.Vector3(1.1, -0.15, 0.25)]);
  add(tool, new THREE.TubeGeometry(cable, 24, 0.011, 8), rubber);
  tool.add(spin);
  tool.scale.setScalar(1.05);
  pol.add(tool);
  pol.visible = false;
  scene.add(pol);

  // foam spray particles
  const NP = weak ? 110 : 220, pPos = new Float32Array(NP * 3).fill(-10), pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xfff1e0, size: 0.018, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false;
  scene.add(pts);
  let pNext = 0;

  let composer = null, bloom = null;
  const makeComposer = () => {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.18, 0.5, 0.88);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  };
  if (useBloom) makeComposer();

  addEventListener('resize', () => { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); composer?.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); });

  const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(), qYaw = new THREE.Quaternion(), qTilt = new THREE.Quaternion(), ax = new THREE.Vector3();
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(0, 0.5, 0), tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  const padPos = new THREE.Vector3(0, 2, zA), padVel = new THREE.Vector3(), padTarget = new THREE.Vector3(), padN = new THREE.Vector3(0, 1, 0), nTarget = new THREE.Vector3();
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const HOLD = 1.8, POL = 7, FIN = 4.2;
  const orbit = (a, r, y) => tPos.set(Math.sin(a) * r * far, y, Math.cos(a) * r * far);

  V.phase(0, 'Pintura opaca, poeira e chuva ácida');
  orbit(0.95, 7.2, 1.9); camPos.copy(tPos); camera.position.copy(camPos); camera.lookAt(look);
  pol.visible = true; // compile its shaders up front too
  await renderer.compileAsync(scene, camera);
  pol.visible = false;
  if (V.isEnded()) return;
  V.el.classList.add('ready');
  let T = +new URLSearchParams(location.search).get('t') || 0, last = performance.now(), stage = 0;
  let perfFrames = 0, perfTime = 0, perfChecks = 0;

  renderer.setAnimationLoop(now => {
    if (V.isEnded()) { renderer.setAnimationLoop(null); renderer.dispose(); return; }
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now; T += dt;
    V.progress(T / (HOLD + POL + FIN));

    // adaptive quality: if frames are slow, drop bloom first, then resolution
    if (perfChecks < 4) {
      perfFrames++; perfTime += raw;
      if (perfFrames === 40) {
        if (perfTime / 40 > 1 / 40) {
          if (useBloom) { useBloom = false; composer?.dispose(); composer = null; }
          else if (pixelRatio > 0.6) { pixelRatio = Math.max(0.6, pixelRatio * 0.75); renderer.setPixelRatio(pixelRatio); renderer.setSize(W, H, false); }
        }
        perfFrames = 0; perfTime = 0; perfChecks++;
      }
    }

    if (T < HOLD) {
      orbit(0.95 - T * 0.08, 7.2 - T * 0.5, 1.9 - T * 0.15); tLook.set(0, 0.45, 0);
    } else if (T < HOLD + POL) {
      if (stage === 0) { stage = 1; V.phase(1, 'Polimento técnico, painel por painel'); pol.visible = true; }
      const p = (T - HOLD) / POL, e = ease(p);
      const sweep = zA + (zB - zA) * e;
      uniforms.uSweep.value = sweep;
      // smooth lanes across the car, right behind the polish front
      const x = Math.sin(p * Math.PI * 2 * 3.2) * halfW * 0.6;
      const z = THREE.MathUtils.clamp(sweep - 0.1, z0, z1);
      const h = heightAt(x, z);
      const eps = 0.08;
      nTarget.set(-(heightAt(x + eps, z) - heightAt(x - eps, z)) / (2 * eps), 1, -(heightAt(x, z + eps) - heightAt(x, z - eps)) / (2 * eps)).normalize();
      const lift = 0.7 * (1 - smooth((T - HOLD) / 0.6)) + 0.7 * smooth((p - 0.93) / 0.07);
      padTarget.set(x, h + 0.004 + lift, z);
      if (stage === 1 && padPos.y > 1.9) { padPos.copy(padTarget); padPos.y += 0.7; stage = 1.5; }
      // critically damped spring: no snapping, even if the target moves fast
      padVel.addScaledVector(padTarget.clone().sub(padPos), 90 * dt).multiplyScalar(Math.exp(-17 * dt));
      padPos.addScaledVector(padVel, dt);
      padN.lerp(nTarget, 1 - Math.exp(-dt * 10)).normalize();
      pol.position.copy(padPos);
      // stand on the surface normal, motor body trailing toward the rear, leaning with lateral motion
      pol.quaternion.setFromUnitVectors(up, padN);
      qYaw.setFromAxisAngle(up, Math.PI / 2 + 0.35);
      fwd.set(0, 0, 1);
      qTilt.setFromAxisAngle(fwd, THREE.MathUtils.clamp(-padVel.x * 0.12, -0.18, 0.18));
      pol.quaternion.multiply(qTilt).multiply(qYaw);
      spin.rotation.y += dt * 45;
      // spray off the pad edge while it touches the paint
      if (lift < 0.05) for (let k = 0; k < (weak ? 2 : 4); k++) {
        const i = pNext++ % NP, a = Math.random() * Math.PI * 2, v = 0.5 + Math.random() * 1.2;
        pPos[i * 3] = padPos.x + Math.cos(a) * 0.17; pPos[i * 3 + 1] = padPos.y + 0.03; pPos[i * 3 + 2] = padPos.z + Math.sin(a) * 0.17;
        pVel[i * 3] = Math.cos(a) * v + padVel.x * 0.4; pVel[i * 3 + 1] = 0.5 + Math.random(); pVel[i * 3 + 2] = Math.sin(a) * v; pLife[i] = 1;
      }
      // camera: close over the right side first, then swings over the roof to the rear left
      ax.set(0, padPos.y * 0.6, padPos.z);
      if (p < 0.5) { tPos.set(2.4 * far, 2.2, sweep + 2.2 * far); tLook.copy(ax); }
      else { tPos.set(-2.6 * far, 1.5, sweep - 2.6 * far); tLook.copy(ax); }
    } else {
      if (stage < 2) {
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
      if (bloom) bloom.strength = 0.18 + Math.min(1, q / 1.2) * 0.22;
      const on = q < 0.6 ? 0 : q < 0.75 ? 1 : q < 0.85 ? 0.2 : 1;
      lamps.forEach((m, i) => m.opacity = on * (i % 2 ? 0.6 : 0.9) * (useBloom ? 1 : 1.2));
      glow.forEach(m => m.emissiveIntensity = on * 2.5);
      if (q > FIN) V.endIntro();
    }

    for (let i = 0; i < NP; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt * 1.6;
      if (pLife[i] <= 0) { pPos[i * 3 + 1] = -10; continue; }
      pVel[i * 3 + 1] -= dt * 4;
      for (let k = 0; k < 3; k++) pPos[i * 3 + k] += pVel[i * 3 + k] * dt;
    }
    pGeo.attributes.position.needsUpdate = true;

    const kk = 1 - Math.exp(-dt * 2.4);
    camPos.lerp(tPos, kk); look.lerp(tLook, kk);
    camera.position.copy(camPos); camera.lookAt(look);
    if (composer) composer.render(); else renderer.render(scene, camera);
  });
}
