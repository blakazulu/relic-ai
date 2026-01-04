import { generateId } from '@/lib/utils';

export interface QueuedOperation {
  id: string;
  type: 'reconstruct3d' | 'generateInfoCard' | 'colorize';
  payload: unknown;
  createdAt: Date;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'archaeology-offline-queue';
const MAX_RETRIES = 3;

/**
 * Get queued operations from localStorage
 */
export function getQueuedOperations(): QueuedOperation[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return [];

    const operations = JSON.parse(stored) as QueuedOperation[];
    return operations.map((op) => ({
      ...op,
      createdAt: new Date(op.createdAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save queued operations to localStorage
 */
function saveQueuedOperations(operations: QueuedOperation[]): void {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(operations));
}

/**
 * Queue an operation for later processing
 */
export function queueOperation(
  operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount'>
): string {
  const newOperation: QueuedOperation = {
    ...operation,
    id: generateId(),
    createdAt: new Date(),
    retryCount: 0,
  };

  const operations = getQueuedOperations();
  operations.push(newOperation);
  saveQueuedOperations(operations);

  return newOperation.id;
}

/**
 * Remove an operation from the queue
 */
export function removeFromQueue(id: string): void {
  const operations = getQueuedOperations();
  const filtered = operations.filter((op) => op.id !== id);
  saveQueuedOperations(filtered);
}

/**
 * Clear all queued operations
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Update retry count for an operation
 */
export function incrementRetryCount(id: string): void {
  const operations = getQueuedOperations();
  const updated = operations.map((op) =>
    op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
  );
  saveQueuedOperations(updated);
}

export interface ProcessQueueResult {
  processed: number;
  failed: number;
  remaining: number;
}

/**
 * Process all queued operations
 * Imports API client dynamically to avoid circular dependencies
 */
export async function processQueue(): Promise<ProcessQueueResult> {
  const { reconstruct3D, generateInfoCard, colorize } = await import('./client');

  const operations = getQueuedOperations();
  const result: ProcessQueueResult = {
    processed: 0,
    failed: 0,
    remaining: 0,
  };

  for (const operation of operations) {
    if (operation.retryCount >= MAX_RETRIES) {
      // Too many retries, remove from queue
      removeFromQueue(operation.id);
      result.failed++;
      continue;
    }

    try {
      switch (operation.type) {
        case 'reconstruct3d':
          await reconstruct3D(operation.payload as Parameters<typeof reconstruct3D>[0]);
          break;
        case 'generateInfoCard':
          await generateInfoCard(operation.payload as Parameters<typeof generateInfoCard>[0]);
          break;
        case 'colorize':
          await colorize(operation.payload as Parameters<typeof colorize>[0]);
          break;
      }

      removeFromQueue(operation.id);
      result.processed++;
    } catch (error) {
      console.error(`Failed to process queued operation ${operation.id}:`, error);
      incrementRetryCount(operation.id);
      result.remaining++;
    }
  }

  return result;
}
