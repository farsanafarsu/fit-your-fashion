"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { byId } from "@/lib/catalog";
import { fitMap } from "@/lib/sizing";

// Parametric avatar built from the user's measurements; garments are lathed shells whose
// stand-off from the body is driven by the size chart, so changing size visibly changes fit.

const ZONE_Y = { hip: 0.92, waist: 1.07, bust: 1.24 };
import { HEAT } from "./HeatLegend";
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const circR = (cm) => cm / (2 * Math.PI) / 100 / 0.96; // ellipse compensation

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

// Lathe from an r(y) function sampled from yTop down to yBot; colours per vertex for the heatmap.
function lathe(rOf, yBot, yTop, { steps = 40, seg = 56, pleats = 0, colourOf } = {}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const y = lerp(yBot, yTop, i / steps);
    pts.push(new THREE.Vector2(Math.max(0.002, rOf(y)), y));
  }
  const g = new THREE.LatheGeometry(pts, seg);
  const pos = g.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (pleats && v.y < 0.95) {
      const a = Math.atan2(v.z, v.x);
      const k = 1 + 0.035 * Math.sin(a * pleats) * smooth(Math.min(1, (0.95 - v.y) / 0.2));
      pos.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    const c = colourOf ? colourOf(v.y) : new THREE.Color("#fff");
    colours.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  g.computeVertexNormals();
  return g;
}

function buildGarment(product, size, body, profile) {
  const map = fitMap(product, size, body);
  const dev = (y) => devAt(map, y);
  const colourOf = (y) => heatColor(product, dev(y));
  const tr = (y) => radiusAt(profile, y);
  const rh = circR(body.hip);
  const parts = { torso: [], arm: [], leg: [], torsoScale: true };
  const fitted = (y) => tr(y) + offset(dev(y));
  const opts = { colourOf };
  const t = product.type;
  if (t === "top") {
    parts.torso.push({ g: lathe((y) => fitted(y) + (y < 1.0 ? (1.0 - y) * 0.2 : 0), 0.94, 1.44, opts) });
    parts.arm.push({ g: lathe(() => 0.043 + offset(dev(1.24)) * 0.3, -0.5, 0, { colourOf: () => colourOf(1.24) }) });
  } else if (t === "blazer") {
    parts.torso.push({ g: lathe((y) => tr(Math.max(y, 0.92)) + offset(dev(Math.max(y, 0.92))) + 0.013, 0.84, 1.455, opts) });
    parts.arm.push({ g: lathe((y) => 0.046 + offset(dev(1.24)) * 0.3 - y * 0.012, -0.53, 0, { colourOf: () => colourOf(1.24) }) });
  } else if (t === "cape") {
    const rC = (y) => (y > 1.44 ? 0.07 : y > 1.38 ? lerp(0.28, 0.07, (y - 1.38) / 0.06) : lerp(0.46, 0.28, smooth((y - 0.62) / 0.76)));
    parts.torso.push({ g: lathe(rC, 0.62, 1.47, { colourOf: () => new THREE.Color(HEAT.perfect) }), sheer: 0.55, scale: [1.05, 1, 0.82] });
  } else if (t === "trousers") {
    parts.torso.push({ g: lathe(fitted, 0.8, 1.09, opts) });
    const rt = rh * 0.42 + offset(dev(0.92)) * 0.5 + 0.02;
    parts.leg.push({ g: lathe((y) => lerp(0.11, rt, smooth((y + 0.78) / 0.8)), -0.78, 0.02, { colourOf: () => colourOf(0.92) }) });
  } else if (t === "skirt") {
    parts.torso.push({ g: lathe((y) => (y >= 0.92 ? fitted(y) : lerp(rh + offset(dev(0.92)), 0.3, smooth((0.92 - y) / 0.57))), 0.35, 1.09, { ...opts, pleats: 28, seg: 112 }) });
  } else if (["gown", "slip", "drape"].includes(t)) {
    const [bot, top, flare] = { gown: [0.03, 1.36, 0.4], slip: [0.38, 1.33, 0.24], drape: [0.03, 1.4, 0.34] }[t];
    const rD = (y) => (y >= 0.92 ? fitted(y) : lerp(rh + offset(dev(0.92)), flare, smooth((0.92 - y) / (0.92 - bot))));
    parts.torso.push({ g: lathe(rD, bot, top, opts) });
    if (t === "drape") parts.torso.push({ g: lathe((y) => rD(y) + 0.025, bot, 1.02, { colourOf: () => colourOf(0.92) }), sheer: 0.35 });
  } else if (t === "necklace") {
    parts.necklace = true;
  }
  return parts;
}

function GarmentMesh({ g, colour, heatmap, sheer, scale }) {
  return (
    <mesh geometry={g} scale={scale} castShadow>
      <meshPhysicalMaterial
        key={heatmap ? "heat" : "cloth"} // vertexColors needs a shader recompile, so swap materials
        color={heatmap ? "#ffffff" : colour}
        vertexColors={heatmap}
        roughness={0.5}
        sheen={heatmap ? 0 : 1}
        sheenRoughness={0.35}
        sheenColor="#ffffff"
        side={THREE.DoubleSide}
        transparent={!!sheer}
        opacity={sheer ? (heatmap ? 0.6 : sheer) : 1}
        depthWrite={!sheer}
      />
    </mesh>
  );
}

