"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Lightformer, Instances, Instance, Sparkles } from "@react-three/drei";
import { byId } from "@/lib/catalog";
import { fitMap } from "@/lib/sizing";
import { HEAT } from "./HeatLegend";

// A couture mannequin built from the user's measurements. Garments are lathed shells whose stand-off from
// the body comes from the size chart, so changing size visibly changes fit; the fit heatmap colours them per
// zone. The body and every torso garment share one sculpting pass (bust, seat, shoulders), so cloth follows
// the figure instead of a cylinder. No textures or downloaded assets: geometry, a procedural studio
// environment for reflections, and one contact shadow.

const ZONE_Y = { hip: 0.92, waist: 1.07, bust: 1.24 };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const gauss = (y, m, s) => Math.exp(-(((y - m) / s) ** 2));
const circR = (cm) => cm / (2 * Math.PI) / 100 / 0.96; // ellipse compensation
const TORSO_SCALE = [1.15, 1, 0.78];

function torsoProfile(body) {
  const rh = circR(body.hip), rw = circR(body.waist), rb = circR(body.bust);
  return [
    [0.001, 0.78], [rh * 0.86, 0.8], [rh, 0.9], [rh * 0.98, 0.95], [lerp(rh, rw, 0.55), 1.0], [rw, 1.07],
    [lerp(rw, rb, 0.55), 1.16], [rb, 1.24], [rb * 0.96, 1.3], [rb * 0.86, 1.37], [0.065, 1.43], [0.05, 1.46], [0.047, 1.53], [0.001, 1.545],
  ];
}
function radiusAt(profile, y) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i], [r1, y1] = profile[i + 1];
    if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0));
  }
  return y < profile[0][1] ? profile[0][0] : profile[profile.length - 1][0];
}
// Deviation (cm) interpolated between measured zones; 0 where the garment has no zone data.
function devAt(map, y) {
  const zs = Object.entries(map).map(([z, v]) => [ZONE_Y[z], v.dev]).sort((a, b) => a[0] - b[0]);
  if (!zs.length) return 0;
  if (y <= zs[0][0]) return zs[0][1];
  if (y >= zs[zs.length - 1][0]) return zs[zs.length - 1][1];
  for (let i = 0; i < zs.length - 1; i++) if (y <= zs[i + 1][0]) return lerp(zs[i][1], zs[i + 1][1], (y - zs[i][0]) / (zs[i + 1][0] - zs[i][0]));
  return 0;
}
const offset = (dev) => 0.006 + (Math.max(dev, 0) / (2 * Math.PI) / 100) * 0.9;

function heatColor(product, dev) {
  const looseAt = product.fit === "relaxed" ? 8 : 4;
  return new THREE.Color(dev < -2 ? HEAT.tight : dev > looseAt ? HEAT.loose : HEAT.perfect);
}

// The figure: bust forward, seat back, a shoulder line. Applied (pre-scale) to the torso and to every torso
// garment, so the size-driven stand-off between them is preserved.
function sculpt(x, y, z) {
  const r = Math.hypot(x, z);
  if (r < 1e-5) return [x, z];
  const nz = z / r, nx = x / r;
  const push = 1 + 0.12 * Math.max(0, nz) ** 2 * gauss(y, 1.235, 0.055) + 0.08 * Math.max(0, -nz) ** 2 * gauss(y, 0.9, 0.075);
  const kx = 1 + 0.18 * gauss(y, 1.385, 0.04) * nx * nx; // gentle: stronger made blazer shoulders into shelves
  return [x * push * kx, z * push];
}
// Cloth folds: n soft vertical godets, deepening toward the hem below `from`.
const foldK = (a, y, f) => (f ? 1 + f.amp * Math.sin(a * f.n + y * 2.4) * smooth((f.from - y) / Math.max(0.01, f.from - f.to)) : 1);

// Lathe from an r(y) function sampled from yTop down to yBot; colours per vertex for the heatmap.
function lathe(rOf, yBot, yTop, { steps = 72, seg = 96, folds, shape = true, colourOf } = {}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const y = lerp(yBot, yTop, i / steps);
    pts.push(new THREE.Vector2(Math.max(0.002, rOf(y)), y));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  const pos = g.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    const y = pos.getY(i), k = foldK(Math.atan2(z, x), y, folds);
    x *= k; z *= k;
    if (shape) [x, z] = sculpt(x, y, z);
    pos.setXYZ(i, x, y, z);
    const c = colourOf ? colourOf(y) : new THREE.Color("#fff");
    colours.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  g.computeVertexNormals();
  return g;
}

