import * as THREE from 'three';

export interface DismantleState {
  progress: number; // 0 to 1
  originalTransforms: Map<THREE.Object3D, { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>;
  explodeVectors: Map<THREE.Object3D, THREE.Vector3>;
}

/**
 * Initializes the dismantle state for a given root object.
 * It recursively finds all meshes/groups that are distinct parts and calculates
 * a vector pointing outwards from the center of the model.
 */
export function initDismantleState(root: THREE.Object3D): DismantleState {
  const state: DismantleState = {
    progress: 0,
    originalTransforms: new Map(),
    explodeVectors: new Map(),
  };

  // Calculate bounding box of the whole model to find the center
  const rootBox = new THREE.Box3().setFromObject(root);
  const rootCenter = rootBox.getCenter(new THREE.Vector3());

  // We want to explode children of the root (or specific interaction parts).
  // For a generic explode, we explode top-level children of the main group that have geometry.
  // A more robust way is to explode named interactive parts if they exist, but fallback to all meshes.

  root.traverse((child) => {
    if (child !== root && child instanceof THREE.Mesh) {
      // Store original
      state.originalTransforms.set(child, {
        position: child.position.clone(),
        rotation: child.rotation.clone(),
        scale: child.scale.clone(),
      });

      // Calculate explode vector
      const childBox = new THREE.Box3().setFromObject(child);
      const childCenter = childBox.getCenter(new THREE.Vector3());
      
      const dir = new THREE.Vector3().subVectors(childCenter, rootCenter);
      // Give a little push upwards and outwards
      dir.y += 0.2; 
      dir.normalize();
      
      // Magnitude of explosion (could depend on bounding box size)
      const magnitude = rootBox.getSize(new THREE.Vector3()).length() * 0.5;
      dir.multiplyScalar(Math.max(magnitude, 1.0));

      state.explodeVectors.set(child, dir);
    }
  });

  return state;
}

/**
 * Applies the dismantle progress (0 to 1) to the object's meshes.
 */
export function applyDismantleProgress(state: DismantleState, progress: number) {
  state.progress = Math.max(0, Math.min(1, progress));
  
  state.originalTransforms.forEach((orig, child) => {
    const explodeVec = state.explodeVectors.get(child);
    if (explodeVec) {
      child.position.copy(orig.position).add(explodeVec.clone().multiplyScalar(state.progress));
    }
  });
}

/**
 * Applies a procedural transform (e.g., opening a door) based on interaction config.
 */
export function applyProceduralTransform(
  part: THREE.Object3D, 
  interactionType: string, 
  axis: 'x' | 'y' | 'z', 
  min: number, 
  max: number, 
  progress: number // 0 to 1
) {
  const value = min + (max - min) * progress;
  
  if (interactionType === 'ROTATE' || interactionType === 'OPEN' || interactionType === 'CLOSE') {
    // Rotation is typically in degrees, convert to radians
    part.rotation[axis] = THREE.MathUtils.degToRad(value);
  } else if (interactionType === 'SLIDE') {
    part.position[axis] = value;
  }
}
