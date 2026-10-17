import React, { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { indexedDBStorage } from '@/storage/IndexedDBStorage';
import { EditorHeader } from './EditorHeader';
import { MenuBar } from './MenuBar';
import { Toolbar } from './Toolbar';
import { OptionsBar } from './OptionsBar';
import { CanvasWorkspace } from './CanvasWorkspace';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { WelcomeScreen } from '@/components/dialogs/WelcomeScreen';
import { NewDocumentDialog } from '@/components/dialogs/NewDocumentDialog';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { ImageSizeDialog } from '@/components/dialogs/ImageSizeDialog';
import { CanvasSizeDialog } from '@/components/dialogs/CanvasSizeDialog';
import { FilterDialog } from '@/components/dialogs/FilterDialog';
import { KeyboardShortcutsDialog } from '@/components/dialogs/KeyboardShortcutsDialog';
import { AboutDialog } from '@/components/dialogs/AboutDialog';

export const Editor: React.FC = () => {
  const document = useDocumentStore((state) => state.document);
  const setSaveStatus = useDocumentStore((state) => state.setSaveStatus);

  // Activate hooks
  useKeyboardShortcuts();
  useClipboardPaste();

  // Periodic autosave to IndexedDB if dirty
  useEffect(() => {
    if (!document) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await indexedDBStorage.autosaveProject(document);
        setSaveStatus('saved');
      } catch (err) {
        console.warn('Autosave error:', err);
        setSaveStatus('unsaved');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [document, setSaveStatus]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-editor-bg text-editor-text select-none">
      {/* 1. Top Header */}
      <EditorHeader />

      {/* 2. Menu Bar */}
      <MenuBar />

      {/* 3. Contextual Options Bar */}
      {document && <OptionsBar />}

      {/* 4. Main Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {document ? (
          <>
            {/* Left Toolbar */}
            <Toolbar />

            {/* Central Canvas Workspace */}
            <CanvasWorkspace />

            {/* Right Collapsible Sidebar */}
            <Sidebar />
          </>
        ) : (
          /* Welcome Screen when no document is active */
          <WelcomeScreen />
        )}
      </div>

      {/* 5. Bottom Status Bar */}
      <StatusBar />

      {/* Modals & Dialogs */}
      <NewDocumentDialog />
      <ExportDialog />
      <ImageSizeDialog />
      <CanvasSizeDialog />
      <FilterDialog />
      <KeyboardShortcutsDialog />
      <AboutDialog />
    </div>
  );
};