// Garment shells per product type. `pearls`: bead positions in the garment's own (pre-scale) space.
function buildGarment(product, size, body, profile) {
  const map = fitMap(product, size, body);
  const dev = (y) => devAt(map, y);
  const colourOf = (y) => heatColor(product, dev(y));
  const tr = (y) => radiusAt(profile, y);
  const rh = circR(body.hip);
  const parts = { torso: [], arm: [], leg: [] };
  const fitted = (y) => tr(y) + offset(dev(y));
  const opts = { colourOf };
  const t = product.type;
  if (t === "top") {
    // the hem flares clear of a waistband underneath (level with it, the two surfaces flickered)
    parts.torso.push({ g: lathe((y) => fitted(y) + 0.004 + (y < 1.02 ? (1.02 - y) * 0.5 : 0), 0.94, 1.44, { ...opts, folds: { n: 9, amp: 0.02, from: 1.0, to: 0.94 } }) });
    parts.arm.push({ g: lathe(() => 0.047 + offset(dev(1.24)) * 0.3, -0.5, 0, { shape: false, colourOf: () => colourOf(1.24) }) });
  } else if (t === "blazer") {
    parts.torso.push({ g: lathe((y) => tr(Math.max(y, 0.92)) + offset(dev(Math.max(y, 0.92))) + 0.013, 0.84, 1.455, opts) });
    parts.arm.push({ g: lathe((y) => 0.05 + offset(dev(1.24)) * 0.3 + y * 0.01, -0.53, 0, { shape: false, colourOf: () => colourOf(1.24) }) });
  } else if (t === "cape") {
    // a beaded capelet over the shoulders falling into a long sheer cape
    const rC = (y) => (y > 1.44 ? 0.07 : y > 1.38 ? lerp(0.25, 0.07, smooth((y - 1.38) / 0.06)) : lerp(0.33, 0.25, smooth((y - 0.62) / 0.76)));
    const folds = { n: 13, amp: 0.05, from: 1.3, to: 0.62 };
    parts.torso.push({ g: lathe(rC, 0.62, 1.47, { folds, shape: false, colourOf: () => new THREE.Color(HEAT.perfect) }), sheer: 0.5, scale: [1.05, 1, 0.82] });
    const at = (a, y, dr = 0.004) => { const r = (rC(y) + dr) * foldK(a, y, folds); return [Math.cos(a) * r * 1.05, y, Math.sin(a) * r * 0.82]; };
    const pearls = [];
    for (let i = 0; i < 84; i++) pearls.push({ p: at((i / 84) * Math.PI * 2, 0.635), s: 0.0085 });                // hem
    for (let i = 0; i < 26; i++) pearls.push({ p: at((i / 26) * Math.PI * 2, 1.455), s: 0.008 });                 // collar
    for (let k = 0; k < 22; k++) for (let j = 0; j < 7; j++) pearls.push({ p: at((k / 22) * Math.PI * 2, 1.425 - j * 0.02), s: j % 3 === 0 ? 0.0075 : 0.0055 }); // capelet strands
    for (let k = 0; k < 22; k++) pearls.push({ p: at(((k + 0.5) / 22) * Math.PI * 2, 1.3), s: 0.0065 });        // capelet edge
    parts.pearls = pearls;
  } else if (t === "trousers") {
    parts.torso.push({ g: lathe(fitted, 0.8, 1.09, opts) });
    const rt = rh * 0.42 + offset(dev(0.92)) * 0.5 + 0.02;
    parts.leg.push({ g: lathe((y) => lerp(0.11, rt, smooth((y + 0.78) / 0.8)), -0.78, 0.02, { shape: false, folds: { n: 6, amp: 0.025, from: -0.2, to: -0.78 }, colourOf: () => colourOf(0.92) }) });
  } else if (t === "skirt") {
    parts.torso.push({ g: lathe((y) => (y >= 0.92 ? fitted(y) : lerp(rh + offset(dev(0.92)), 0.3, smooth((0.92 - y) / 0.57))), 0.35, 1.09, { ...opts, seg: 160, folds: { n: 28, amp: 0.035, from: 0.95, to: 0.35 } }) });
  } else if (t === "gown") {
    // mermaid: close through the hip and thigh, a flare from the knee
    const rD = (y) => (y >= 0.92 ? fitted(y) : y >= 0.46 ? lerp(rh + offset(dev(0.92)), rh * 0.86 + offset(dev(0.92)), smooth((0.92 - y) / 0.46)) : lerp(rh * 0.86 + offset(dev(0.92)), 0.38, smooth((0.46 - y) / 0.43) ** 1.25));
    parts.torso.push({ g: lathe(rD, 0.03, 1.36, { ...opts, folds: { n: 10, amp: 0.06, from: 0.5, to: 0.03 } }), satin: true });
  } else if (["slip", "drape"].includes(t)) {
    const [bot, top, flare] = { slip: [0.38, 1.33, 0.24], drape: [0.03, 1.4, 0.34] }[t];
    const rD = (y) => (y >= 0.92 ? fitted(y) : lerp(rh + offset(dev(0.92)), flare, smooth((0.92 - y) / (0.92 - bot))));
    parts.torso.push({ g: lathe(rD, bot, top, { ...opts, folds: { n: t === "slip" ? 7 : 12, amp: 0.03, from: 0.9, to: bot } }), satin: t === "slip" });
    if (t === "drape") parts.torso.push({ g: lathe((y) => rD(y) + 0.025, bot, 1.02, { folds: { n: 9, amp: 0.05, from: 1.0, to: bot }, colourOf: () => colourOf(0.92) }), sheer: 0.35 });
  } else if (t === "necklace") {
    parts.necklace = true;
  }
  return parts;
}

