import React, { useRef, useEffect } from 'react';
import { GridNode } from '../types';
import { GRID_SIZE } from '../constants';

interface SimulationCanvasProps {
  grid: GridNode[];
  width: number;
  height: number;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ grid, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    const cellSize = width / GRID_SIZE;

    for (let i = 0; i < grid.length; i++) {
      const node = grid[i];
      const x = (i % GRID_SIZE) * cellSize;
      const y = Math.floor(i / GRID_SIZE) * cellSize;

      const degrees = (node.theta * 180) / Math.PI;
      
      let saturation = '80%';
      let lightnessValue = 50;

      // Amplitude (r) modulates lightness. 
      // r typically oscillates around 0.707. 
      // If r -> 0, cell goes dark (death). If r > 1.0, cell glows white.
      // Base lightness 50% * (r / TARGET_AMP)
      
      const normalizedAmp = Math.min(Math.max(node.r / 0.7071, 0), 2);
      lightnessValue = 40 * normalizedAmp; 

      if (node.isTitan) {
        lightnessValue = 80;
        saturation = '100%';
      } else if (node.isSpark) {
        saturation = '100%'; 
        lightnessValue = 60 * normalizedAmp;
      }
      
      // Clamp lightness
      lightnessValue = Math.min(Math.max(lightnessValue, 5), 95);

      ctx.fillStyle = `hsl(${degrees}, ${saturation}, ${lightnessValue}%)`;
      ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
    }
  }, [grid, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="border border-white/10 rounded shadow-[0_0_30px_rgba(0,243,255,0.1)]"
    />
  );
};

export default SimulationCanvas;