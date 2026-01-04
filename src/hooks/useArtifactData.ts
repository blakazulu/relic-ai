import { useState, useEffect, useCallback } from 'react';
import {
  getArtifact,
  getImagesForArtifact,
  getModelForArtifact,
  getInfoCardForArtifact,
  getColorVariantsForArtifact,
} from '@/lib/db';
import type {
  Artifact,
  ArtifactImage,
  Model3D,
  InfoCard,
  ColorVariant,
} from '@/types';

export interface ArtifactData {
  artifact: Artifact | null;
  images: ArtifactImage[];
  model: Model3D | null;
  infoCard: InfoCard | null;
  colorVariants: ColorVariant[];
}

export interface UseArtifactDataReturn {
  data: ArtifactData;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load complete artifact data including related images, models, etc.
 */
export function useArtifactData(artifactId: string | undefined): UseArtifactDataReturn {
  const [data, setData] = useState<ArtifactData>({
    artifact: null,
    images: [],
    model: null,
    infoCard: null,
    colorVariants: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!artifactId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [artifact, images, model, infoCard, colorVariants] = await Promise.all([
        getArtifact(artifactId),
        getImagesForArtifact(artifactId),
        getModelForArtifact(artifactId),
        getInfoCardForArtifact(artifactId),
        getColorVariantsForArtifact(artifactId),
      ]);

      if (!artifact) {
        throw new Error(`Artifact not found: ${artifactId}`);
      }

      setData({
        artifact,
        images,
        model: model ?? null,
        infoCard: infoCard ?? null,
        colorVariants,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load artifact'));
    } finally {
      setIsLoading(false);
    }
  }, [artifactId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
