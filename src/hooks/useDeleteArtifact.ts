import { useState, useCallback } from 'react';
import { deleteArtifact, getArtifact } from '@/lib/db';

export interface UseDeleteArtifactReturn {
  deleteArtifact: (id: string) => Promise<void>;
  isDeleting: boolean;
  showConfirm: boolean;
  pendingDeleteId: string | null;
  pendingDeleteName: string | null;
  confirmDelete: (id: string) => void;
  cancelDelete: () => void;
  executeDelete: () => Promise<void>;
}

/**
 * Hook for managing artifact deletion with confirmation
 */
export function useDeleteArtifact(onDeleted?: () => void): UseDeleteArtifactReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);

  const confirmDelete = useCallback(async (id: string) => {
    // Fetch artifact name for display
    const artifact = await getArtifact(id);
    setPendingDeleteId(id);
    setPendingDeleteName(artifact?.metadata?.name || 'Unnamed Artifact');
    setShowConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowConfirm(false);
    setPendingDeleteId(null);
    setPendingDeleteName(null);
  }, []);

  const executeDelete = useCallback(async () => {
    if (!pendingDeleteId) return;

    setIsDeleting(true);
    try {
      await deleteArtifact(pendingDeleteId);
      setShowConfirm(false);
      setPendingDeleteId(null);
      setPendingDeleteName(null);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDeleteId, onDeleted]);

  const deleteArtifactDirect = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteArtifact(id);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete artifact:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleted]);

  return {
    deleteArtifact: deleteArtifactDirect,
    isDeleting,
    showConfirm,
    pendingDeleteId,
    pendingDeleteName,
    confirmDelete,
    cancelDelete,
    executeDelete,
  };
}
