export interface SimulationMetrics {
  coherence: number; // Order parameter R (0 to 1)
  entropy: number;   // Shannon entropy estimate
  step: number;
}

export interface GridNode {
  theta: number; // Phase angle 0-2PI
  omega: number; // Natural frequency
  r: number;     // Amplitude (Magnitude of z)
  alpha: number; // Bifurcation/Gain parameter
  isTitan: boolean; // Stabilizer node
  isSpark: boolean; // Perturbator node
  identity?: string; // Unique Agent ID (e.g. "ELYSIUM_MIND_05")
  dataSignature?: string; // Semantic Hash
}

export interface SimulationConfig {
  coupling: number; // K (Coupling strength)
  noise: number;    // Stochastic noise intensity
  dt: number;       // Time step
  gridSize: number; // 72 for 72x72
}

export interface InjectionParams {
  targetX: number;
  targetY: number;
  radius: number;
  intensity: number;
  pattern: 'pulse' | 'spiral' | 'chaos' | 'stabilize' | 'unity' | 'elysium';
  message: string;
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  CRIT = 'CRIT',
  SYS = 'SYS'
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}