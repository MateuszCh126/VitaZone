import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { millimetersToMeters, normalizePlacement } from '../../../shared/terrarium.js';

const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

class TerrariumSceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      const webGlUnavailable = !isWebGLAvailable();
      return (
        <div role="alert" className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 bg-[#0b1510] px-6 text-center">
          <p className="text-sm font-medium text-white">{webGlUnavailable ? 'Podgląd 3D niedostępny' : 'Nie udało się wczytać modelu 3D.'}</p>
          <p className="max-w-sm text-xs leading-5 text-white/50">{webGlUnavailable
            ? 'Ta przeglądarka nie udostępnia WebGL. Lista produktów, wymiary i sterowanie konfiguracją pozostają dostępne.'
            : 'Sprawdź plik GLB i jego wersję w danych produktu. Lista i wymiary konfiguracji pozostają dostępne.'}</p>
          {!webGlUnavailable && <button type="button" onClick={this.retry} className="rounded border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-primary/50 hover:text-primary">Spróbuj ponownie</button>}
        </div>
      );
    }
    return this.props.children;
  }
}

const toVectorMeters = ({ x, y, z }) => [x, y, z].map(millimetersToMeters);
const toRadians = ({ x, y, z }) => [x, y, z].map((degrees) => degrees * Math.PI / 180);
const toDegrees = (rotation) => ({
  x: rotation.x * 180 / Math.PI,
  y: rotation.y * 180 / Math.PI,
  z: rotation.z * 180 / Math.PI
});

function GlbModel({ url }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  return <primitive object={scene} dispose={null} />;
}

function DemoModel({ product, dimensions }) {
  const width = millimetersToMeters(dimensions.width);
  const height = millimetersToMeters(dimensions.height);
  const depth = millimetersToMeters(dimensions.depth);
  const kind = product.demoKind;

  if (kind === 'fern') {
    const leaves = Array.from({ length: 11 }, (_, index) => {
      const angle = index * 2.399;
      const level = 0.12 + (index % 4) * height * 0.16;
      return (
        <mesh key={index} position={[Math.cos(angle) * width * 0.22, level, Math.sin(angle) * depth * 0.22]} rotation={[0.4, angle, Math.cos(index) * 0.7]}>
          <coneGeometry args={[Math.max(width * 0.12, 0.018), height * 0.42, 5]} />
          <meshStandardMaterial color={index % 3 === 0 ? '#82a978' : '#527d54'} roughness={0.9} />
        </mesh>
      );
    });
    return <group position={[0, -height * 0.15, 0]}>{leaves}</group>;
  }

  if (kind === 'shelf') {
    return (
      <group>
        <mesh>
          <boxGeometry args={[width, Math.max(height, 0.012), depth]} />
          <meshStandardMaterial color="#705536" roughness={0.94} />
        </mesh>
        <mesh position={[0, height * 0.55, -depth * 0.24]}>
          <boxGeometry args={[width * 0.9, Math.max(height * 0.3, 0.006), depth * 0.25]} />
          <meshStandardMaterial color="#987448" roughness={1} />
        </mesh>
      </group>
    );
  }

  if (kind === 'branch') {
    return (
      <group rotation-z={-0.36}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[Math.max(height * 0.075, 0.012), Math.max(height * 0.11, 0.017), width * 0.9, 9]} />
          <meshStandardMaterial color="#68482f" roughness={0.96} />
        </mesh>
        <mesh position={[width * 0.13, height * 0.28, 0]} rotation-z={0.9}>
          <cylinderGeometry args={[0.008, 0.016, height * 0.58, 7]} />
          <meshStandardMaterial color="#795537" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh scale={[width * 0.5, height * 0.52, depth * 0.48]} rotation={[0.18, 0.3, -0.08]}>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#777b72" roughness={0.86} />
    </mesh>
  );
}