function GarmentMesh({ g, colour, heatmap, sheer, satin, scale }) {
  return (
    <mesh geometry={g} scale={scale}>
      <meshPhysicalMaterial
        key={heatmap ? "heat" : "cloth"} // vertexColors needs a shader recompile, so swap materials
        color={heatmap ? "#ffffff" : colour}
        vertexColors={heatmap}
        roughness={satin ? 0.28 : 0.55}
        sheen={heatmap ? 0 : 1}
        sheenRoughness={satin ? 0.22 : 0.4}
        sheenColor="#ffffff"
        clearcoat={satin && !heatmap ? 0.35 : 0}
        clearcoatRoughness={0.35}
        side={THREE.DoubleSide}
        transparent={!!sheer}
        opacity={sheer ? (heatmap ? 0.6 : sheer) : 1}
        depthWrite={!sheer}
      />
    </mesh>
  );
}

function Pearls({ items, scale = [1, 1, 1] }) {
  return (
    <group scale={scale}>
      <Instances limit={items.length} range={items.length}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshPhysicalMaterial color="#FBF8FF" roughness={0.12} clearcoat={1} iridescence={0.7} iridescenceIOR={1.4} />
        {items.map(({ p, s }, i) => <Instance key={i} position={p} scale={[s / scale[0], s / scale[1], s / scale[2]]} />)}
      </Instances>
    </group>
  );
}

const Heel = ({ side }) => (
  // a lavender satin stiletto
  <group position={[0, -0.785, 0.012]} rotation={[0, side * 0.08, 0]}>
    <mesh position={[0, -0.022, 0.05]} rotation={[-0.42, 0, 0]} scale={[0.032, 0.022, 0.075]}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshPhysicalMaterial color="#B9A3DB" roughness={0.25} clearcoat={0.8} sheen={0.6} />
    </mesh>
    <mesh position={[0, -0.03, -0.03]}>
      <cylinderGeometry args={[0.009, 0.004, 0.06, 10]} />
      <meshPhysicalMaterial color="#9C84C9" roughness={0.3} clearcoat={0.6} />
    </mesh>
  </group>
);

