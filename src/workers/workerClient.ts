import { executeFilter, FilterParams } from '@/filters/FilterRegistry';
import { SelectionRegion } from '@/types';

class WorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (data: ImageData) => void;
      reject: (err: Error) => void;
    }
  >();
  private requestCounter = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./imageProcessing.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (e: MessageEvent) => {
          const { id, success, imageData, error } = e.data;
          const req = this.pendingRequests.get(id);
          if (!req) return;
          this.pendingRequests.delete(id);

          if (success) {
            req.resolve(imageData);
          } else {
            req.reject(new Error(error || 'Worker processing failed'));
          }
        };

        this.worker.onerror = (e) => {
          console.warn('Worker error, fallback to synchronous mode:', e);
          this.terminate();
        };
      } catch (err) {
        console.warn('Could not initialize image processing worker, using main thread:', err);
        this.worker = null;
      }
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.forEach((req) => {
      req.reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();
  }

  public async processImage(
    imageData: ImageData,
    params: FilterParams,
    selection?: SelectionRegion | null
  ): Promise<ImageData> {
    // If worker not available, run directly on main thread
    if (!this.worker) {
      return executeFilter(imageData, params, selection);
    }

    const id = `req_${++this.requestCounter}_${Date.now()}`;

    return new Promise<ImageData>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      try {
        // Send to worker
        this.worker!.postMessage(
          { id, imageData, params, selection },
          [imageData.data.buffer]
        );
      } catch (err) {
        // Transfer failed, fallback to main thread
        this.pendingRequests.delete(id);
        resolve(executeFilter(imageData, params, selection));
      }
    });
  }
}

export const workerClient = new WorkerClient();
