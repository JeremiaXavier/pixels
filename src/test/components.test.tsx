import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeScreen } from '@/components/dialogs/WelcomeScreen';
import { EditorHeader } from '@/editor/EditorHeader';
import { Toolbar } from '@/editor/Toolbar';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';

describe('UI Component Tests', () => {
  beforeEach(() => {
    useDocumentStore.setState({ document: null });
    useEditorStore.setState({ activeTool: 'brush' });
  });

  it('renders WelcomeScreen with primary creation actions', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Create New')).toBeInTheDocument();
    expect(screen.getByText('Open Image')).toBeInTheDocument();
    expect(screen.getByText('Open Project')).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side/i)).toBeInTheDocument();
  });

  it('renders EditorHeader when document is open and reflects document name', () => {
    useDocumentStore.getState().createNewDocument('Landscape 2026', 1920, 1080);
    render(<EditorHeader />);

    expect(screen.getByText('Landscape 2026')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByTitle(/Undo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Redo/i)).toBeInTheDocument();
  });

  it('allows selecting tools in Toolbar', () => {
    render(<Toolbar />);
    const eraserBtn = screen.getByLabelText('Eraser Tool');
    expect(eraserBtn).toBeInTheDocument();

    fireEvent.click(eraserBtn);
    expect(useEditorStore.getState().activeTool).toBe('eraser');
  });

  it('creates sample document from WelcomeScreen preset button', () => {
    render(<WelcomeScreen />);
    const squarePreset = screen.getByText('Square Graphic');
    fireEvent.click(squarePreset);

    const doc = useDocumentStore.getState().document;
    expect(doc).not.toBeNull();
    expect(doc?.width).toBe(1080);
    expect(doc?.height).toBe(1080);
    expect(doc?.name).toBe('Social Post');
  });
});
