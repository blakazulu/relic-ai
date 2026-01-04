import { useState, useCallback } from 'react';
import { createArtifact, addImage, saveModel, saveInfoCard, addColorVariant, getArtifact } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface UseDataImportReturn {
  importData: (file: File, duplicateHandling: 'skip' | 'overwrite') => Promise<ImportResult>;
  isImporting: boolean;
  importProgress: number;
  importError: string | null;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'application/octet-stream'): Blob {
  const byteString = atob(base64.split(',')[1] || base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

/**
 * Hook for importing artifact data
 */
export function useDataImport(): UseDataImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  const importData = useCallback(async (file: File, duplicateHandling: 'skip' | 'overwrite'): Promise<ImportResult> => {
    setIsImporting(true);
    setImportProgress(0);
    setImportError(null);

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate format
      if (!data.version || !data.artifacts || !Array.isArray(data.artifacts)) {
        throw new Error('Invalid export file format');
      }

      const total = data.artifacts.length;

      for (let i = 0; i < data.artifacts.length; i++) {
        const exportedArtifact = data.artifacts[i];
        const artifactData = exportedArtifact.artifact;

        try {
          // Check for duplicates
          const existingArtifact = await getArtifact(artifactData.id);

          if (existingArtifact) {
            if (duplicateHandling === 'skip') {
              result.skipped++;
              setImportProgress(Math.round(((i + 1) / total) * 100));
              continue;
            }
            // For overwrite, we'd delete the existing one first
            // For now, just generate a new ID
          }

          // Generate new ID to avoid conflicts
          const newArtifactId = generateId();

          // Convert thumbnail base64 back to blob
          let thumbnailBlob;
          if (artifactData.thumbnailBase64) {
            thumbnailBlob = base64ToBlob(artifactData.thumbnailBase64, 'image/jpeg');
          }

          // Create artifact with new ID
          const artifact = {
            ...artifactData,
            id: newArtifactId,
            thumbnailBlob,
            createdAt: new Date(artifactData.createdAt),
            updatedAt: new Date(artifactData.updatedAt),
            imageIds: [],
            model3DId: undefined,
            infoCardId: undefined,
            colorVariantIds: [],
          };

          await createArtifact(artifact);

          // Import images
          if (exportedArtifact.images) {
            for (const img of exportedArtifact.images) {
              const imageBlob = base64ToBlob(img.data, 'image/jpeg');
              await addImage({
                id: generateId(),
                artifactId: newArtifactId,
                blob: imageBlob,
                angle: img.angle,
                width: img.width,
                height: img.height,
                createdAt: new Date(),
              });
            }
          }

          // Import model
          if (exportedArtifact.model) {
            const modelBlob = base64ToBlob(exportedArtifact.model.data, 'model/gltf-binary');
            await saveModel({
              id: generateId(),
              artifactId: newArtifactId,
              blob: modelBlob,
              format: exportedArtifact.model.format,
              source: exportedArtifact.model.source,
              createdAt: new Date(),
            });
          }

          // Import info card
          if (exportedArtifact.infoCard) {
            await saveInfoCard({
              ...exportedArtifact.infoCard,
              id: generateId(),
              artifactId: newArtifactId,
              createdAt: new Date(exportedArtifact.infoCard.createdAt),
              updatedAt: new Date(exportedArtifact.infoCard.updatedAt),
            });
          }

          // Import color variants
          if (exportedArtifact.colorVariants) {
            for (const variant of exportedArtifact.colorVariants) {
              const variantBlob = base64ToBlob(variant.data, 'image/jpeg');
              await addColorVariant({
                id: generateId(),
                artifactId: newArtifactId,
                blob: variantBlob,
                colorScheme: variant.colorScheme,
                prompt: '',
                aiModel: 'imported',
                isSpeculative: true,
                createdAt: new Date(),
              });
            }
          }

          result.imported++;
        } catch (artifactError) {
          const errorMessage = artifactError instanceof Error ? artifactError.message : 'Unknown error';
          result.errors.push(`Failed to import artifact ${artifactData.id}: ${errorMessage}`);
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      if (result.errors.length > 0) {
        result.success = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportError(errorMessage);
      result.success = false;
      result.errors.push(errorMessage);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }

    return result;
  }, []);

  return {
    importData,
    isImporting,
    importProgress,
    importError,
  };
}
