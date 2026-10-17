import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export const KeyboardShortcutsDialog: React.FC = () => {
  const { isShortcutsOpen, setShortcutsOpen } = useEditorStore();

  const shortcuts = [
    { category: 'Tools', items: [
      { key: 'V', desc: 'Move Tool' },
      { key: 'M / Shift+M', desc: 'Rectangular / Elliptical Selection' },
      { key: 'B', desc: 'Brush Tool' },
      { key: 'P', desc: 'Pencil Tool' },
      { key: 'E', desc: 'Eraser Tool' },
      { key: 'C', desc: 'Crop Tool' },
      { key: 'T', desc: 'Text Tool' },
      { key: 'U / Shift+U / L', desc: 'Rectangle / Ellipse / Line Shapes' },
      { key: 'I', desc: 'Eyedropper' },
      { key: 'Z', desc: 'Zoom Tool (Hold Alt to Zoom Out)' },
      { key: 'H / Space + Drag', desc: 'Hand (Pan Canvas)' },
      { key: 'X', desc: 'Swap Foreground/Background Colors' },
      { key: 'D', desc: 'Reset to Default Black/White Colors' },
    ]},
    { category: 'Commands', items: [
      { key: 'Ctrl + Z', desc: 'Undo' },
      { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: 'Redo' },
      { key: 'Ctrl + S', desc: 'Save Project (.pixels)' },
      { key: 'Ctrl + Shift + E', desc: 'Export Image' },
      { key: 'Ctrl + A', desc: 'Select All' },
      { key: 'Ctrl + D', desc: 'Deselect' },
      { key: 'Ctrl + Shift + I', desc: 'Invert Selection' },
      { key: 'Ctrl + Shift + N', desc: 'New Layer' },
      { key: 'Ctrl + J', desc: 'Duplicate Layer' },
      { key: 'Ctrl + E', desc: 'Merge Down' },
      { key: 'Delete', desc: 'Clear Selection Contents / Delete Layer' },
      { key: 'Ctrl + + / -', desc: 'Zoom In / Out' },
      { key: 'Ctrl + 0', desc: 'Fit to Screen' },
      { key: 'Ctrl + 1', desc: '100% Actual Size' },
    ]},
  ];

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
      title="Keyboard Shortcuts"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {shortcuts.map((group) => (
          <div key={group.category} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-editor-accent uppercase tracking-wider">
              {group.category}
            </span>
            <div className="flex flex-col divide-y divide-[#2a2a34] bg-[#1a1a20] rounded border border-[#30303c] overflow-hidden">
              {group.items.map((s) => (
                <div key={s.key} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-editor-text">{s.desc}</span>
                  <kbd className="px-2 py-0.5 bg-[#252530] text-editor-dim border border-[#383848] rounded font-mono text-[10px]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={() => setShortcutsOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
