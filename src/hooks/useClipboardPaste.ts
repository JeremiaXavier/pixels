import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { DocumentManager } from '@/document/Document';
import { LayerFactory } from '@/document/Layer';

export function useClipboardPaste() {
  const { document, openDocument, addLayer } = useDocumentStore();

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            if (!document) {
              // Open as new document
              const newDoc = DocumentManager.createFromImage(img, 'Pasted Image');
              openDocument(newDoc);
            } else {
              // Add as a new layer in current document
              const layer = LayerFactory.createRasterLayerFromImage(
                img,
                'Pasted Layer',
                document.width,
                document.height
              );
              addLayer(layer);
            }
            URL.revokeObjectURL(url);
          };
          img.src = url;
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [document, openDocument, addLayer]);
}
