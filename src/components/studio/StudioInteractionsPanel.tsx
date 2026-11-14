import React from 'react';
import { Activity, Power, Settings2, ShieldAlert } from 'lucide-react';
import { useAppStore, ModelCapabilities, InteractionConfig } from '../../store/useAppStore';

interface StudioInteractionsPanelProps {
  projectId: string;
  selectedPartId: string | null;
  themeMuted: string;
  uiTheme: string;
}

export function StudioInteractionsPanel({ projectId, selectedPartId, themeMuted, uiTheme }: StudioInteractionsPanelProps) {
  const project = useAppStore(state => state.projects.find(p => p.id === projectId));
  const updateProject = useAppStore(state => state.updateProject);

  if (!project) return null;

  const capabilities = project.modelCapabilities || {};
  const interactions = project.interactions || [];

  const toggleCapability = (key: keyof ModelCapabilities) => {
    updateProject(projectId, {
      modelCapabilities: {
        ...capabilities,
        [key]: !capabilities[key]
      }
    });
  };

  const selectedInteraction = interactions.find(i => i.partId === selectedPartId);

  const setInteraction = (config: Partial<InteractionConfig>) => {
    if (!selectedPartId) return;
    
    let newInteractions = [...interactions];
    const existingIndex = newInteractions.findIndex(i => i.partId === selectedPartId);
    
    if (existingIndex >= 0) {
      newInteractions[existingIndex] = { ...newInteractions[existingIndex], ...config };
    } else {
      newInteractions.push({
        id: crypto.randomUUID(),
        partId: selectedPartId,
        type: 'ROTATE',
        ...config
      } as InteractionConfig);
    }
    
    updateProject(projectId, { interactions: newInteractions });
  };

  const removeInteraction = () => {
    if (!selectedPartId) return;
    updateProject(projectId, {
      interactions: interactions.filter(i => i.partId !== selectedPartId)
    });
  };

  return (
    <details className="group" open>
      <summary className={`text-xs font-bold uppercase tracking-widest cursor-pointer list-none flex items-center gap-2 ${themeMuted}`}>
        <Activity className="w-3.5 h-3.5" />
        Capabilities &amp; Behaviors
      </summary>
      
      <div className={`mt-3 space-y-3 text-[11px] ${uiTheme === 'light' ? 'text-zinc-800' : 'text-white/80'}`}>
        
        {/* Global Capabilities */}
        <div className="space-y-2 pb-3 border-b border-white/10">
          <p className="text-[10px] uppercase font-bold text-brand-primary mb-2">Global Features</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!capabilities.dismantling} onChange={() => toggleCapability('dismantling')} />
            Enable Explode / Dismantle
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!capabilities.interactiveParts} onChange={() => toggleCapability('interactiveParts')} />
            Enable Interactive Parts
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!capabilities.assembly} onChange={() => toggleCapability('assembly')} />
            Enable Smart Assembly
          </label>
        </div>

        {/* Selected Part Configuration */}
        <div>
          <p className="text-[10px] uppercase font-bold text-brand-primary mt-3 mb-2">Selected Part Behavior</p>
          {!selectedPartId || selectedPartId === 'logo-plane' ? (
            <p className={themeMuted}>Select a part in the scene hierarchy to configure its behavior.</p>
          ) : (
            <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold truncate" title={selectedPartId}>{selectedPartId}</span>
                {selectedInteraction && (
                  <button onClick={removeInteraction} className="text-red-400 hover:text-red-300">Clear</button>
                )}
              </div>
              
              <label className="flex flex-col gap-1">
                <span className={themeMuted}>Interaction Type</span>
                <select 
                  value={selectedInteraction?.type || ''} 
                  onChange={(e) => setInteraction({ type: e.target.value })}
                  className="rounded-lg border bg-transparent px-2 py-1.5 text-xs border-white/20"
                >
                  <option value="">None</option>
                  <option value="ROTATE">Rotate</option>
                  <option value="OPEN">Open (Hinge)</option>
                  <option value="SLIDE">Slide</option>
                  <option value="TOGGLE">Toggle</option>
                </select>
              </label>

              {selectedInteraction?.type && ['ROTATE', 'OPEN', 'SLIDE'].includes(selectedInteraction.type) && (
                <>
                  <label className="flex flex-col gap-1 mt-2">
                    <span className={themeMuted}>Axis</span>
                    <select 
                      value={selectedInteraction.axis || 'y'} 
                      onChange={(e) => setInteraction({ axis: e.target.value })}
                      className="rounded-lg border bg-transparent px-2 py-1.5 text-xs border-white/20"
                    >
                      <option value="x">X Axis</option>
                      <option value="y">Y Axis</option>
                      <option value="z">Z Axis</option>
                    </select>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="flex flex-col gap-1">
                      <span className={themeMuted}>Min</span>
                      <input 
                        type="number" 
                        value={selectedInteraction.min || 0} 
                        onChange={(e) => setInteraction({ min: parseFloat(e.target.value) })}
                        className="rounded border px-1 py-1 text-xs bg-transparent border-white/20" 
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={themeMuted}>Max</span>
                      <input 
                        type="number" 
                        value={selectedInteraction.max || 90} 
                        onChange={(e) => setInteraction({ max: parseFloat(e.target.value) })}
                        className="rounded border px-1 py-1 text-xs bg-transparent border-white/20" 
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