function EnclosureShell({ enclosure }) {
  const enclosureConfig = enclosure.specs.terrariumDesigner;
  if (!enclosure.isDemo) return <GlbModel url={enclosureConfig.model.url} />;

  const { innerDimensionsMm } = enclosureConfig;
  const width = millimetersToMeters(innerDimensionsMm.width);
  const height = millimetersToMeters(innerDimensionsMm.height);
  const depth = millimetersToMeters(innerDimensionsMm.depth);
  const glass = { color: '#a1d4c0', transparent: true, opacity: 0.12, roughness: 0.14, metalness: 0.08, depthWrite: false };
  const frame = '#78978a';

  return (
    <group>
      <mesh position={[0, 0, -depth / 2]}>
        <boxGeometry args={[width, height, 0.012]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[-width / 2, 0, 0]}>
        <boxGeometry args={[0.012, height, depth]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[width / 2, 0, 0]}>
        <boxGeometry args={[0.012, height, depth]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, 0.012, depth]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[width, 0.018, depth]} />
        <meshStandardMaterial color="#352c21" roughness={1} />
      </mesh>
      <mesh position={[0, 0, depth / 2]}>
        <boxGeometry args={[width, height, 0.006]} />
        <meshStandardMaterial {...glass} opacity={0.045} />
      </mesh>
      {[-width / 2, width / 2].map((x) => (
        <mesh key={`vertical-${x}`} position={[x, 0, depth / 2]}>
          <boxGeometry args={[0.009, height, 0.009]} />
          <meshStandardMaterial color={frame} metalness={0.35} roughness={0.46} />
        </mesh>
      ))}
      {[-height / 2, height / 2].map((y) => (
        <mesh key={`horizontal-${y}`} position={[0, y, depth / 2]}>
          <boxGeometry args={[width, 0.009, 0.009]} />
          <meshStandardMaterial color={frame} metalness={0.35} roughness={0.46} />
        </mesh>
      ))}
    </group>
  );
}

function PlacedProduct({
  product,
  item,
  selected,
  mode,
  onSelect,
  onTransform,
  readOnly,
  enclosure,
  orbitControlsRef
}) {
  const groupRef = useRef(null);
  const dragRef = useRef(null);
  const config = product.specs.terrariumDesigner;
  const position = toVectorMeters(item.positionMm);
  const rotation = toRadians(item.rotationDeg);
  const surface = item.surface;
  const rotateNormal = surface === 'floor' || surface === 'ceiling' ? 'y' : surface === 'back' ? 'z' : 'x';
  const translateAxes = {
    x: surface === 'floor' || surface === 'ceiling' || surface === 'back' || surface === 'right' || surface === 'left',
    y: surface === 'back' || surface === 'left' || surface === 'right',
    z: surface === 'floor' || surface === 'ceiling' || surface === 'left' || surface === 'right'
  };
  const getNormalizedTransform = () => {
    if (!groupRef.current) return;
    return normalizePlacement({
      positionMm: {
        x: groupRef.current.position.x * 1000,
        y: groupRef.current.position.y * 1000,
        z: groupRef.current.position.z * 1000
      },
      rotationDeg: toDegrees(groupRef.current.rotation),
      surface,
      product: config,
      enclosure: enclosure.specs.terrariumDesigner
    });
  };
  const applyNormalizedTransform = (next) => {
    if (!groupRef.current || !next) return;
    groupRef.current.position.set(...toVectorMeters(next.positionMm));
    groupRef.current.rotation.set(...toRadians(next.rotationDeg));
  };
  const handleObjectChange = () => {
    if (!groupRef.current) return;
    try {
      applyNormalizedTransform(getNormalizedTransform());
    } catch {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
    }
  };
  const commitTransform = () => {
    if (!groupRef.current) return;
    try {
      const next = getNormalizedTransform();
      applyNormalizedTransform(next);
      onTransform(item.instanceId, next);
    } catch {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
    }
  };

  const model = product.isDemo
    ? <DemoModel product={product} dimensions={config.dimensionsMm} />
    : <GlbModel url={config.model.url} />;

  const object = (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.instanceId);
      }}
      onPointerOver={() => { document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
      onPointerDown={(event) => {
        if (readOnly || mode !== 'translate' || !groupRef.current) return;
        event.stopPropagation();
        onSelect(item.instanceId);
        const normal = surface === 'floor' || surface === 'ceiling'
          ? new THREE.Vector3(0, 1, 0)
          : surface === 'back' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, groupRef.current.position);
        const intersection = event.ray.intersectPlane(plane, new THREE.Vector3());
        if (!intersection) return;
        dragRef.current = {
          pointerId: event.pointerId,
          plane,
          offset: groupRef.current.position.clone().sub(intersection)
        };
        event.target.setPointerCapture(event.pointerId);
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
        document.body.style.cursor = 'grabbing';
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !groupRef.current) return;
        event.stopPropagation();
        const intersection = event.ray.intersectPlane(drag.plane, new THREE.Vector3());
        if (!intersection) return;
        const target = intersection.add(drag.offset);
        try {
          const next = normalizePlacement({
            positionMm: { x: target.x * 1000, y: target.y * 1000, z: target.z * 1000 },
            rotationDeg: toDegrees(groupRef.current.rotation),
            surface,
            product: config,
            enclosure: enclosure.specs.terrariumDesigner
          });
          applyNormalizedTransform(next);
        } catch {
          // Keep the last valid position when a product cannot fit.
        }
      }}
      onPointerUp={(event) => {
        if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
        event.stopPropagation();
        dragRef.current = null;
        try { event.target.releasePointerCapture(event.pointerId); } catch { /* Pointer capture may already be released. */ }
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
        document.body.style.cursor = 'grab';
        commitTransform();
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
        document.body.style.cursor = '';
        commitTransform();
      }}
    >
      {model}
      {selected && !readOnly && <mesh>
        <boxGeometry args={[
          millimetersToMeters(config.dimensionsMm.width),
          millimetersToMeters(config.dimensionsMm.height),
          millimetersToMeters(config.dimensionsMm.depth)
        ]} />
        <meshBasicMaterial color="#45e0a1" wireframe transparent opacity={0.38} />
      </mesh>}
    </group>
  );

  if (!selected || readOnly) return object;
  return (
    <TransformControls
      mode={mode}
      showX={mode === 'rotate' ? rotateNormal === 'x' : translateAxes.x}
      showY={mode === 'rotate' ? rotateNormal === 'y' : translateAxes.y}
      showZ={mode === 'rotate' ? rotateNormal === 'z' : translateAxes.z}
      onObjectChange={handleObjectChange}
      onMouseUp={commitTransform}
    >
      {object}
    </TransformControls>
  );
}

