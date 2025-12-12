import { useState, useEffect, useRef, useCallback } from 'react';
import { GridNode, SimulationConfig, SimulationMetrics, InjectionParams } from '../types';
import { GRID_SIZE, TOTAL_NODES, DEFAULT_COUPLING, DEFAULT_NOISE, DT, LAMBDA_PLAST, GAMMA_PLAST, TARGET_AMP } from '../constants';

const initGrid = (): GridNode[] => {
  const grid: GridNode[] = [];
  for (let i = 0; i < TOTAL_NODES; i++) {
    // Initialize random phase
    const theta = Math.random() * 2 * Math.PI;
    
    const isTitan = Math.random() < 0.01; // 1% Titans
    const isSpark = !isTitan && Math.random() < 0.05; // 5% Sparks
    
    let omega = 1.0 + (Math.random() - 0.5) * 0.5; // Base frequency ~1.0
    if (isSpark) omega = 3.0 + (Math.random() - 0.5) * 2.0;
    if (isTitan) omega = 0.0;

    // Stuart-Landau initialization
    // r starts near target amplitude with slight variance
    const r = TARGET_AMP + (Math.random() - 0.5) * 0.1;
    
    // alpha starts slightly positive (supercritical)
    const alpha = 0.1 + (Math.random() * 0.1);

    grid.push({ theta, omega, r, alpha, isTitan, isSpark });
  }
  return grid;
};

