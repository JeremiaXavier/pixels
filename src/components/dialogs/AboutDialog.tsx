import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Layers, Cpu, Sparkles } from 'lucide-react';

export const AboutDialog: React.FC = () => {
  const { isAboutOpen, setAboutOpen } = useEditorStore();

  return (
    <Modal
      isOpen={isAboutOpen}
      onClose={() => setAboutOpen(false)}
      title="About Pixels"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center gap-3 text-xs">
        <div className="w-12 h-12 rounded-xl bg-editor-accent flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
          Px
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Pixels</h2>
          <span className="text-[11px] text-editor-dim font-mono">v1.0.0 — Desktop-Class Web Image Editor</span>
        </div>

        <p className="text-editor-muted text-xs leading-relaxed">
          Pixels is an independent, high-performance browser image editor. Built with React,
          TypeScript, Canvas 2D API, Web Workers, and IndexedDB for pure in-browser creativity.
        </p>

        <div className="w-full flex flex-col gap-2 pt-2 text-left bg-[#1a1a20] p-3 rounded border border-[#2e2e38] text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={14} />
            <span>Zero server uploads — 100% private & client-side</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <Layers size={14} />
            <span>Multi-layer compositing with native blend modes</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <Cpu size={14} />
            <span>Web Worker accelerated filters & pixel math</span>
          </div>
        </div>

        <div className="flex justify-end w-full pt-2">
          <Button variant="secondary" onClick={() => setAboutOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
