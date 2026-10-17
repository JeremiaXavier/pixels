import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ProjectMetadata, PixelsDocument } from '@/types';
import { ProjectSerializer } from '@/document/ProjectSerializer';
import { Compositor } from '@/canvas/Compositor';

interface PixelsDB extends DBSchema {
  autosave: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      updatedAt: number;
      thumbnailUrl?: string;
    };
  };
  recentProjects: {
    key: string;
    value: ProjectMetadata;
    indexes: { 'by-date': number };
  };
  savedProjects: {
    key: string;
    value: {
      id: string;
      name: string;
      blob: Blob;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'pixels_editor_db';
const DB_VERSION = 1;

class StorageService {
  private dbPromise: Promise<IDBPDatabase<PixelsDB>> | null = null;

  private getDB(): Promise<IDBPDatabase<PixelsDB>> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }
    if (!this.dbPromise) {
      this.dbPromise = openDB<PixelsDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('autosave')) {
            db.createObjectStore('autosave', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('recentProjects')) {
            const store = db.createObjectStore('recentProjects', { keyPath: 'id' });
            store.createIndex('by-date', 'updatedAt');
          }
          if (!db.objectStoreNames.contains('savedProjects')) {
            db.createObjectStore('savedProjects', { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Generate low-res thumbnail data URL for fast previews in recent projects
   */
  public generateThumbnail(doc: PixelsDocument): string {
    const canvas = document.createElement('canvas');
    const maxDim = 160;
    const scale = Math.min(maxDim / doc.width, maxDim / doc.height);
    canvas.width = Math.max(1, Math.round(doc.width * scale));
    canvas.height = Math.max(1, Math.round(doc.height * scale));

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const fullCanvas = Compositor.compositeToCanvas(doc);
      ctx.drawImage(fullCanvas, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * Autosave current document to IndexedDB
   */
  public async autosaveProject(doc: PixelsDocument): Promise<void> {
    try {
      const db = await this.getDB();
      const blob = await ProjectSerializer.exportProjectBlob(doc);
      const thumbnailUrl = this.generateThumbnail(doc);

      await db.put('autosave', {
        id: 'current_session',
        blob,
        updatedAt: Date.now(),
        thumbnailUrl,
      });

      // Update recent project entry
      const meta: ProjectMetadata = {
        id: doc.id,
        name: doc.name,
        width: doc.width,
        height: doc.height,
        layerCount: doc.layers.length,
        updatedAt: Date.now(),
        thumbnailUrl,
      };
      await db.put('recentProjects', meta);
    } catch (err) {
      console.warn('Autosave failed:', err);
      throw err;
    }
  }

  /**
   * Load autosaved document from previous session
   */
  public async loadAutosave(): Promise<PixelsDocument | null> {
    try {
      const db = await this.getDB();
      const saved = await db.get('autosave', 'current_session');
      if (!saved || !saved.blob) return null;
      return await ProjectSerializer.importProjectBlob(saved.blob);
    } catch (err) {
      console.warn('Failed to recover autosave:', err);
      return null;
    }
  }

  /**
   * Get all recent projects sorted by update time descending
   */
  public async getRecentProjects(): Promise<ProjectMetadata[]> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return [];
    }
    try {
      const db = await this.getDB();
      const list = await db.getAllFromIndex('recentProjects', 'by-date');
      return list.reverse();
    } catch {
      return [];
    }
  }

  /**
   * Remove a project from recent list
   */
  public async removeRecentProject(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('recentProjects', id);
  }

  /**
   * Clear all local storage data
   */
  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    await db.clear('autosave');
    await db.clear('recentProjects');
    await db.clear('savedProjects');
  }
}

export const indexedDBStorage = new StorageService();
