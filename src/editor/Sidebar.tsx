import React from 'react';
import { Layers, Sliders, Settings2, History } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { AdjustmentsPanel } from './AdjustmentsPanel';
import { HistoryPanel } from './HistoryPanel';

export const Sidebar: React.FC = () => {
  const { activePanelTab, setActivePanelTab } = useEditorStore();

  const tabs = [
    { id: 'layers', label: 'Layers', icon: <Layers size={13} /> },
    { id: 'properties', label: 'Properties', icon: <Settings2 size={13} /> },
    { id: 'adjustments', label: 'Adjustments', icon: <Sliders size={13} /> },
    { id: 'history', label: 'History', icon: <History size={13} /> },
  ] as const;

  return (
    <aside className="w-64 sm:w-72 bg-editor-panel border-l border-editor-border flex flex-col select-none z-20 shrink-0">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-[#2d2d34] bg-[#1a1a20]">
        {tabs.map((tab) => {
          const isActive = activePanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanelTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-editor-accent text-white bg-[#22222a]'
                  : 'border-transparent text-editor-muted hover:text-white hover:bg-[#202026]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activePanelTab === 'layers' && <LayersPanel />}
        {activePanelTab === 'properties' && <PropertiesPanel />}
        {activePanelTab === 'adjustments' && <AdjustmentsPanel />}
        {activePanelTab === 'history' && <HistoryPanel />}
      </div>
    </aside>
  );
};
