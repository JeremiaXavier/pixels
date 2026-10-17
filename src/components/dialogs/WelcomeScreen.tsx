import React, { useEffect, useState, useRef } from 'react';
import {
  FilePlus,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Clock,
  Trash2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { indexedDBStorage } from '@/storage/IndexedDBStorage';
import { ProjectMetadata } from '@/types';
import { DocumentManager } from '@/document/Document';
import { ProjectSerializer } from '@/document/ProjectSerializer';
import { Button } from '@/components/ui/Button';

export const WelcomeScreen: React.FC = () => {
  const { createNewDocument, openDocument } = useDocumentStore();
  const { setNewDocOpen } = useEditorStore();

  const [recentProjects, setRecentProjects] = useState<ProjectMetadata[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const loadRecents = async () => {
    try {
      const recents = await indexedDBStorage.getRecentProjects();
      setRecentProjects(recents);
    } catch (err) {
      console.warn('Could not load recent projects:', err);
    }
  };

  useEffect(() => {
    loadRecents();
  }, []);

  const handleOpenImage = (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const doc = DocumentManager.createFromImage(img, file.name);
      openDocument(doc);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleOpenProject = async (file: File) => {
    try {
      const doc = await ProjectSerializer.importProjectBlob(file);
      openDocument(doc);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open project file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.name.endsWith('.pixels')) {
      handleOpenProject(file);
    } else if (file.type.startsWith('image/')) {
      handleOpenImage(file);
    }
  };

  const handleRemoveRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await indexedDBStorage.removeRecentProject(id);
    loadRecents();
  };

  const handleCreateSample = (type: 'photo' | 'square' | 'banner') => {
    if (type === 'photo') {
      createNewDocument('Landscape Photo', 1920, 1080, '#1a1a24');
    } else if (type === 'square') {
      createNewDocument('Social Post', 1080, 1080, '#241a24');
    } else {
      createNewDocument('Header Banner', 1200, 630, '#1a2420');
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col items-center justify-center p-6 bg-[#16161a] overflow-y-auto select-none transition-colors ${
        isDragging ? 'bg-[#1e2235] ring-2 ring-editor-accent ring-inset' : ''
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleOpenImage(e.target.files[0])}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={projectInputRef}
        onChange={(e) => e.target.files?.[0] && handleOpenProject(e.target.files[0])}
        accept=".pixels,application/zip"
        className="hidden"
      />

      <div className="max-w-3xl w-full flex flex-col gap-8">
        {/* Header Hero */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-editor-accent flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
            Px
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pixels</h1>
          <p className="text-sm text-editor-muted max-w-md">
            Professional browser-based image editor with layers, drawing tools, filters, and local project persistence.
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40">
            <ShieldCheck size={13} />
            <span>100% Client-Side. No images ever leave your browser.</span>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setNewDocOpen(true)}
            className="flex flex-col items-center p-5 rounded-lg bg-[#202026] hover:bg-[#282832] border border-[#30303c] hover:border-editor-accent transition-all group shadow-sm text-center"
          >
            <div className="w-10 h-10 rounded-full bg-editor-accent/15 flex items-center justify-center text-editor-accent group-hover:scale-110 transition-transform mb-3">
              <FilePlus size={20} />
            </div>
            <span className="font-semibold text-sm text-white mb-1">Create New</span>
            <span className="text-xs text-editor-muted">Custom dimensions & presets</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center p-5 rounded-lg bg-[#202026] hover:bg-[#282832] border border-[#30303c] hover:border-editor-accent transition-all group shadow-sm text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-3">
              <ImageIcon size={20} />
            </div>
            <span className="font-semibold text-sm text-white mb-1">Open Image</span>
            <span className="text-xs text-editor-muted">PNG, JPG, or WebP</span>
          </button>

          <button
            onClick={() => projectInputRef.current?.click()}
            className="flex flex-col items-center p-5 rounded-lg bg-[#202026] hover:bg-[#282832] border border-[#30303c] hover:border-editor-accent transition-all group shadow-sm text-center"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-3">
              <FolderOpen size={20} />
            </div>
            <span className="font-semibold text-sm text-white mb-1">Open Project</span>
            <span className="text-xs text-editor-muted">Reopen a .pixels project</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div className="p-6 rounded-lg border-2 border-dashed border-[#343440] hover:border-editor-accent flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <Upload size={22} className="text-editor-muted" />
          <span className="text-xs text-editor-text font-medium">
            Drag & drop an image or .pixels file here to begin
          </span>
          <span className="text-[11px] text-editor-dim">Supports drag from desktop or clipboard paste</span>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-editor-dim">
            Quick Start Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleCreateSample('photo')}
              className="p-3 rounded bg-[#1e1e24] hover:bg-[#25252e] border border-[#2d2d36] text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-xs font-medium text-white">Full HD Landscape</span>
                <span className="text-[11px] text-editor-dim font-mono">1920 × 1080 px</span>
              </div>
              <Sparkles size={14} className="text-editor-dim" />
            </button>

            <button
              onClick={() => handleCreateSample('square')}
              className="p-3 rounded bg-[#1e1e24] hover:bg-[#25252e] border border-[#2d2d36] text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-xs font-medium text-white">Square Graphic</span>
                <span className="text-[11px] text-editor-dim font-mono">1080 × 1080 px</span>
              </div>
              <Sparkles size={14} className="text-editor-dim" />
            </button>

            <button
              onClick={() => handleCreateSample('banner')}
              className="p-3 rounded bg-[#1e1e24] hover:bg-[#25252e] border border-[#2d2d36] text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="block text-xs font-medium text-white">Social Banner</span>
                <span className="text-[11px] text-editor-dim font-mono">1200 × 630 px</span>
              </div>
              <Sparkles size={14} className="text-editor-dim" />
            </button>
          </div>
        </div>

        {/* Recent Projects (if any) */}
        {recentProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-editor-dim flex items-center gap-1.5">
                <Clock size={13} />
                <span>Recent Projects</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentProjects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  onClick={async () => {
                    const recovered = await indexedDBStorage.loadAutosave();
                    if (recovered) openDocument(recovered);
                  }}
                  className="group relative p-2.5 rounded-lg bg-[#1e1e24] hover:bg-[#262630] border border-[#2d2d36] hover:border-editor-accent cursor-pointer transition-all flex flex-col gap-2"
                >
                  <div className="aspect-video w-full rounded bg-[#141418] border border-[#282832] overflow-hidden flex items-center justify-center">
                    {proj.thumbnailUrl ? (
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers size={18} className="text-editor-dim" />
                    )}
                  </div>
                  <div className="flex items-center justify-between min-w-0">
                    <span className="truncate text-xs font-medium text-white group-hover:text-editor-accent">
                      {proj.name}
                    </span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      title="Remove from recents"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <span className="text-[10px] text-editor-dim font-mono">
                    {proj.width} × {proj.height} px
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
