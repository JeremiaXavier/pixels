import React, { useEffect, useState } from 'react';
import { historyManager } from '@/history/HistoryManager';
import { HistoryCommand } from '@/types/history';
import { History as HistoryIcon, RotateCcw } from 'lucide-react';

export const HistoryPanel: React.FC = () => {
  const [commands, setCommands] = useState<ReadonlyArray<HistoryCommand>>(
    historyManager.getCommands()
  );
  const [currentIndex, setCurrentIndex] = useState(historyManager.getCurrentIndex());

  useEffect(() => {
    return historyManager.subscribe(() => {
      setCommands(historyManager.getCommands());
      setCurrentIndex(historyManager.getCurrentIndex());
    });
  }, []);

  const handleJump = (index: number) => {
    historyManager.jumpToIndex(index);
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-editor-text select-none text-xs">
      <div className="p-2.5 bg-[#202026] border-b border-[#2d2d34] flex items-center justify-between">
        <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider flex items-center gap-1.5">
          <HistoryIcon size={13} />
          <span>History Stack</span>
        </span>
        <span className="text-[10px] text-editor-dim font-mono">
          {currentIndex + 1} / {commands.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
        {/* Base document initial state */}
        <button
          onClick={() => handleJump(-1)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors text-xs ${
            currentIndex === -1
              ? 'bg-[#2b2b36] border border-editor-accent text-white font-medium'
              : 'hover:bg-[#25252e] text-editor-muted'
          }`}
        >
          <RotateCcw size={12} className="text-editor-dim shrink-0" />
          <span className="truncate">Open Document</span>
        </button>

        {/* Recorded command stack */}
        {commands.map((cmd, idx) => {
          const isActive = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <button
              key={cmd.id}
              onClick={() => handleJump(idx)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors text-xs ${
                isActive
                  ? 'bg-[#2b2b36] border border-editor-accent text-white font-medium shadow-xs'
                  : isFuture
                  ? 'opacity-40 hover:opacity-75 text-editor-dim hover:bg-[#25252e]'
                  : 'hover:bg-[#25252e] text-editor-text'
              }`}
            >
              <span className="truncate flex-1">{cmd.description}</span>
              <span className="text-[10px] font-mono text-editor-dim ml-2 shrink-0">
                #{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
