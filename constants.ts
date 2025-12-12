export const GRID_SIZE = 72; // 72x72 grid
export const TOTAL_NODES = GRID_SIZE * GRID_SIZE; // 5184
export const DEFAULT_COUPLING = 1.2; // Slightly above critical K_c for coherence
export const DEFAULT_NOISE = 0.1;
export const DT = 0.05; // Reduced DT for stability with amplitude dynamics

// Living System Constants (Plasticity)
export const LAMBDA_PLAST = 0.012; // Frequency plasticity rate
export const GAMMA_PLAST = 0.008;  // Amplitude plasticity rate
export const TARGET_AMP = 0.7071;  // sqrt(0.5)

export const THEME = {
  CYAN: '#00f3ff',
  PINK: '#ff00ff',
  GOLD: '#ffd700',
  GREEN: '#00ff41',
  RED: '#ff3333'
};