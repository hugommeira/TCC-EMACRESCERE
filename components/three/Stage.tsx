"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

// Palco WebGL dos assets 3D (public/3d/*.glb). Só é carregado por Scene3D,
// quando a moldura chega perto da tela. Convenções dos modelos: pivô no centro,
// frente = +Z, sem animação gravada (todo movimento é feito aqui).
// Nada vem de CDN: luz e reflexos são montados na hora (Lightformer), os
// modelos usam meshopt e WebP (sem Draco), e a política de segurança do site
// só precisa liberar 'wasm-unsafe-eval' e blob: (ver next.config.mjs).

export type SceneKind = "logo" | "phone" | "seal";

interface StageProps {
  scene:   SceneKind;
  active:  boolean;
  onReady: () => void;
  onError: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease  = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/** Leva o modelo para o centro e o escala para a maior medida valer `target`. */
function useFitted(url: string, target: number) {
  const gltf = useGLTF(url, false); // false = sem Draco (modelos usam meshopt)
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    const box  = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const mid  = box.getCenter(new THREE.Vector3());
    const scale = target / Math.max(size.x, size.y, size.z);
    return { root, scale, offset: mid.multiplyScalar(-scale) };
  }, [gltf, target]);
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.5, 3, 4]} intensity={2.4} />
      <directionalLight position={[-3, -1.5, 2]} intensity={0.7} color="#aef5da" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 3.5, 3]} scale={[7, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-4, 0.5, 2]} scale={[2, 5, 1]} color="#c8fbe9" />
        <Lightformer form="rect" intensity={1.0} position={[4, 1, -2]} scale={[2, 5, 1]} color="#ffffff" />
      </Environment>
    </>
  );
}

/** Acompanha o ponteiro na janela inteira (eventPrefix "client"), sem estourar. */
function readPointer(state: { pointer: THREE.Vector2 }) {
  return { x: clamp(state.pointer.x, -1, 1), y: clamp(state.pointer.y, -1, 1) };
}

// ── Logo ─────────────────────────────────────────────────────────────────────
function LogoScene({ onReady }: { onReady: () => void }) {
  const { root, scale, offset } = useFitted("/3d/logo-heart.glb", 2.3);
  const group = useRef<THREE.Group>(null);
  useEffect(onReady, [onReady]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = readPointer(state);
    const ty = Math.sin(t * 0.7) * 0.42 + p.x * 0.3;           // ~±24° e segue o mouse
    const tx = -p.y * 0.16 + Math.sin(t * 0.5) * 0.04;
    g.rotation.y += (ty - g.rotation.y) * 0.06;
    g.rotation.x += (tx - g.rotation.x) * 0.06;
    g.position.y  = Math.sin(t * 1.1) * 0.05;
  });

  return (
    <group ref={group}>
      <group scale={scale} position={offset}>
        <primitive object={root} />
      </group>
    </group>
  );
}

// ── Celular (5 telas trocando por código) ───────────────────────────────────
const SCREENS = [1, 2, 3, 4, 5].map((n) => `/3d/screens/tela-${n}.webp`);
const HOLD = 3.2; // s com a tela parada
const FADE = 0.7; // s da transição