function Avatar({ body, outfit, sizes, heatmap, pose }) {
  const k = body.height / 165;
  const profile = useMemo(() => torsoProfile(body), [body]);
  const torsoGeo = useMemo(() => lathe((y) => radiusAt(profile, y), 0.78, 1.545, { steps: 80 }), [profile]);
  const rh = circR(body.hip), rb = circR(body.bust);
  const legGeo = useMemo(() => {
    const rt = rh * 0.42;
    const pts = [[0.001, 0.02], [rt, 0], [rt * 0.96, -0.1], [rt * 0.78, -0.3], [0.05, -0.41], [0.047, -0.45], [0.052, -0.52], [0.042, -0.63], [0.027, -0.74], [0.025, -0.79], [0.001, -0.8]];
    return lathe((y) => { for (let i = 0; i < pts.length - 1; i++) { const [r0, y0] = pts[i], [r1, y1] = pts[i + 1]; if (y <= y0 && y >= y1) return lerp(r0, r1, smooth((y0 - y) / (y0 - y1))); } return 0.002; }, -0.8, 0.02, { steps: 60, seg: 40, shape: false });
  }, [rh]);
  const armGeo = useMemo(() => {
    const pts = [[0.044, 0], [0.043, -0.08], [0.037, -0.25], [0.031, -0.29], [0.034, -0.34], [0.026, -0.5], [0.022, -0.53], [0.002, -0.535]];
    return lathe((y) => { for (let i = 0; i < pts.length - 1; i++) { const [r0, y0] = pts[i], [r1, y1] = pts[i + 1]; if (y <= y0 && y >= y1) return lerp(r0, r1, smooth((y0 - y) / (y0 - y1))); } return 0.002; }, -0.535, 0, { steps: 48, seg: 32, shape: false });
  }, []);
  // porcelain-satin finish in the visitor's chosen tone: reads as a couture mannequin, never uncanny skin
  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({ color: body.skin ?? "#C99A7A", roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color("#ffffff") }), [body.skin]);
  const hair = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#2a1d24", roughness: 0.45, sheen: 1, sheenColor: new THREE.Color("#6b5070"), sheenRoughness: 0.3 }), []);

  const garments = useMemo(
    () => outfit.map((id) => ({ product: byId(id), parts: buildGarment(byId(id), sizes[id] ?? "M", body, profile) })),
    [outfit, sizes, body, profile]
  );
  // long skirts would be kicked through by a full stride, so the walk shortens under them
  const stride = garments.some(({ product }) => ["gown", "drape"].includes(product.type)) ? 0.1 : 0.36;

  const root = useRef(), legL = useRef(), legR = useRef(), armL = useRef(), armR = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const walk = pose === "walk";
    const s = walk ? Math.sin(t * 3.2) : 0;
    legL.current.rotation.x = lerp(legL.current.rotation.x, s * stride, 0.2);
    legR.current.rotation.x = lerp(legR.current.rotation.x, -s * stride, 0.2);
    const armBase = pose === "hip" ? 0.62 : 0.1;
    armL.current.rotation.x = lerp(armL.current.rotation.x, -s * 0.28, 0.2);
    armR.current.rotation.x = lerp(armR.current.rotation.x, s * 0.28 + (pose === "hip" ? -0.35 : 0), 0.2);
    armL.current.rotation.z = lerp(armL.current.rotation.z, 0.1, 0.15);
    armR.current.rotation.z = lerp(armR.current.rotation.z, -armBase, 0.15);
    root.current.position.y = walk ? Math.abs(Math.cos(t * 3.2)) * 0.01 : lerp(root.current.position.y, 0, 0.1);
    root.current.rotation.z = lerp(root.current.rotation.z, pose === "hip" ? 0.025 : 0, 0.1);
    root.current.rotation.y = walk ? Math.sin(t * 3.2) * 0.04 : lerp(root.current.rotation.y, 0, 0.1);
  });

  const shoulderX = rb * 1.15 + 0.03;
  const arm = (side, r) => (
    <group ref={r} position={[side * shoulderX, 1.385, 0]}>
      <mesh material={skin}><sphereGeometry args={[0.046, 24, 16]} /></mesh>
      <mesh geometry={armGeo} material={skin} />
      {/* hand: slim, relaxed */}
      <mesh position={[side * -0.004, -0.585, 0.004]} rotation={[0.1, 0, side * 0.08]} scale={[0.018, 0.05, 0.03]} material={skin}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      {garments.flatMap(({ product, parts }) => parts.arm.map((p, i) => <GarmentMesh key={product.id + i} {...p} colour={product.colour} heatmap={heatmap} />))}
    </group>
  );
  const leg = (side, r) => (
    <group ref={r} position={[side * rh * 0.5, 0.84, 0]}>
      <mesh geometry={legGeo} material={skin} />
      <Heel side={side} />
      {garments.flatMap(({ product, parts }) => parts.leg.map((p, i) => <GarmentMesh key={product.id + i} {...p} colour={product.colour} heatmap={heatmap} />))}
    </group>
  );

  return (
    <group scale={[1, k, 1]}>
      <group ref={root}>
        <mesh geometry={torsoGeo} scale={TORSO_SCALE} material={skin} />
        {/* neck and a faceless, slightly lifted head with a sleek chignon */}
        <mesh position={[0, 1.5, 0]} material={skin}><cylinderGeometry args={[0.04, 0.05, 0.12, 24]} /></mesh>
        <group position={[0, 1.648, 0.006]} rotation={[-0.08, 0, 0.04]}>
          <mesh scale={[0.83, 1.1, 0.95]} material={skin}><sphereGeometry args={[0.094, 40, 32]} /></mesh>
          <mesh position={[0, 0.03, -0.012]} scale={[0.9, 0.98, 0.98]} material={hair}>
            <sphereGeometry args={[0.1, 40, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          <mesh position={[0, -0.005, -0.1]} scale={[1, 0.9, 0.85]} material={hair}><sphereGeometry args={[0.048, 24, 18]} /></mesh>
        </group>
        {garments.flatMap(({ product, parts }) => [
          ...parts.torso.map((p, i) => <GarmentMesh key={product.id + i} {...p} scale={p.scale ?? TORSO_SCALE} colour={product.colour} heatmap={heatmap} />),
          parts.pearls && !heatmap && <Pearls key={product.id + "-pearls"} items={parts.pearls} />,
        ])}
        {garments.some((g) => g.parts.necklace) && (
          <group position={[0, 1.425, 0.012]} rotation={[0.35, 0, 0]}>
            {Array.from({ length: 22 }).map((_, i) => {
              const a = (i / 22) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.082, 0, Math.sin(a) * 0.07]}>
                  <sphereGeometry args={[i % 4 === 0 ? 0.011 : 0.008, 12, 12]} />
                  <meshPhysicalMaterial color="#F7F2FC" roughness={0.15} clearcoat={1} iridescence={0.6} />
                </mesh>
              );
            })}
          </group>
        )}
        {arm(-1, armL)}
        {arm(1, armR)}
        {leg(-1, legL)}
        {leg(1, legR)}
      </group>
    </group>
  );
}

