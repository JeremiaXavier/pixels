import { describe, it, expect } from 'vitest';
import { ProjectSerializer } from '@/document/ProjectSerializer';
import { DocumentManager } from '@/document/Document';
import { LayerFactory } from '@/document/Layer';

describe('ProjectSerializer', () => {
  it('exports document to a valid .pixels zip blob', async () => {
    let doc = DocumentManager.createDocument('Project Test', 640, 480);
    const textLayer = LayerFactory.createTextLayer('Hello Pixels', 20, 30);
    doc = { ...doc, layers: [...doc.layers, textLayer] };

    const blob = await ProjectSerializer.exportProjectBlob(doc);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/x-pixels');
  });

  it('rejects invalid or non-zip project files gracefully', async () => {
    const invalidBlob = new Blob(['not a valid zip file'], { type: 'text/plain' });
    await expect(ProjectSerializer.importProjectBlob(invalidBlob)).rejects.toThrow(
      /Invalid project file/
    );
  });
});