function SceneContents({ enclosure, products, objects, selectedId, mode, onSelect, onTransform, readOnly }) {
  const orbitControlsRef = useRef(null);
  const { innerDimensionsMm } = enclosure.specs.terrariumDesigner;
  const height = millimetersToMeters(innerDimensionsMm.height);

  return (
    <>
      <color attach="background" args={['#0b1510']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 3, 4]} intensity={2.2} />
      <directionalLight position={[-2, 1, -2]} intensity={0.85} color="#9abf9b" />
      <EnclosureShell enclosure={enclosure} />
      <mesh position={[0, -height / 2 - 0.015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#101b15" roughness={1} />
      </mesh>
      {objects.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) return null;
        return (
          <PlacedProduct
            key={item.instanceId}
            product={product}
            item={item}
            selected={selectedId === item.instanceId}
            mode={mode}
            onSelect={onSelect}
            onTransform={onTransform}
            readOnly={readOnly}
            enclosure={enclosure}
            orbitControlsRef={orbitControlsRef}
          />
        );
      })}
      <OrbitControls ref={orbitControlsRef} makeDefault enableDamping dampingFactor={0.09} minDistance={0.7} maxDistance={3.4} maxPolarAngle={Math.PI * 0.92} />
    </>
  );
}

export default function TerrariumScene({
  enclosure,
  products,
  objects,
  selectedId,
  mode = 'translate',
  onSelect = () => {},
  onTransform = () => {},
  readOnly = false,
  className = ''
}) {
  return (
    <div className={`relative h-full min-h-[360px] touch-none overflow-hidden rounded-xl bg-[#0b1510] ${className}`}>
      <TerrariumSceneErrorBoundary>
      <Canvas
        camera={{ position: [1.12, 0.72, 1.48], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ powerPreference: 'high-performance', antialias: true }}
        fallback={<div className="flex h-full min-h-[360px] items-center justify-center px-8 text-center text-sm text-gray-300">Ta przeglądarka nie udostępnia WebGL. Możesz nadal przeglądać listę produktów i wycenę.</div>}
        onPointerMissed={() => onSelect(null)}
      >
        <Suspense fallback={null}>
          <SceneContents
            enclosure={enclosure}
            products={products}
            objects={objects}
            selectedId={selectedId}
            mode={mode}
            onSelect={onSelect}
            onTransform={onTransform}
            readOnly={readOnly}
          />
        </Suspense>
      </Canvas>
      </TerrariumSceneErrorBoundary>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-[11px] text-white/65 backdrop-blur">
        Złap element lub strzałkę, aby go ustawić · puste miejsce obraca widok
      </div>
    </div>
  );
}
