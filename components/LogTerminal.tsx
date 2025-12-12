import React, { useEffect, useRef } from 'react';
import { SystemLog, LogLevel } from '../types';

interface LogTerminalProps {
  logs: SystemLog[];
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return 'text-neon-cyan';
      case LogLevel.WARN: return 'text-neon-gold';
      case LogLevel.CRIT: return 'text-red-500';
      case LogLevel.SYS: return 'text-terminal-green';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black border border-white/10 p-4 h-full flex flex-col font-mono text-xs overflow-hidden rounded">
       <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
         <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse"></div>
         <span className="text-gray-500">SYSTEM LOG // Ω-SHEM KERNEL</span>
       </div>
       <div className="flex-1 overflow-y-auto space-y-1 pr-2">
         {logs.map((log) => (
           <div key={log.id} className="flex gap-3">
             <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
             <span className={`${getLevelColor(log.level)} font-bold shrink-0 w-10`}>{log.level}</span>
             <span className="text-gray-300 break-words">{log.message}</span>
           </div>
         ))}
         <div ref={bottomRef} />
       </div>
    </div>
  );
};

export default LogTerminal;
