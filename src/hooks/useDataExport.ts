import { useState, useCallback } from 'react';
import { getArtifact, getImagesForArtifact, getModelForArtifact, getInfoCardForArtifact, getColorVariantsForArtifact, getAllArtifacts } from '@/lib/db';
import { blobToBase64, downloadFile } from '@/lib/utils';

export interface UseDataExportReturn {
  exportArtifact: (id: string) => Promise<void>;
  exportAllArtifacts: () => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
}

interface ExportedArtifact {
  artifact: unknown;
  images: Array<{ data: string; angle: string; width: number; height: number }>;
  model?: { data: string; format: string; source: string };
  infoCard?: unknown;
  colorVariants?: Array<{ data: string; colorScheme: string }>;
}

interface ExportData {
  version: string;
  exportedAt: string;
  artifacts: ExportedArtifact[];
}

/**
 * Hook for exporting artifact data
 */
export function useDataExport(): UseDataExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportSingleArtifact = useCallback(async (id: string): Promise<ExportedArtifact | null> => {
    const artifact = await getArtifact(id);
    if (!artifact) return null;

    // Get all related data in parallel
    const [images, model, infoCard, colorVariants] = await Promise.all([
      getImagesForArtifact(id),
      getModelForArtifact(id),
      getInfoCardForArtifact(id),
      getColorVariantsForArtifact(id),
    ]);

    // Convert blobs to base64
    const exportedImages = await Promise.all(
      images.map(async (img) => ({
        data: await blobToBase64(img.blob),
        angle: img.angle,
        width: img.width,
        height: img.height,
      }))
    );

    let exportedModel;
    if (model) {
      exportedModel = {
        data: await blobToBase64(model.blob),
        format: model.format,
        source: model.source,
      };
    }

    const exportedVariants = await Promise.all(
      colorVariants.map(async (variant) => ({
        data: await blobToBase64(variant.blob),
        colorScheme: variant.colorScheme,
      }))
    );

    // Remove blob fields from artifact
    const { thumbnailBlob, ...artifactData } = artifact;
    let thumbnailBase64;
    if (thumbnailBlob) {
      thumbnailBase64 = await blobToBase64(thumbnailBlob);
    }

    return {
      artifact: { ...artifactData, thumbnailBase64 },
      images: exportedImages,
      model: exportedModel,
      infoCard: infoCard || undefined,
      colorVariants: exportedVariants.length > 0 ? exportedVariants : undefined,
    };
  }, []);

  const exportArtifact = useCallback(async (id: string) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(20);
      const exported = await exportSingleArtifact(id);
      if (!exported) {
        throw new Error('Artifact not found');
      }

      setExportProgress(80);

      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        artifacts: [exported],
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `artifact-${id}-${new Date().toISOString().split('T')[0]}.json`;

      downloadFile(blob, filename);
      setExportProgress(100);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportSingleArtifact]);

  const exportAllArtifacts = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const artifacts = await getAllArtifacts();
      const total = artifacts.length;
      const exportedArtifacts: ExportedArtifact[] = [];

      for (let i = 0; i < artifacts.length; i++) {
        const exported = await exportSingleArtifact(artifacts[i].id);
        if (exported) {
          exportedArtifacts.push(exported);
        }
        setExportProgress(Math.round(((i + 1) / total) * 90));
      }

      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        artifacts: exportedArtifacts,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `all-artifacts-${new Date().toISOString().split('T')[0]}.json`;

      downloadFile(blob, filename);
      setExportProgress(100);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportSingleArtifact]);

  return {
    exportArtifact,
    exportAllArtifacts,
    isExporting,
    exportProgress,
  };
}
