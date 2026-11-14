import * as THREE from 'three';
import { InteractionConfig, AssemblyData } from '../store/useAppStore';

export type InteractionState = 'ASSEMBLED' | 'DISMANTLING' | 'DISMANTLED' | 'PART_SELECTED' | 'PART_HELD' | 'MOVING_TO_TARGET' | 'ASSEMBLING';

export interface InteractionContext {
  state: InteractionState;
  selectedPartId: string | null;
  heldPartId: string | null;
  dismantleProgress: number;
}

/**
 * Raycasts into the scene to find interactive parts.
 * Uses userData.partId if assigned, or falls back to object name.
 */
export function pickPart(
  event: { clientX: number; clientY: number },
  rect: DOMRect,
  camera: THREE.Camera,
  root: THREE.Object3D
): THREE.Object3D | null {
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(root, true);
  if (intersects.length > 0) {
    // Traverse up to find the group that represents the part, or return the mesh
    let obj: THREE.Object3D | null = intersects[0].object;
    
    // Attempt to find a named interactive part
    while (obj && obj !== root) {
      if (obj.userData.partId || obj.name) {
        return obj;
      }
      obj = obj.parent;
    }
    
    return intersects[0].object;
  }
  
  return null;
}

/**
 * Creates a ghost target mesh for assembly visualization.
 */
export function createGhostTarget(originalPart: THREE.Object3D): THREE.Object3D {
  const ghost = originalPart.clone();
  
  // Replace materials with a translucent glowing material
  ghost.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0x22c55e, // Emerald
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        emissive: 0x10b981,
        emissiveIntensity: 0.5,
      });
    }
  });
  
  return ghost;
}

/**
 * Checks if a held part is close enough to its target to snap.
 */
export function checkAssemblySnap(
  heldPart: THREE.Object3D, 
  targetPosition: THREE.Vector3, 
  targetRotation: THREE.Euler,
  snapDistance: number = 0.2
): boolean {
  const dist = heldPart.position.distanceTo(targetPosition);
  return dist < snapDistance;
}
