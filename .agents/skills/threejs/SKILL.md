---
name: Three.js
description: Three.js and React Three Fiber for 3D graphics and immersive experiences
---

## Overview

Three.js is a JavaScript 3D library built on WebGL. React Three Fiber (R3F) is a React renderer for Three.js that makes it easier to build 3D scenes using declarative, component-based patterns familiar to React developers.

## Key Concepts

### Three.js Fundamentals

- **Scene**: Container for all 3D objects
- **Camera**: Defines viewpoint (orthographic or perspective)
- **Renderer**: Renders scene to canvas
- **Geometry**: Shape definition
- **Material**: Surface properties (color, texture, etc.)
- **Mesh**: Combines geometry + material

### React Three Fiber

- Declarative scene composition
- Component-based architecture
- Automatic WebGL resource management
- Hooks for frame updates and interactions

### Rendering Pipeline

1. Clear frame
2. Update scene
3. Apply lights and shadows
4. Render to canvas

## Code Examples

### Basic Three.js Scene

```typescript
import * as THREE from 'three'

// Create scene, camera, renderer
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000)
document.body.appendChild(renderer.domElement)

// Create geometry and material
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
const mesh = new THREE.Mesh(geometry, material)

scene.add(mesh)
camera.position.z = 5

// Add lighting
const light = new THREE.PointLight(0xffffff, 1, 100)
light.position.set(5, 5, 5)
scene.add(light)

// Animation loop
const animate = () => {
  requestAnimationFrame(animate)

  mesh.rotation.x += 0.01
  mesh.rotation.y += 0.01

  renderer.render(scene, camera)
}

animate()

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
```

### React Three Fiber Canvas Setup

```typescript
import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color={0x00ff00} />
      </mesh>
    </Canvas>
  );
}

export default Scene;
```

### Rotating Box Component

```typescript
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={0xff0000} />
    </mesh>
  );
}

function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} />
      <RotatingBox />
    </Canvas>
  );
}
```

### Camera Control

```typescript
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 5, 5]} />
      <OrbitControls />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={0x0088ff} />
      </mesh>

      <gridHelper args={[10, 10]} />
    </Canvas>
  );
}
```

### Textures and Materials

```typescript
import { useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

function TexturedBox() {
  const textures = useTexture({
    map: "/textures/wood.jpg",
    normalMap: "/textures/wood-normal.jpg",
  });

  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        {...textures}
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <TexturedBox />
    </Canvas>
  );
}
```

### Lighting Setups

```typescript
import { Canvas } from "@react-three/fiber";

function LightingScene() {
  return (
    <Canvas>
      {/* Ambient light - basic illumination */}
      <ambientLight intensity={0.4} color={0xffffff} />

      {/* Directional light - simulates sun */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Point light - omnidirectional */}
      <pointLight position={[-5, 5, 5]} intensity={0.8} distance={100} />

      {/* Spotlight - focused beam */}
      <spotLight
        position={[0, 10, 0]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.8}
        castShadow
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={0x888888} />
      </mesh>

      <mesh receiveShadow position={[0, -2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={0xcccccc} />
      </mesh>
    </Canvas>
  );
}
```

### Interactive Objects

```typescript
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function InteractiveBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;

      if (clicked) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial
        color={hovered ? 0xff6600 : 0x0088ff}
        emissive={clicked ? 0xffff00 : 0x000000}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} />
      <InteractiveBox />
    </Canvas>
  );
}
```

### Animations with Tweens

```typescript
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useSpring, a } from "@react-spring/three";
import * as THREE from "three";

function AnimatedBox() {
  const [active, setActive] = useState(false);

  const { scale, rotation } = useSpring({
    scale: active ? 1.5 : 1,
    rotation: active ? [Math.PI, Math.PI, 0] : [0, 0, 0],
    config: { mass: 1, tension: 280, friction: 60 },
  });

  return (
    <a.mesh
      scale={scale}
      rotation={rotation}
      onClick={() => setActive(!active)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={0x0088ff} />
    </a.mesh>
  );
}

function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} />
      <AnimatedBox />
    </Canvas>
  );
}
```

### Model Loading (GLTF)

```typescript
import { useGLTF, PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function Model() {
  const gltf = useGLTF("/models/scene.glb");
  return <primitive object={gltf.scene} />;
}

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} />
      <OrbitControls />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
```

### Post-Processing Effects

```typescript
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";

function Scene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={0x00ff00} emissive={0x00ff00} />
      </mesh>

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} />
      </EffectComposer>
    </Canvas>
  );
}
```

### Particles System

```typescript
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const meshRef = useRef<THREE.Points>(null);

  const particleCount = 1000;
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.0003;
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={0xffffff} size={0.01} />
    </points>
  );
}

function Scene() {
  return (
    <Canvas>
      <Particles />
    </Canvas>
  );
}
```

## Best Practices

### 1. Performance

- Use `PerspectiveCamera` with appropriate near/far planes
- Enable frustum culling for large scenes
- Use LOD (Level of Detail) for complex models
- Batch geometries when possible
- Profile with Three.js DevTools

### 2. Lighting

- Use minimal lights for performance
- Enable shadow mapping only where needed
- Use lower shadow map resolution when possible
- Combine lights efficiently

### 3. Textures

- Compress textures (JPEG for photos, PNG for graphics)
- Use appropriate texture sizes
- Implement texture atlasing
- Lazy-load textures

### 4. React Three Fiber Patterns

- Memoize expensive components
- Use `useFrame` for animation, not useState
- Clean up resources in useEffect
- Avoid creating objects in render

### 5. Accessibility

- Provide alternative experiences for non-3D browsers
- Allow interaction via keyboard and mouse
- Respect reduced motion preferences
- Include scene descriptions

## Common Patterns

### Component Library Structure

```typescript
// Base mesh component
interface MeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

export function Box({ position, rotation, scale }: MeshProps) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <boxGeometry />
      <meshPhongMaterial color={0x0088ff} />
    </mesh>
  );
}
```

### Scene Manager Pattern

```typescript
interface SceneConfig {
  camera: CameraConfig;
  lights: LightConfig[];
  background: THREE.Color;
}

function SceneManager({ config }: { config: SceneConfig }) {
  return (
    <>
      <color attach="background" args={[config.background]} />
      {config.lights.map((light, i) => (
        <primitive key={i} object={createLight(light)} />
      ))}
    </>
  );
}
```

### Performance Monitoring

```typescript
import { useFrame } from "@react-three/fiber";
import { useState } from "react";

function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  let frameCount = 0;
  let lastTime = Date.now();

  useFrame(() => {
    frameCount++;
    const now = Date.now();
    if (now - lastTime >= 1000) {
      setFps(frameCount);
      frameCount = 0;
      lastTime = now;
    }
  });

  return <div>{fps} FPS</div>;
}
```