function PhoneScene({ onReady }: { onReady: () => void }) {
  const { root, scale, offset } = useFitted("/3d/phone-app.glb", 2.55);
  const textures = useTexture(SCREENS);
  const group    = useRef<THREE.Group>(null);
  const cycle    = useRef({ index: 0, start: 0, fading: false, from: 0, next: 0 });

  const rig = useMemo(() => {
    const screen = root.getObjectByName("Phone_Screen") as THREE.Mesh | undefined;
    if (!screen) return null;
    for (const tex of textures) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY      = false; // padrão glTF; UV 0–1, imagem em pé
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    }
    const base = screen.material as THREE.MeshStandardMaterial;
    base.emissive.set(1, 1, 1);
    base.emissiveMap = textures[0] ?? null;
    base.toneMapped  = false; // a tela mostra as cores da imagem, sem ajuste
    base.needsUpdate = true;

    // Camada de transição: segunda tela por cima, que aparece aos poucos.
    const fade = new THREE.Mesh(
      screen.geometry,
      new THREE.MeshBasicMaterial({
        map: textures[1] ?? null, transparent: true, opacity: 0, toneMapped: false,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      }),
    );
    fade.position.copy(screen.position);
    fade.position.z += 0.00008;
    fade.quaternion.copy(screen.quaternion);
    fade.scale.copy(screen.scale);
    fade.renderOrder = 2;
    screen.parent?.add(fade);
    return { base, fade };
  }, [root, textures]);

  useEffect(onReady, [onReady]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = readPointer(state);
    const ty = -0.32 + Math.sin(t * 0.5) * 0.1 + p.x * 0.32;
    const tx = -p.y * 0.12;
    g.rotation.y += (ty - g.rotation.y) * 0.06;
    g.rotation.x += (tx - g.rotation.x) * 0.06;
    g.position.y  = Math.sin(t * 1.0) * 0.04;
    g.position.x  = 0.3; // abre espaço à esquerda para o cartão "ao vivo" do hero

    if (!rig) return;
    const c = cycle.current;
    const n = textures.length;
    if (!c.fading && t - c.start > HOLD) {
      c.fading = true; c.start = t;
      c.next = (c.index + 1) % n;
      rig.fade.material.map = textures[c.next] ?? null;
    }
    if (c.fading) {
      const k = clamp((t - c.start) / FADE, 0, 1);
      rig.fade.material.opacity = ease(k);
      if (k >= 1) {
        rig.base.emissiveMap = textures[c.next] ?? null;
        rig.fade.material.opacity = 0;
        c.index = c.next; c.fading = false; c.start = t;
      }
    }
  });

  return (
    <group ref={group}>
      <group scale={scale} position={offset}>
        <primitive object={root} />
      </group>
    </group>
  );
}

// ── Selo de assinatura digital ──────────────────────────────────────────────
function SealScene({ onReady }: { onReady: () => void }) {
  const { root, scale, offset } = useFitted("/3d/seal-signature.glb", 2.2);
  const group = useRef<THREE.Group>(null);
  const check = useMemo(() => root.getObjectByName("Seal_Check") ?? null, [root]);
  const base  = useMemo(() => check?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [check]);
  useEffect(onReady, [onReady]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = readPointer(state);
    // balança de frente (um giro completo deixaria o selo de perfil, fino)
    g.rotation.y = Math.sin(t * 0.5) * 0.35 + p.x * 0.12; // calmo: é um selo pequeno
    g.rotation.x += (0.14 - p.y * 0.12 - g.rotation.x) * 0.06;
    g.position.y = Math.sin(t * 1.0) * 0.04;
    if (check) {
      const k = (t % 4.5) / 0.7;               // pulo do check a cada 4,5 s
      const s = k < 1 ? 1 + 0.22 * Math.sin(Math.PI * k) : 1;
      check.scale.copy(base).multiplyScalar(s);
    }
  });

  return (
    <group ref={group}>
      <group scale={scale} position={offset}>
        <primitive object={root} />
      </group>
    </group>
  );
}

// ── Palco ────────────────────────────────────────────────────────────────────
class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onError(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

export default function Stage({ scene, active, onReady, onError }: StageProps) {
  return (
    <Boundary onError={onError}>
      <Canvas
        flat
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "never"}
        camera={{ fov: 28, position: [0, 0, 6], near: 0.1, far: 30 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        eventSource={document.body}
        eventPrefix="client"
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onError(); });
        }}
      >
        <Suspense fallback={null}>
          <Lights />
          {scene === "logo"  && <LogoScene  onReady={onReady} />}
          {scene === "phone" && <PhoneScene onReady={onReady} />}
          {scene === "seal"  && <SealScene  onReady={onReady} />}
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