// The stage: a pearl plinth with a glowing rim, and the brand's lit arch behind her.
function Stage({ dark }) {
  const glow = dark ? "#C9B6E4" : "#B79BE6";
  return (
    <group>
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.66, 0.7, 0.09, 96]} />
        <meshPhysicalMaterial color={dark ? "#3A2D5C" : "#F4EFFA"} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.0045, 8, 128]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <group position={[0, 0, -0.95]}>
        {/* the arch: a bright core and a wide faint halo, additive, so it reads as light */}
        {[[0.006, 1, "#ffffff"], [0.03, 0.22, glow], [0.07, 0.08, glow]].map(([tube, opacity, color], i) => (
          <group key={i}>
            <mesh position={[0, 1.18, 0]}>
              <torusGeometry args={[0.82, tube, 12, 128, Math.PI]} />
              <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.82, 0.59, 0]}>
                <cylinderGeometry args={[tube, tube, 1.18, 12]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

// `active={false}` stops the render loop entirely (e.g. the homepage preview once scrolled away);
// `dpr` lets a small preview render at a lower pixel ratio than the full dressing room.
export default function AvatarScene({ body, outfit, sizes = {}, heatmap = false, pose = "stand", autoRotate = false, dark = false, className = "", active = true, dpr = [1, 1.75] }) {
  return (
    <div className={className} data-cursor="Drag">
      <Canvas frameloop={active ? "always" : "never"} camera={{ position: [0, 1.0, 4.4], fov: 30 }} dpr={dpr} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        {/* a procedural studio for reflections (rendered once; nothing downloaded) */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={2.2} position={[0, 4, 2]} scale={[6, 2, 1]} rotation-x={Math.PI / 2.4} />
          <Lightformer form="rect" intensity={1.4} color="#E9DFF5" position={[-3, 1.4, 1]} scale={[1, 4, 1]} rotation-y={Math.PI / 2} />
          <Lightformer form="rect" intensity={1.1} color="#C9B6E4" position={[3, 1.6, -1]} scale={[1, 4, 1]} rotation-y={-Math.PI / 2} />
          <Lightformer form="ring" intensity={1.6} color="#ffffff" position={[0, 1.2, -3]} scale={2} />
        </Environment>
        <ambientLight intensity={dark ? 0.25 : 0.4} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
        <directionalLight position={[-2.5, 2.2, -2.5]} intensity={1.4} color="#C9B6E4" /> {/* lavender rim */}
        <Stage dark={dark} />
        <Avatar body={body} outfit={outfit} sizes={sizes} heatmap={heatmap} pose={pose} />
        <Sparkles count={36} scale={[2.2, 2.2, 1.6]} position={[0, 1.15, -0.2]} size={2.2} speed={0.25} opacity={0.75} color="#F4EFFA" />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={2.2} blur={2.2} far={1.6} resolution={512} color="#1E1530" />
        <OrbitControls target={[0, 0.88, 0]} enablePan={false} minDistance={2} maxDistance={5.5} minPolarAngle={0.9} maxPolarAngle={1.75} autoRotate={autoRotate} autoRotateSpeed={1.2} enableDamping />
      </Canvas>
    </div>
  );
}
