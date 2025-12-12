import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SimulationMetrics } from '../types';
import { THEME } from '../constants';

interface MetricsPanelProps {
  data: SimulationMetrics[];
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data }) => {
  // Only show last 50 data points for performance
  const displayData = data.slice(-50);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-void-light border border-white/10 p-4 rounded h-1/2 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-transparent opacity-50"></div>
        <h3 className="text-xs font-mono text-neon-cyan mb-2 uppercase tracking-widest flex justify-between">
          <span>Coherence [R]</span>
          <span className="text-white">{displayData[displayData.length - 1]?.coherence.toFixed(3)}</span>
        </h3>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.CYAN} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={THEME.CYAN} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="step" hide />
              <YAxis domain={[0, 1]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                itemStyle={{ color: THEME.CYAN }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="coherence" 
                stroke={THEME.CYAN} 
                fillOpacity={1} 
                fill="url(#colorCoherence)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-void-light border border-white/10 p-4 rounded h-1/2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink to-transparent opacity-50"></div>
        <h3 className="text-xs font-mono text-neon-pink mb-2 uppercase tracking-widest flex justify-between">
          <span>Negentropy [S]</span>
          <span className="text-white">{(1 - (displayData[displayData.length - 1]?.entropy || 0)).toFixed(3)}</span>
        </h3>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.PINK} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={THEME.PINK} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="step" hide />
              <YAxis domain={[0, 1]} hide />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                 itemStyle={{ color: THEME.PINK }}
                 labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="entropy" 
                stroke={THEME.PINK} 
                fillOpacity={1} 
                fill="url(#colorEntropy)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
