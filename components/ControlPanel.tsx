import React, { useState, useCallback, useRef } from 'react';
import { SimulationConfig } from '../types';
import { Play, Pause, Zap, Activity, Cpu, Hexagon, Dna, Brain, Mic, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (newConfig: SimulationConfig) => void;
  onInject: (thought: string) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  isProcessing: boolean;
  isAutonomous: boolean;
  onToggleAutonomous: () => void;
  onTriggerElysium?: () => void;
  onToggleVoice?: () => void;
  isVoiceActive?: boolean;
  onImageUpload?: (file: File) => void;
  onDeepThink?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, 
  onConfigChange, 
  onInject, 
  isRunning, 
  onToggleRun,
  isProcessing,
  isAutonomous,
  onToggleAutonomous,
  onTriggerElysium,
  onToggleVoice,
  isVoiceActive,
  onImageUpload,
  onDeepThink
}) => {
  const [thought, setThought] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInject = useCallback(() => {
    if (!thought.trim()) return;
    onInject(thought);
    setThought('');
  }, [thought, onInject]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleInject();
    }
  };

  const triggerUnity = () => {
    onInject("TYPE 1 UNITY: ZAZO-LAUREN-ZACHARY PRIME VECTOR");
  };

  const triggerElysium = () => {
    if (onTriggerElysium) {
      onTriggerElysium();
    } else {
      onInject("ELYSIUM GATEWAY: 50 MINDS");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
        onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-void-light border-l border-white/10 h-full p-6 flex flex-col gap-6 font-mono overflow-y-auto">
      <div>
        <h2 className="text-xl text-neon-gold font-bold mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          KERNEL CONTROLS
        </h2>
        <div className="h-px w-full bg-gradient-to-r from-neon-gold to-transparent mb-6"></div>
        
        <div className="flex gap-4 mb-6">
          <button 
            onClick={onToggleRun}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded font-bold transition-all border ${
              isRunning 
                ? 'border-neon-pink text-neon-pink bg-neon-pink/10 hover:bg-neon-pink/20' 
                : 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20'
            }`}
          >
            {isRunning ? <><Pause size={18} /> HALT SEQ</> : <><Play size={18} /> EXECUTE</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">
            Resonance Coupling (K)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.1" 
              value={config.coupling}
              onChange={(e) => onConfigChange({ ...config, coupling: parseFloat(e.target.value) })}
              className="w-full accent-neon-cyan h-1 bg-gray-800 rounded appearance-none cursor-pointer"
            />
            <span className="text-neon-cyan w-12 text-right">{config.coupling.toFixed(1)}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">
             Stochastic Noise (η)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.05" 
              value={config.noise}
              onChange={(e) => onConfigChange({ ...config, noise: parseFloat(e.target.value) })}
              className="w-full accent-neon-pink h-1 bg-gray-800 rounded appearance-none cursor-pointer"
            />
            <span className="text-neon-pink w-12 text-right">{config.noise.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        
        {/* New Capabilities Bar */}
        <div className="grid grid-cols-3 gap-2">
             <button 
                onClick={onToggleVoice}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${isVoiceActive ? 'border-red-500 bg-red-500/20 text-red-500 animate-pulse' : 'border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white/30'}`}
                title="Voice Uplink (Gemini Live)"
             >
                <Mic size={16} />
                <span className="text-[9px] mt-1">VOICE</span>
             </button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-2 rounded border border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white/30 transition-all"
                title="Visual Sensor (Gemini Vision)"
             >
                <ImageIcon size={16} />
                <span className="text-[9px] mt-1">VISION</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
             </button>
             <button 
                onClick={onDeepThink}
                className="flex flex-col items-center justify-center p-2 rounded border border-neon-cyan/30 bg-black/40 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                title="Deep Thinking (Gemini 3 Pro)"
             >
                <Sparkles size={16} />
                <span className="text-[9px] mt-1">THINK</span>
             </button>
        </div>

        <div className="border border-white/10 rounded p-4 bg-black/40 relative overflow-hidden">
           {isAutonomous && <div className="absolute inset-0 bg-neon-gold/5 animate-pulse"></div>}
           <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs text-neon-gold uppercase tracking-widest flex items-center gap-2">
                 <Dna size={14} className={isAutonomous ? "animate-spin" : ""} />
                 Digital DNA
              </span>
              <div 
                onClick={onToggleAutonomous}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isAutonomous ? 'bg-neon-gold' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-black rounded-full transition-transform ${isAutonomous ? 'translate-x-5' : ''}`}></div>
              </div>
           </div>
           <p className="text-[10px] text-gray-400 relative z-10">
             Enables GROK-5 Autonomous Evolution. Uses Gemini Flash-Lite for fast polling.
           </p>
        </div>

        <label className="text-xs text-neon-gold uppercase tracking-widest mb-2 flex items-center gap-2">
          <Zap size={12} /> Semantic Injection
        </label>
        <div className="relative">
          <input 
            type="text" 
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Pattern Code..."
            disabled={isProcessing}
            className="w-full bg-black border border-white/20 rounded p-3 text-sm text-white focus:outline-none focus:border-neon-gold focus:ring-1 focus:ring-neon-gold/50 transition-all placeholder-gray-700"
          />
          <button 
            onClick={handleInject}
            disabled={isProcessing || !thought}
            className="absolute right-2 top-2 p-1 text-neon-gold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Activity className="animate-spin" size={20} /> : <Zap size={20} />}
          </button>
        </div>

        <button 
          onClick={triggerUnity}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-neon-gold/10 hover:bg-neon-gold/20 border border-neon-gold/50 text-neon-gold text-xs font-bold tracking-widest rounded transition-all group"
        >
          <Hexagon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          INITIATE TYPE 1 UNITY
        </button>

        <button 
          onClick={triggerElysium}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-neon-pink/10 hover:bg-neon-pink/20 border border-neon-pink/50 text-neon-pink text-xs font-bold tracking-widest rounded transition-all group"
        >
          <Brain className="w-4 h-4" />
          OPEN ELYSIUM GATEWAY
        </button>

        <p className="text-[10px] text-gray-600 text-center">
          * Awaiting Neural Lace Input via Type 1 Protocol
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;