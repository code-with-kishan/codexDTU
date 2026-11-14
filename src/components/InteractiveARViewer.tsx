import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Project } from '../store/useAppStore';
import { initDismantleState, applyDismantleProgress, DismantleState } from '../lib/animationSystem';
import { pickPart, createGhostTarget, checkAssemblySnap, InteractionState } from '../lib/interactionSystem';

interface InteractiveARViewerProps {
  modelUrl: string;
  project?: Project | null;
  accentColor?: string;
  onEnterNativeAR?: () => void;
}

function Scene({ modelUrl, project, state, setState, dismantleProgress, selectedPart, setSelectedPart }: any) {
  const { scene, animations } = useGLTF(modelUrl) as any;
  const { actions, names } = useAnimations(animations, scene);
  const { camera, gl } = useThree();
  
  const dismantleStateRef = useRef<DismantleState | null>(null);

  useEffect(() => {
    if (scene && !dismantleStateRef.current) {
      dismantleStateRef.current = initDismantleState(scene);
    }
  }, [scene]);

  useEffect(() => {
    if (dismantleStateRef.current) {
      applyDismantleProgress(dismantleStateRef.current, dismantleProgress);
    }
  }, [dismantleProgress]);

  // Handle clicks for part selection
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (state === 'DISMANTLED' || dismantleProgress > 0) {
      // Basic raycast from event is already handled by three/fiber onClick, 
      // but we use our generic system if needed. For now, rely on fiber's bubbling.
      const part = e.object;
      
      // Traverse up to find a group if needed
      let node = part;
      while (node && node !== scene && !node.userData.partId && node.parent !== scene) {
        node = node.parent;
      }
      
      if (node && node !== scene) {
        setSelectedPart(node.name || node.userData.partId || part.name);
        setState('PART_SELECTED');
      }
    }
  };

  return (
    <group onPointerDown={handleClick}>
      <primitive object={scene} />
      {/* If a part is selected, we could render a highlight or ghost target here */}
    </group>
  );
}

export default function InteractiveARViewer({ modelUrl, project, accentColor, onEnterNativeAR }: InteractiveARViewerProps) {
  const [activeTab, setActiveTab] = useState<'none' | 'interact' | 'animate' | 'dismantle'>('none');
  const [dismantleProgress, setDismantleProgress] = useState(0);
  const [interactionState, setInteractionState] = useState<InteractionState>('ASSEMBLED');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const capabilities = project?.modelCapabilities || {};

  return (
    <div className="w-full h-full relative bg-[#0a0a0a]">
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [2, 2, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} castShadow intensity={1} />
        <Environment preset="city" />
        <Scene 
          modelUrl={modelUrl} 
          project={project}
          state={interactionState}
          setState={setInteractionState}
          dismantleProgress={dismantleProgress}
          selectedPart={selectedPart}
          setSelectedPart={setSelectedPart}
        />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={10} blur={2} far={10} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="pointer-events-auto">
          {selectedPart && (
            <div className="px-4 py-2 bg-black/60 backdrop-blur rounded-lg text-white text-xs border border-white/10">
              Selected: <span className="font-bold">{selectedPart}</span>
              <button 
                className="ml-4 text-red-400 hover:text-red-300"
                onClick={() => { setSelectedPart(null); setInteractionState(dismantleProgress > 0 ? 'DISMANTLED' : 'ASSEMBLED'); }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="pointer-events-auto">
           {/* Native AR Button Fallback */}
           <button 
             onClick={onEnterNativeAR}
             className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full shadow-lg"
             style={{ backgroundColor: accentColor || '#ffffff' }}
           >
             Native AR
           </button>
        </div>
      </div>

      {/* Bottom Interaction Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-auto">
        
        {/* Expanded Panels */}
        {activeTab === 'dismantle' && (
          <div className="mb-4 p-4 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex justify-between text-xs text-white/70 mb-2 font-bold uppercase tracking-widest">
              <span>Explode</span>
              <button onClick={() => setDismantleProgress(0)}>Reset</button>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={dismantleProgress}
              onChange={(e) => {
                setDismantleProgress(parseFloat(e.target.value));
                setInteractionState(parseFloat(e.target.value) === 0 ? 'ASSEMBLED' : 'DISMANTLED');
              }}
              className="w-full accent-brand-primary"
            />
          </div>
        )}

        {activeTab === 'animate' && (
          <div className="mb-4 p-4 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-white text-xs">
            Animations logic goes here...
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex bg-black/70 backdrop-blur-md rounded-full border border-white/10 p-1">
          {capabilities.interactiveParts && (
            <button 
              className={`flex-1 py-3 text-xs font-bold rounded-full transition-colors ${activeTab === 'interact' ? 'bg-white/20 text-white' : 'text-white/60'}`}
              onClick={() => setActiveTab(activeTab === 'interact' ? 'none' : 'interact')}
            >
              Interact
            </button>
          )}
          {capabilities.animations && (
            <button 
              className={`flex-1 py-3 text-xs font-bold rounded-full transition-colors ${activeTab === 'animate' ? 'bg-white/20 text-white' : 'text-white/60'}`}
              onClick={() => setActiveTab(activeTab === 'animate' ? 'none' : 'animate')}
            >
              Animate
            </button>
          )}
          {capabilities.dismantling && (
            <button 
              className={`flex-1 py-3 text-xs font-bold rounded-full transition-colors ${activeTab === 'dismantle' ? 'bg-white/20 text-white' : 'text-white/60'}`}
              onClick={() => setActiveTab(activeTab === 'dismantle' ? 'none' : 'dismantle')}
            >
              Dismantle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
