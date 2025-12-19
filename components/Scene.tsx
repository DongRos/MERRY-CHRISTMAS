import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'this';
import * as THREE_LIB from 'three';
import DiamondParticles from './DiamondParticles';
import Garland from './Garland';
import PostEffects from './PostEffects';

// Explicitly use the imported THREE for types and constructors
const THREE = THREE_LIB;

interface SceneProps {
  mode: 'WISH' | 'CHAOS';
  blurLevel: number;
  snowSize: number;
}

function StarTopper() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.6;
    const innerRadius = 0.28;
    
    for (let i = 0; i < points * 2; i++) {
      // Start at Math.PI / 2 to make the first point (tip) at the top center
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      // We want the tip up, so at i=0, angle is -PI/2. 
      // sin(-PI/2) = -1. To point UP, we need y to be positive.
      // Let's adjust: angle = (i * Math.PI) / points + Math.PI / 2
      const adjAngle = (i * Math.PI) / points - Math.PI / 2;
      // Alternatively, just swap the sign or rotation. 
      // Let's use standard polar: 0 is right, PI/2 is up.
      const finalAngle = (i * Math.PI) / points + Math.PI / 2;
      
      const x = Math.cos(finalAngle) * radius;
      const y = Math.sin(finalAngle) * radius;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = {
    steps: 1,
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 3
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Breathing effect
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 3 + Math.sin(state.clock.elapsedTime * 2.5) * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 6.3, 0]}>
      <extrudeGeometry args={[starShape, extrudeSettings]} />
      <meshStandardMaterial 
        color="#ffffff" 
        emissive="#ffffff" 
        emissiveIntensity={4}
        toneMapped={false}
      />
    </mesh>
  );
}

function Snow({ size, count = 1500 }: { size: number, count?: number }) {
  const points = useRef<THREE.Points>(null);
  // 1. 定义一个足够大的最大值，防止 buffer 重新分配
  const maxCount = 20000;
  
  const particles = useMemo(() => {
    // 2. 始终按照最大数量分配内存，只运行一次 (deps 为空数组)
    const p = new Float32Array(maxCount * 3);
    const v = new Float32Array(maxCount); 
    for (let i = 0; i < maxCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = Math.random() * 50 - 25;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
      v[i] = 0.05 + Math.random() * 0.1;
    }
    return { positions: p, velocities: v };
  }, []); 

  useFrame(() => {
    if (!points.current) return;
    
    // 3. 使用 setDrawRange 动态控制当前渲染多少个雪花，避免重置 Buffer
    points.current.geometry.setDrawRange(0, Math.min(count, maxCount));

    const pos = points.current.geometry.attributes.position.array as Float32Array;
    const speedMultiplier = 1 + size * 5;

    // 4. 循环更新所有粒子（maxCount），确保隐藏的粒子位置也在持续更新，
    // 这样当它们显示出来时位置是自然的，不会突然跳出来。
    for (let i = 0; i < maxCount; i++) {
      pos[i * 3 + 1] -= particles.velocities[i] * speedMultiplier;
      pos[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      
      if (pos[i * 3 + 1] < -25) {
        pos[i * 3 + 1] = 25;
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        {/* 5. 这里 count 固定为 maxCount，array 长度也不变 */}
        <bufferAttribute 
          attach="attributes-position" 
          count={maxCount} 
          array={particles.positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={size * 0.3} 
        color="#ffffff" 
        transparent 
        opacity={0.6} 
        sizeAttenuation 
      />
    </points>
  );
}

export default function Scene({ mode, blurLevel, snowSize }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <OrbitControls 
        enablePan={false} 
        minDistance={8} 
        maxDistance={35} 
        enableDamping={true}
        dampingFactor={0.05}
      />

      <ambientLight intensity={0.4} color="#001133" />
      <pointLight position={[15, 15, 15]} intensity={2} color="#ffffff" />
      <pointLight position={[-15, -10, -15]} intensity={1.5} color="#4455ff" />

      {/* [修改] 使用 files 属性加载本地 public 目录下的 night.hdr，不再联网 */}
      <Environment files="/night.hdr" background={false} />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

      <Sparkles 
        count={5000} 
        scale={25} 
        size={2} 
        speed={0.2} 
        opacity={0.4} 
        color="#ffffff" 
      />

      {/* 修改 count：基础 2000 + 根据 snowSize 动态增加到约 17000 */}
      <Snow size={snowSize} count={Math.floor(2000 + snowSize * 10000)} />

      <group ref={groupRef}>
        <DiamondParticles mode={mode} />
        <Garland visible={mode === 'WISH'} />
        {mode === 'WISH' && <StarTopper />}
      </group>

      <PostEffects blurLevel={blurLevel} />
    </>
  );
}