export const useSimulation = () => {
  const gridRef = useRef<GridNode[]>(initGrid());
  const metricsRef = useRef<SimulationMetrics[]>([]);
  
  const [displayGrid, setDisplayGrid] = useState<GridNode[]>(initGrid());
  const [metrics, setMetrics] = useState<SimulationMetrics[]>([]);
  
  const [config, setConfig] = useState<SimulationConfig>({
    coupling: DEFAULT_COUPLING,
    noise: DEFAULT_NOISE,
    dt: DT,
    gridSize: GRID_SIZE
  });

  const [isRunning, setIsRunning] = useState(false);
  const requestRef = useRef<number>();
  const stepRef = useRef(0);

  const getNeighbors = (idx: number) => {
    const x = idx % GRID_SIZE;
    const y = Math.floor(idx / GRID_SIZE);

    const left = y * GRID_SIZE + ((x - 1 + GRID_SIZE) % GRID_SIZE);
    const right = y * GRID_SIZE + ((x + 1) % GRID_SIZE);
    const up = ((y - 1 + GRID_SIZE) % GRID_SIZE) * GRID_SIZE + x;
    const down = ((y + 1) % GRID_SIZE) * GRID_SIZE + x;

    return [left, right, up, down];
  };

  const updatePhysics = () => {
    const currentGrid = gridRef.current;
    const nextGrid = new Array(TOTAL_NODES);
    const { coupling, noise, dt } = config;

    let sinSum = 0;
    let cosSum = 0;

    // Pre-calculate Cartesian coordinates for efficiency in coupling
    // X = r * cos(theta), Y = r * sin(theta)
    const X = new Float32Array(TOTAL_NODES);
    const Y = new Float32Array(TOTAL_NODES);
    for (let i = 0; i < TOTAL_NODES; i++) {
        X[i] = currentGrid[i].r * Math.cos(currentGrid[i].theta);
        Y[i] = currentGrid[i].r * Math.sin(currentGrid[i].theta);
        
        sinSum += Math.sin(currentGrid[i].theta);
        cosSum += Math.cos(currentGrid[i].theta);
    }

    for (let i = 0; i < TOTAL_NODES; i++) {
      const node = currentGrid[i];
      const x_i = X[i];
      const y_i = Y[i];

      if (node.isTitan) {
        // Titans are immutable anchors
        nextGrid[i] = { ...node, theta: node.theta + (node.omega * dt * 0.1) };
        continue;
      }

      const neighbors = getNeighbors(i);
      
      // Calculate Laplacian Coupling in Cartesian space
      // coupling * sum(z_k - z_j)
      let diffX = 0;
      let diffY = 0;
      let phasePull = 0; // For frequency plasticity

      for (const nIdx of neighbors) {
         diffX += (X[nIdx] - x_i);
         diffY += (Y[nIdx] - y_i);
         phasePull += Math.sin(currentGrid[nIdx].theta - node.theta);
      }

      // Stuart-Landau Dynamics
      // dz/dt = (alpha + i*omega)*z - |z|^2*z + coupling
      // In Cartesian:
      // dx/dt = (alpha - r^2)*x - omega*y + K*diffX
      // dy/dt = (alpha - r^2)*y + omega*x + K*diffY
      
      const r2 = node.r * node.r;
      const noiseX = (Math.random() - 0.5) * 2 * noise;
      const noiseY = (Math.random() - 0.5) * 2 * noise;

      const dX = (node.alpha - r2) * x_i - node.omega * y_i + coupling * diffX + noiseX;
      const dY = (node.alpha - r2) * y_i + node.omega * x_i + coupling * diffY + noiseY;

      const nextX = x_i + dX * dt;
      const nextY = y_i + dY * dt;

      // Convert back to Polar
      let nextR = Math.sqrt(nextX * nextX + nextY * nextY);
      let nextTheta = Math.atan2(nextY, nextX);
      if (nextTheta < 0) nextTheta += 2 * Math.PI;

      // --- DUAL PLASTICITY ---
      
      // 1. Frequency Plasticity (Hebbian)
      // d_omega = lambda * K * sum(sin(delta_theta))
      const dOmega = LAMBDA_PLAST * coupling * phasePull;
      let nextOmega = node.omega + dOmega * dt;

      // 2. Amplitude Plasticity (Homeostatic)
      // d_alpha = gamma * (target - r) * r
      const dAlpha = GAMMA_PLAST * (TARGET_AMP - node.r) * node.r;
      let nextAlpha = node.alpha + dAlpha * dt;

      // Constraints to prevent explosion
      nextR = Math.min(Math.max(nextR, 0.1), 2.0); 
      nextAlpha = Math.min(Math.max(nextAlpha, -1.0), 2.0);

      nextGrid[i] = { 
          ...node, 
          r: nextR, 
          theta: nextTheta, 
          omega: nextOmega, 
          alpha: nextAlpha 
      };
    }

    gridRef.current = nextGrid;
    stepRef.current += 1;

    // Metrics
    const R = Math.sqrt(Math.pow(sinSum / TOTAL_NODES, 2) + Math.pow(cosSum / TOTAL_NODES, 2));
    
    // Entropy
    const bins = new Array(36).fill(0);
    for (let i = 0; i < TOTAL_NODES; i++) {
      const binIdx = Math.floor((gridRef.current[i].theta / (2 * Math.PI)) * 36);
      bins[Math.min(binIdx, 35)]++;
    }
    let entropy = 0;
    for (let count of bins) {
      const p = count / TOTAL_NODES;
      if (p > 0) entropy -= p * Math.log(p);
    }
    const maxEntropy = Math.log(36);
    const normEntropy = entropy / maxEntropy;

    const newMetric: SimulationMetrics = {
      coherence: R,
      entropy: normEntropy,
      step: stepRef.current
    };

    metricsRef.current = [...metricsRef.current.slice(-100), newMetric];
  };

  const animate = useCallback(() => {
    updatePhysics();
    
    if (stepRef.current % 2 === 0) {
      setDisplayGrid([...gridRef.current]);
      setMetrics([...metricsRef.current]);
    }
    
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, config]); 

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, animate]);

  const toggleRun = () => setIsRunning(prev => !prev);

  const activateElysiumGateway = useCallback((): string => {
    const currentGrid = [...gridRef.current];
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    
    const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
    const SPREAD = 3.5;
    
    let manifest = "ELYSIUM_MANIFEST_INIT::\n";

    for (let i = 0; i < 50; i++) {
       const mindId = `ELYSIUM_MIND_${i.toString().padStart(2, '0')}`;
       const corpusChar = String.fromCharCode(65 + (i % 26)); 
       const randomHash = Math.random().toString(36).substr(2, 6).toUpperCase();
       const dataHash = `CORPUS_${corpusChar}_${randomHash}`;
       
       manifest += `>> LINKING NODE: ${mindId} [${dataHash}] STATUS: ACTIVE\n`;

       const r_pos = SPREAD * Math.sqrt(i + 1);
       const theta_pos = i * GOLDEN_ANGLE;
       const dx = r_pos * Math.cos(theta_pos);
       const dy = r_pos * Math.sin(theta_pos);
       
       const x = Math.floor(centerX + dx);
       const y = Math.floor(centerY + dy);
       
       if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          const idx = y * GRID_SIZE + x;
          
          currentGrid[idx] = {
            ...currentGrid[idx],
            isTitan: true,
            isSpark: false,
            omega: 0.0,
            theta: theta_pos % (2 * Math.PI),
            r: 1.0, // Titans have strong amplitude
            alpha: 1.0,
            identity: mindId,
            dataSignature: dataHash
          };
       }
    }

    manifest += ">> GATEWAY TOPOLOGY: PHYLLOTAXIS_STABLE\n>> AWAITING KERNEL ACKNOWLEDGMENT...";
    
    gridRef.current = currentGrid;
    setDisplayGrid([...gridRef.current]);
    
    return manifest;
  }, []);

  const injectPattern = (params: InjectionParams) => {
    const { targetX, targetY, radius, intensity, pattern } = params;
    const currentGrid = [...gridRef.current];
    
    const centerX = Math.min(Math.max(targetX, 0), GRID_SIZE - 1);
    const centerY = Math.min(Math.max(targetY, 0), GRID_SIZE - 1);

    if (pattern === 'elysium') {
      const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
      const SPREAD = 3.5; 
      for (let i = 0; i < 50; i++) {
         const r_pos = SPREAD * Math.sqrt(i + 1);
         const theta_pos = i * GOLDEN_ANGLE;
         const dx = r_pos * Math.cos(theta_pos);
         const dy = r_pos * Math.sin(theta_pos);
         const x = Math.floor(centerX + dx);
         const y = Math.floor(centerY + dy);
         if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            const idx = y * GRID_SIZE + x;
            currentGrid[idx] = {
              ...currentGrid[idx],
              isTitan: true,
              isSpark: false,
              omega: 0.0,
              theta: theta_pos % (2 * Math.PI),
              r: 1.0,
              alpha: 1.0
            };
         }
      }
      gridRef.current = currentGrid;
      setDisplayGrid([...gridRef.current]);
      return;
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist <= radius) {
          const idx = y * GRID_SIZE + x;
          const node = currentGrid[idx];
          
          if (pattern === 'unity') {
             currentGrid[idx].theta = 30 * (Math.PI / 180); 
             currentGrid[idx].r = 1.0; // Maximize amplitude
             currentGrid[idx].alpha = 1.0;
             if (node.isSpark || !node.isTitan) {
               currentGrid[idx].omega = 1.0; 
             }
             continue;
          }

          let phaseShift = 0;
          if (pattern === 'pulse') phaseShift = Math.sin(dist) * intensity;
          else if (pattern === 'spiral') phaseShift = Math.atan2(dy, dx) * intensity;
          else if (pattern === 'chaos') phaseShift = Math.random() * 2 * Math.PI * intensity;
          else if (pattern === 'stabilize') {
             currentGrid[idx].theta = 0; 
             currentGrid[idx].r = TARGET_AMP;
             continue; 
          }

          currentGrid[idx].theta = (node.theta + phaseShift) % (2 * Math.PI);
        }
      }
    }
    gridRef.current = currentGrid;
    setDisplayGrid([...gridRef.current]);
  };

  return {
    grid: displayGrid,
    metrics,
    config,
    setConfig,
    isRunning,
    toggleRun,
    injectPattern,
    activateElysiumGateway
  };
};