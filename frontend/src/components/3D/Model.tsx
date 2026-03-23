import React, { useRef, useEffect, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useModelInteractions } from '../../hooks/useModelInteractions'

export default function Model(props: any) {
  const skinGLTF = useGLTF('/models/human.glb')
  const skeletonGLTF = useGLTF('/models/skeleton.glb')
  
  const { selectedOrgan, hoveredOrgan, setSelectedOrgan, setHoveredOrgan, showSkin, showSkeleton } = useModelInteractions()
  const group = useRef<THREE.Group>(null)

  const [tooltipPos, setTooltipPos] = useState<THREE.Vector3 | null>(null)
  
  // Track UUIDs to uniquely highlight exact meshes!
  const [hoveredMeshUuid, setHoveredMeshUuid] = useState<string | null>(null)
  const [selectedMeshUuid, setSelectedMeshUuid] = useState<string | null>(null)

  // 1. Scene Processing & Auto-Alignment
  useEffect(() => {
    // Reset selections on reload
    setSelectedMeshUuid(null);
    setHoveredMeshUuid(null);

    const processScene = (scene: THREE.Group, isSkin: boolean) => {
      if (!scene) return;
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            mesh.material = (mesh.material as THREE.Material).clone();
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.transparent = isSkin;
            mat.opacity = isSkin ? 0.9 : 1.0; 
            mat.roughness = 0.5;
            mat.emissive = new THREE.Color(0x000000);
          }
          // Mark meshes so we know which layer they belong to when raycasting
          mesh.userData.isSkinLayer = isSkin;
        }
      })
    };

    if (skinGLTF.scene) processScene(skinGLTF.scene, true);
    if (skeletonGLTF.scene) processScene(skeletonGLTF.scene, false);

    // Auto-Alignment
    if (skinGLTF.scene && skeletonGLTF.scene) {
      const skinBox = new THREE.Box3().setFromObject(skinGLTF.scene);
      const skinSize = new THREE.Vector3();
      skinBox.getSize(skinSize);
      const skinCenter = new THREE.Vector3();
      skinBox.getCenter(skinCenter);

      skeletonGLTF.scene.scale.set(1, 1, 1);
      skeletonGLTF.scene.position.set(0, 0, 0);

      const skelBox = new THREE.Box3().setFromObject(skeletonGLTF.scene);
      const skelSize = new THREE.Vector3();
      skelBox.getSize(skelSize);

      const scaleFactor = (skinSize.y / skelSize.y) * 0.98;
      skeletonGLTF.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const newlyScaledBox = new THREE.Box3().setFromObject(skeletonGLTF.scene);
      const newSkelCenter = new THREE.Vector3();
      newlyScaledBox.getCenter(newSkelCenter);

      const offset = new THREE.Vector3().subVectors(skinCenter, newSkelCenter);
      skeletonGLTF.scene.position.copy(offset);
    }
  }, [skinGLTF.scene, skeletonGLTF.scene])

  // Clear selected mesh if selection is cleared from outside UI (e.g. they click 'Reset' in Chat.tsx)
  useEffect(() => {
    if (!selectedOrgan) {
      setSelectedMeshUuid(null);
    }
  }, [selectedOrgan]);

  // 2. Identify the clicked region robustly
  const identifyRegion = (mesh: THREE.Mesh, point: THREE.Vector3) => {
    // Priority 1: Check raw names for perfectly sliced facial/body meshes (eyes, mouth, arm, leg, etc.)
    const rawName = mesh.name.replace(/_/g, ' ').trim().toLowerCase();
    const matName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name || '').toLowerCase();
    const searchName = rawName + ' ' + matName;

    if (searchName.includes("eye")) {
        if (searchName.includes("left") || searchName.includes(" l ")) return "Left Eye";
        if (searchName.includes("right") || searchName.includes(" r ")) return "Right Eye";
        return "Eyes";
    }
    if (searchName.includes("nose")) return "Nose";
    if (searchName.includes("mouth") || searchName.includes("lip")) return "Mouth";
    if (searchName.includes("tongue") || searchName.includes("toungue")) return "Tongue";
    if (searchName.includes("ear")) {
        if (searchName.includes("left") || searchName.includes(" l ")) return "Left Ear";
        if (searchName.includes("right") || searchName.includes(" r ")) return "Right Ear";
        return "Ears";
    }
    if (searchName.includes("neck")) return "Neck";
    if (searchName.includes("throat")) return "Throat";
    if (searchName.includes("teeth") || searchName.includes("tooth")) return "Teeth";
    if (searchName.includes("head") || searchName.includes("face") || searchName.includes("skull")) return "Head";

    if (searchName.includes("arm")) {
        if (searchName.includes("left") || searchName.includes(" l ")) return "Left Arm";
        if (searchName.includes("right") || searchName.includes(" r ")) return "Right Arm";
        return "Arms";
    }
    if (searchName.includes("hand")) return "Hands";
    if (searchName.includes("leg")) return "Legs";
    if (searchName.includes("foot") || searchName.includes("feet")) return "Feet";
    if (searchName.includes("chest") || searchName.includes("torso")) return "Chest";

    // Priority 2: Not a specific string-named part, check if it is part of the Skeleton layer
    if (!mesh.userData.isSkinLayer) {
        let boneName = mesh.name.replace(/_/g, ' ').trim();
        // Fallback to "Bone" if the mesh name is gibberish like Object_1
        if (boneName.toLowerCase().includes("object") || !boneName) return "Bone";
        return boneName.charAt(0).toUpperCase() + boneName.slice(1);
    }

    // Priority 3: It's the generic Skin shell -> Use exact Y coordinate and X coordinate mapping
    const { x, y } = point;
    const absX = Math.abs(x);
    
    // Head Zone (Y >= 0.55)
    if (y >= 0.55) {
        if (y > 0.75) return "Top of Head";
        if (y >= 0.68) return "Eyes / Forehead";
        if (y >= 0.63) return "Nose";
        if (y >= 0.58) return "Mouth / Jaw";
        return "Neck / Throat";
    }

    // Arms Zone 
    // Upper arms/shoulders are wide (Y > 0.15, X > 0.14)
    // Hands dropping below the waist (Y < 0.15) must be further out (X > 0.22) to avoid false-triggering the hips/thighs
    if (
        (y >= 0.15 && absX > 0.14) || 
        (y < 0.15 && y >= -0.3 && absX > 0.22)
    ) {
        if (y > 0.45) return "Shoulders / Upper Arms";
        if (y > 0.15) return "Forearms / Elbows";
        return "Hands / Wrists";
    }

    // Torso Zone (Y >= 0.0 for the central body)
    if (y >= 0.0) {
        if (y > 0.40) return "Chest / Upper Back";
        if (y > 0.20) return "Abdomen / Mid Back";
        return "Pelvis / Lower Back";
    }

    // Legs Zone (Y < 0.0)
    // The pelvis/hips end at Y=0, so everything below is the legs!
    if (y > -0.45) return "Thighs";
    if (y > -0.75) return "Knees / Calves";
    return "Feet / Ankles";
  }

  // 3. Precise Raycast Intersections filter (No more overlapping layers!)
  const getBestIntersection = (e: any) => {
    if (!e.intersections || e.intersections.length === 0) return null;

    // Filter out invisible objects automatically
    const validIntersections = e.intersections.filter((i: any) => {
       const isVisible = i.object.visible;
       let parentVisible = true;
       // We must explicitly verify parent visibility since we toggle the whole scene visibility
       i.object.traverseAncestors((p: any) => { if (p.visible === false) parentVisible = false; });
       return isVisible && parentVisible && i.object.type === "Mesh";
    });

    if (validIntersections.length === 0) return null;

    let selected = validIntersections.find((i: any) => {
      // If skin is ON, prioritize clicking ONLY the skin layer
      if (showSkin) return i.object.userData.isSkinLayer;
      
      // If skin is OFF, prioritize clicking ONLY the skeleton layer
      if (showSkeleton && !showSkin) return !i.object.userData.isSkinLayer;

      return true;
    });

    return selected || validIntersections[0];
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const selected = getBestIntersection(e);
    if (!selected) return;

    const mesh = selected.object as THREE.Mesh;
    const name = identifyRegion(mesh, selected.point);

    if (!name) {
      document.body.style.cursor = 'auto';
      setHoveredOrgan(null);
      setHoveredMeshUuid(null);
      setTooltipPos(null);
      return;
    }

    document.body.style.cursor = 'pointer';
    setHoveredOrgan(name);
    setHoveredMeshUuid(mesh.uuid);
    setTooltipPos(selected.point);
  }

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    setHoveredOrgan(null);
    setHoveredMeshUuid(null);
    setTooltipPos(null);
  }

  const handleClick = (e: any) => {
    e.stopPropagation();

    console.log("=== CLICK DEBUG ===");
    console.log("Raw Intersections from Three.js:", e.intersections);

    const selected = getBestIntersection(e);
    console.log("Best Valid Intersection:", selected);

    if (!selected) {
        console.log("ERROR: Click raycast failed visibility/layer prioritization rules.");
        return;
    }

    const mesh = selected.object as THREE.Mesh;
    const name = identifyRegion(mesh, selected.point);

    console.log("Hit Mesh:", mesh.name, "| isSkinLayer:", mesh.userData.isSkinLayer);
    console.log("Exact Point of Click Y-Height:", selected.point.y);
    console.log("Resolved Region Name:", name);

    if (!name) return; // Prevent selection entirely if clicking outside the Head region!

    setSelectedOrgan(name, selected.point);
    setSelectedMeshUuid(mesh.uuid);
  }

  // 4. Highly optimized rendering loop
  useFrame((state) => {
    if (group.current && !selectedOrgan) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }

    // Toggle entire layers
    if (skinGLTF.scene) skinGLTF.scene.visible = showSkin;
    if (skeletonGLTF.scene) skeletonGLTF.scene.visible = showSkeleton;

    // Visual Highlighting Logic
    group.current?.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        let targetOpacity = mesh.userData.isSkinLayer ? 0.9 : 1.0;
        let targetEmissive = new THREE.Color(0x000000);
        
        // Use EXACT unique UUID matching
        const isSelected = (selectedMeshUuid === mesh.uuid);
        const isHovered = (hoveredMeshUuid === mesh.uuid);

        if (isSelected) {
            targetOpacity = 1;
            targetEmissive.setHex(0x1e3a8a); // Deep blue selected
        } else if (selectedMeshUuid) {
            targetOpacity = 0.1; // Dim everything else when something is selected!
        } else if (isHovered) {
            targetEmissive.setHex(0x3b82f6); // Light blue hovered
        }

        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
        mat.emissive.lerp(targetEmissive, 0.1);
        mat.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
       <group onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick}>
           {skinGLTF.scene && <primitive object={skinGLTF.scene} castShadow receiveShadow />}
           {skeletonGLTF.scene && <primitive object={skeletonGLTF.scene} castShadow receiveShadow />}
       </group>
       {hoveredOrgan && tooltipPos && !selectedOrgan && (
         <Html position={tooltipPos} center zIndexRange={[100, 0]}>
            <div style={{ 
                background: 'rgba(15, 23, 42, 0.85)', 
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(14, 165, 233, 0.4)',
                color: '#f8fafc', 
                padding: '10px 16px', 
                borderRadius: '12px', 
                fontSize: '14px', 
                fontWeight: '600',
                letterSpacing: '0.3px',
                pointerEvents: 'none', 
                whiteSpace: 'nowrap', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 12px rgba(14, 165, 233, 0.1) inset',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transform: 'translateY(-20px)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9' }}></div>
              {hoveredOrgan}
            </div>
         </Html>
       )}
    </group>
  )
}

useGLTF.preload('/models/human.glb')
useGLTF.preload('/models/skeleton.glb')
