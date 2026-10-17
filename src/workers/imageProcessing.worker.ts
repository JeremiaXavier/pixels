import { executeFilter, FilterParams } from '@/filters/FilterRegistry';
import { SelectionRegion } from '@/types';

interface WorkerRequest {
  id: string;
  imageData: ImageData;
  params: FilterParams;
  selection?: SelectionRegion | null;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, imageData, params, selection } = event.data;
  try {
    const result = executeFilter(imageData, params, selection);
    self.postMessage({ id, success: true, imageData: result });
  } catch (err: unknown) {
    self.postMessage({ id, success: false, error: err instanceof Error ? err.message : String(err) });
  }
};
