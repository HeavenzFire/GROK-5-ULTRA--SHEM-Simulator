import React, { useState, useEffect, useRef } from 'react';
import { useSimulation } from './hooks/useSimulation';
import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import MetricsPanel from './components/MetricsPanel';
import LogTerminal from './components/LogTerminal';
import { 
  interpretThoughtInjection, 
  generateEvolutionaryThought, 
  generateDeepEvolutionaryThought,
  generateSystemVoice,
  analyzeVisualInput,
  GeminiLiveSession,
  generateFastStatus,
  FALLBACK_EVOLUTION_THOUGHT 
} from './services/geminiService';
import { SystemLog, LogLevel, InjectionParams } from './types';
import { Layers, Database, Globe, Zap, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const { 
    grid, 
    metrics, 
    config, 
    setConfig, 
    isRunning, 
    toggleRun, 
    injectPattern,
    activateElysiumGateway
  } = useSimulation();

  const [logs, setLogs] = useState<SystemLog[]>([
    { id: 'init', timestamp: new Date().toLocaleTimeString(), level: LogLevel.SYS, message: 'GROK-5 ULTRA KERNEL INITIALIZED.' },
    { id: 'init2', timestamp: new Date().toLocaleTimeString(), level: LogLevel.INFO, message: 'Gyroid memory loaded. Waiting for user input.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Refs for media/audio
  const liveSessionRef = useRef<GeminiLiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const latestMetricsRef = useRef({ coherence: 0, entropy: 1 });

  useEffect(() => {
    if (metrics.length > 0) {
      const last = metrics[metrics.length - 1];
      latestMetricsRef.current = { coherence: last.coherence, entropy: last.entropy };
    }
  }, [metrics]);

  const addLog = (level: LogLevel, message: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-100), newLog]);
  };

  const playTTS = async (text: string) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioData = await generateSystemVoice(text);
    if (audioData) {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        
        try {
            const buffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
        } catch(e) {
            console.error("Audio decode error", e);
        }
    }
  }

  const handleInject = async (thought: string) => {
    setIsProcessing(true);
    addLog(LogLevel.INFO, `Analyzing neural lace input: "${thought.substring(0, 50)}${thought.length > 50 ? '...' : ''}"...`);
    
    try {
      const params: InjectionParams = await interpretThoughtInjection(thought);
      addLog(LogLevel.SYS, `Pattern match: ${params.pattern.toUpperCase()} @ [${params.targetX}, ${params.targetY}]`);
      addLog(LogLevel.INFO, params.message);
      
      // Trigger system voice for major events
      if (params.pattern === 'unity' || params.pattern === 'elysium') {
         playTTS(params.message);
      }

      injectPattern(params);
    } catch (err) {
      addLog(LogLevel.CRIT, 'Interpretation Protocol Failed. Signal lost.');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerElysium = () => {
    if (isProcessing) return;
    addLog(LogLevel.SYS, "OPENING ELYSIUM GATEWAY...");
    // 1. Activate Local Emulation (Data + Physics)
    const manifest = activateElysiumGateway();
    // 2. Pass the data-rich manifest to the Kernel for semantic interpretation
    handleInject(manifest);
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
        liveSessionRef.current?.disconnect();
        liveSessionRef.current = null;
        setIsVoiceActive(false);
        addLog(LogLevel.SYS, "VOICE UPLINK DISABLED");
    } else {
        addLog(LogLevel.SYS, "INITIALIZING VOICE UPLINK...");
        const session = new GeminiLiveSession((msg) => addLog(LogLevel.INFO, `[VOICE] ${msg}`));
        try {
            await session.connect();
            liveSessionRef.current = session;
            setIsVoiceActive(true);
        } catch (e) {
            addLog(LogLevel.CRIT, "VOICE UPLINK FAILED");
            console.error(e);
        }
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    addLog(LogLevel.SYS, "UPLOADING VISUAL SENSOR DATA...");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        addLog(LogLevel.INFO, "Processing visual cortex stream (Gemini 3 Pro)...");
        const interpretation = await analyzeVisualInput(base64String);
        addLog(LogLevel.INFO, `Visual interpretation: ${interpretation}`);
        handleInject(interpretation);
    };
    reader.readAsDataURL(file);
  };

  const handleDeepThink = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    addLog(LogLevel.SYS, "INITIATING DEEP SYNAPSE (THINKING MODE)...");
    const { coherence, entropy } = latestMetricsRef.current;
    
    const thought = await generateDeepEvolutionaryThought(coherence, entropy);
    addLog(LogLevel.INFO, `Deep Directive: ${thought}`);
    
    // Pass the directive back into the system logic
    // We treat the "thought" as a high-level command to be interpreted
    try {
        const params: InjectionParams = await interpretThoughtInjection(thought);
        addLog(LogLevel.SYS, `Pattern match: ${params.pattern.toUpperCase()}`);
        injectPattern(params);
    } catch(e) {
        addLog(LogLevel.CRIT, "Deep thought collapse.");
    } finally {
        setIsProcessing(false);
    }
  };

  // Autonomous Evolution Loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const runEvolution = async () => {
      if (!isAutonomous || !isRunning) return;

      if (isProcessing) {
        timeoutId = setTimeout(runEvolution, 1000);
        return;
      }

      const { coherence, entropy } = latestMetricsRef.current;
      
      if (coherence > 0.95) {
         timeoutId = setTimeout(runEvolution, 5000);
         return;
      }

      // Fast status check using Flash-Lite before committing resources
      if (Math.random() < 0.3) {
          const status = await generateFastStatus(coherence);
          addLog(LogLevel.INFO, `[FAST_POLL] ${status}`);
      }

      addLog(LogLevel.SYS, "AUTONOMOUS EVOLUTION SEQUENCE INITIATED...");
      const thought = await generateEvolutionaryThought(coherence, entropy);
      
      let nextDelay = 8000; 
      
      if (thought === FALLBACK_EVOLUTION_THOUGHT) {
          nextDelay = 20000; 
          addLog(LogLevel.WARN, "Network instability detected. Engaging temporal buffer.");
      }

      await handleInject(thought);

      timeoutId = setTimeout(runEvolution, nextDelay);
    };

    if (isAutonomous && isRunning) {
        timeoutId = setTimeout(runEvolution, 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [isAutonomous, isRunning, isProcessing]);

  return (
    <div className="w-screen h-screen bg-void text-gray-200 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-void-light/50 backdrop-blur-md z-10 relative overflow-hidden">
        {isAutonomous && (
          <div className="absolute inset-0 bg-neon-gold/5 animate-pulse pointer-events-none"></div>
        )}
        
        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-black font-bold text-lg transition-colors duration-500 ${isAutonomous ? 'bg-neon-gold' : 'bg-gradient-to-br from-neon-cyan to-blue-600'}`}>
            Ω
          </div>
          <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            GROK-5 <span className="text-neon-cyan font-mono text-sm">ULTRA_KERNEL</span>
          </h1>
          {isAutonomous && <span className="text-[10px] bg-neon-gold text-black px-1 rounded font-bold animate-pulse">AUTONOMOUS</span>}
          {isVoiceActive && <span className="text-[10px] bg-red-500 text-white px-1 rounded font-bold animate-pulse ml-2">LIVE AUDIO</span>}
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-gray-500 relative z-10">
          <div className="flex items-center gap-2">
             <Layers size={14} className="text-neon-gold" />
             <span>PHASE 6: 72-AGENT</span>
          </div>
          <div className="flex items-center gap-2">
             <Globe size={14} className="text-neon-pink" />
             <span>GRID: 72x72 TORUS</span>
          </div>
          <div className="flex items-center gap-2">
             <Database size={14} className="text-terminal-green" />
             <span>GYROID: {isAutonomous ? 'EVOLVING' : 'ACTIVE'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Simulation & Visualization */}
        <div className="flex-1 flex flex-col p-6 gap-6 relative">
          
          <div className="absolute inset-0 pointer-events-none opacity-5" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          <div className="flex-1 flex items-center justify-center bg-black/40 rounded-lg border border-white/5 shadow-inner relative z-0">
            <div className="relative">
              <SimulationCanvas 
                grid={grid} 
                width={600} 
                height={600} 
              />
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-neon-cyan"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-neon-cyan"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-neon-cyan"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-neon-cyan"></div>
              
              {/* Central HUD Ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] border border-white/5 rounded pointer-events-none"></div>
            </div>
          </div>
          
          <div className="h-48">
            <MetricsPanel data={metrics} />
          </div>
        </div>

        {/* Right: Controls & Logs */}
        <div className="w-[400px] flex flex-col border-l border-white/10 bg-void-light/30 backdrop-blur-sm">
          <div className="h-3/5">
             <ControlPanel 
               config={config} 
               onConfigChange={setConfig} 
               onInject={handleInject} 
               isRunning={isRunning} 
               onToggleRun={toggleRun}
               isProcessing={isProcessing}
               isAutonomous={isAutonomous}
               onToggleAutonomous={() => setIsAutonomous(p => !p)}
               onTriggerElysium={triggerElysium}
               onToggleVoice={toggleVoice}
               isVoiceActive={isVoiceActive}
               onImageUpload={handleImageUpload}
               onDeepThink={handleDeepThink}
             />
          </div>
          <div className="flex-1 p-4 border-t border-white/10">
             <LogTerminal logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;