function Avatar({ body, outfit, sizes, heatmap, pose }) {
  const k = body.height / 165;
  const profile = useMemo(() => torsoProfile(body), [body]);
  const torsoGeo = useMemo(() => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 56), [profile]);
  const rh = circR(body.hip), rb = circR(body.bust);
  const legGeo = useMemo(() => {
    const rt = rh * 0.42;
    const pts = [[0.001, 0.02], [rt, 0], [rt * 0.9, -0.2], [0.05, -0.42], [0.046, -0.5], [0.04, -0.62], [0.03, -0.76], [0.001, -0.8]];
    return new THREE.LatheGeometry(pts.reverse().map(([r, y]) => new THREE.Vector2(r, y)), 32);
  }, [rh]);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: body.skin ?? "#C99A7A", roughness: 0.62 }), [body.skin]);

  const garments = useMemo(
    () => outfit.map((id) => ({ product: byId(id), parts: buildGarment(byId(id), sizes[id] ?? "M", body, profile) })),
    [outfit, sizes, body, profile]
  );

  const root = useRef(), legL = useRef(), legR = useRef(), armL = useRef(), armR = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const walk = pose === "walk";
    const s = walk ? Math.sin(t * 3.2) : 0;
    legL.current.rotation.x = lerp(legL.current.rotation.x, s * 0.38, 0.2);
    legR.current.rotation.x = lerp(legR.current.rotation.x, -s * 0.38, 0.2);
    const armBase = pose === "hip" ? 0.62 : 0.09;
    armL.current.rotation.x = lerp(armL.current.rotation.x, -s * 0.3, 0.2);
    armR.current.rotation.x = lerp(armR.current.rotation.x, s * 0.3 + (pose === "hip" ? -0.35 : 0), 0.2);
    armL.current.rotation.z = lerp(armL.current.rotation.z, 0.09, 0.15);
    armR.current.rotation.z = lerp(armR.current.rotation.z, -armBase, 0.15);
    root.current.position.y = walk ? Math.abs(Math.cos(t * 3.2)) * 0.012 : lerp(root.current.position.y, 0, 0.1);
    root.current.rotation.z = lerp(root.current.rotation.z, pose === "hip" ? 0.025 : 0, 0.1);
    root.current.rotation.y = walk ? Math.sin(t * 3.2) * 0.04 : lerp(root.current.rotation.y, 0, 0.1);
  });

  const torsoScale = [1.15, 1, 0.78];
  const shoulderX = rb * 1.15 + 0.034;
  const arm = (side, r) => (
    <group ref={r} position={[side * shoulderX, 1.385, 0]}>
      <mesh position={[0, -0.29, 0]} material={skin} castShadow>
        <capsuleGeometry args={[0.036, 0.5, 6, 16]} />
      </mesh>
      {garments.flatMap(({ product, parts }) => parts.arm.map((p, i) => <GarmentMesh key={product.id + i} {...p} colour={product.colour} heatmap={heatmap} />))}
    </group>
  );
  const leg = (side, r) => (
    <group ref={r} position={[side * rh * 0.5, 0.84, 0]}>
      <mesh geometry={legGeo} material={skin} castShadow />
      <mesh position={[0, -0.81, 0.04]} material={skin}>
        <boxGeometry args={[0.07, 0.03, 0.17]} />
      </mesh>
      {garments.flatMap(({ product, parts }) => parts.leg.map((p, i) => <GarmentMesh key={product.id + i} {...p} colour={product.colour} heatmap={heatmap} />))}
    </group>
  );

  return (
    <group scale={[1, k, 1]}>
      <group ref={root}>
        <mesh geometry={torsoGeo} scale={torsoScale} material={skin} castShadow />
        <mesh position={[0, 1.645, 0.005]} scale={[0.86, 1.08, 0.94]} material={skin} castShadow>
          <sphereGeometry args={[0.095, 32, 32]} />
        </mesh>
        {/* hair: soft low bun */}
        <mesh position={[0, 1.67, -0.035]} scale={[0.92, 1.05, 1]}>
          <sphereGeometry args={[0.1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color="#2a1d24" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.6, -0.11]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#2a1d24" roughness={0.8} />
        </mesh>
        {garments.flatMap(({ product, parts }) =>
          parts.torso.map((p, i) => <GarmentMesh key={product.id + i} {...p} scale={p.scale ?? torsoScale} colour={product.colour} heatmap={heatmap} />)
        )}
        {garments.some((g) => g.parts.necklace) && (
          <group position={[0, 1.425, 0.01]} rotation={[0.35, 0, 0]}>
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

export default function AvatarScene({ body, outfit, sizes = {}, heatmap = false, pose = "stand", autoRotate = false, dark = false, className = "" }) {
  return (
    <div className={className} data-cursor="Drag">
      <Canvas shadows camera={{ position: [0, 1.0, 4.4], fov: 30 }} dpr={[1, 1.75]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <ambientLight intensity={dark ? 0.5 : 0.75} />
        <hemisphereLight args={["#ffffff", "#C9B6E4", 0.6]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2.5, -2]} intensity={1.1} color="#C9B6E4" />
        <pointLight position={[0, 1.4, 2]} intensity={0.35} color="#BFE3F5" />
        <Avatar body={body} outfit={outfit} sizes={sizes} heatmap={heatmap} pose={pose} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
          <circleGeometry args={[0.7, 64]} />
          <meshStandardMaterial color={dark ? "#2A1F44" : "#EFE8F8"} roughness={0.9} />
        </mesh>
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={3} blur={2.4} far={2} color="#1E1530" />
        <OrbitControls target={[0, 0.88, 0]} enablePan={false} minDistance={2} maxDistance={5.5} minPolarAngle={0.9} maxPolarAngle={1.75} autoRotate={autoRotate} autoRotateSpeed={1.2} enableDamping />
      </Canvas>
    </div>
  );
}
