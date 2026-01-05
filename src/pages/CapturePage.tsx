import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Upload, Info, Zap, Layers, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CaptureSession, FileUpload } from '@/components/camera';
import { cn } from '@/lib/utils';
import { compressImage, generateId } from '@/lib/utils';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores';
import type { ImageAngle, Artifact } from '@/types';

type CaptureMethod = 'camera' | 'upload' | null;
type ReconstructionMode = 'single' | 'multi';
type CaptureMode = 'reconstruct' | 'colorize';

export function CapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentArtifact, setProcessingStatus } = useAppStore();
  const { t: _t } = useTranslation();
  // Use alias to avoid unused variable warning in reconstruct mode
  const t = _t;

  // Check if we're in colorize mode from URL param
  const captureMode: CaptureMode = searchParams.get('mode') === 'colorize' ? 'colorize' : 'reconstruct';

  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>(null);
  const [reconstructionMode, setReconstructionMode] = useState<ReconstructionMode>('single');

  const handleCaptureComplete = useCallback(async (images: Array<{ blob: Blob; angle: ImageAngle }>) => {
    try {
      const artifactId = generateId();

      const newArtifact: Artifact = {
        id: artifactId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'images-captured',
        imageIds: [],
        colorVariantIds: [],
        metadata: {},
      };

      const imageIds: string[] = [];

      for (const { blob, angle } of images) {
        const compressed = await compressImage(blob, 2, 1920);
        const imageId = generateId();

        await db.images.add({
          id: imageId,
          artifactId,
          blob: compressed,
          angle,
          createdAt: new Date(),
          width: 0,
          height: 0,
        });

        imageIds.push(imageId);
      }

      newArtifact.imageIds = imageIds;

      const thumbnailBlob = await compressImage(images[0].blob, 0.5, 400);
      newArtifact.thumbnailBlob = thumbnailBlob;

      await db.artifacts.add(newArtifact);

      setCurrentArtifact(artifactId);
      setProcessingStatus({
        artifactId,
        step: 'idle',
        progress: 0,
        message: 'Ready to process',
      });

      // Navigate to artifact page - with colors tab if in colorize mode
      if (captureMode === 'colorize') {
        navigate(`/artifact/${artifactId}?tab=colors`);
      } else {
        navigate(`/artifact/${artifactId}`);
      }
    } catch (error) {
      console.error('Failed to save captured images:', error);
    }
  }, [navigate, setCurrentArtifact, setProcessingStatus, captureMode]);

  const handleFileUploadComplete = useCallback(async (files: File[]) => {
    const images: Array<{ blob: Blob; angle: ImageAngle }> = files.map((file, index) => ({
      blob: file,
      angle: index === 0 ? 'front' : ('detail' as ImageAngle),
    }));
    await handleCaptureComplete(images);
  }, [handleCaptureComplete]);

  const handleCancel = useCallback(() => {
    setCaptureMethod(null);
  }, []);

  if (captureMethod === 'camera') {
    return (
      <CaptureSession
        mode={captureMode === 'colorize' ? 'single' : reconstructionMode}
        onComplete={handleCaptureComplete}
        onCancel={handleCancel}
      />
    );
  }

  if (captureMethod === 'upload') {
    return (
      <FileUpload
        onFilesSelected={handleFileUploadComplete}
        onCancel={handleCancel}
        maxFiles={captureMode === 'colorize' ? 1 : (reconstructionMode === 'single' ? 1 : 10)}
      />
    );
  }

  // Colorize Mode UI
  if (captureMode === 'colorize') {
    return (
      <div className="px-4 py-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-desert-teal to-oxidized-bronze mb-4">
            <Palette className="w-8 h-8 text-bone-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-sienna mb-2">
            {t('pages.home.pastPalette')}
          </h2>
          <p className="text-stone-gray">
            {t('components.colorization.subtitle')}
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-xl bg-desert-teal/10 border border-desert-teal/30 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-desert-teal shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-desert-teal">
                {t('pages.capture.forBestColorization')}
              </p>
              <p className="text-stone-gray mt-1">
                {t('pages.capture.colorizationDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Capture Options */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-charcoal">
            {t('pages.capture.addYourPhoto')}
          </h3>

          <button
            className="w-full flex items-center gap-4 rounded-xl bg-desert-teal p-5 text-left text-bone-white shadow-md transition-all hover:bg-oxidized-bronze active:scale-[0.98] rtl:text-right"
            onClick={() => setCaptureMethod('camera')}
          >
            <div className="rounded-full bg-bone-white/20 p-3">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">{t('pages.capture.useCamera')}</h4>
              <p className="text-bone-white/80 text-sm">
                {t('pages.capture.takePhoto')}
              </p>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-4 rounded-xl bg-aged-paper border-2 border-dashed border-desert-sand p-5 text-left transition-all hover:border-desert-teal hover:bg-parchment active:scale-[0.98] rtl:text-right"
            onClick={() => setCaptureMethod('upload')}
          >
            <div className="rounded-full bg-desert-teal/10 p-3">
              <Upload className="h-8 w-8 text-desert-teal" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-charcoal">{t('pages.capture.uploadPhoto')}</h4>
              <p className="text-stone-gray text-sm">
                {t('pages.capture.selectExisting')}
              </p>
            </div>
          </button>
        </div>

        {/* Color Scheme Preview */}
        <div className="mt-8">
          <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
            {t('pages.capture.availableSchemes')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ColorSchemePreview name={t('pages.capture.schemes.roman')} colors={['#8B0000', '#FFD700', '#FFFFFF', '#000080']} />
            <ColorSchemePreview name={t('pages.capture.schemes.greek')} colors={['#1E90FF', '#FFD700', '#FFFFFF', '#8B4513']} />
            <ColorSchemePreview name={t('pages.capture.schemes.egyptian')} colors={['#FFD700', '#00CED1', '#8B4513', '#228B22']} />
            <ColorSchemePreview name={t('pages.capture.schemes.original')} colors={['#C65D3B', '#8B4513', '#D4A574', '#4A7C59']} />
          </div>
        </div>
      </div>
    );
  }

  // Reconstruct Mode UI (default)
  return (
    <div className="px-4 py-6 lg:px-8">
      {/* Info Banner */}
      <div className="mb-6 rounded-xl bg-desert-teal/10 border border-desert-teal/30 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-desert-teal shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-desert-teal">
              {t('pages.capture.forBestResults')}
            </p>
            <p className="text-stone-gray mt-1">
              {t('pages.capture.captureMultipleAngles')}
            </p>
          </div>
        </div>
      </div>

      {/* Reconstruction Mode Selector */}
      <div className="mb-6">
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.capture.reconstructionMode')}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setReconstructionMode('single')}
            className={cn(
              'rounded-xl p-4 text-left rtl:text-right transition-all',
              reconstructionMode === 'single'
                ? 'border-2 border-terracotta bg-terracotta/5'
                : 'border border-desert-sand bg-aged-paper hover:border-clay'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={cn(
                'w-5 h-5',
                reconstructionMode === 'single' ? 'text-terracotta' : 'text-stone-gray'
              )} />
              <h4 className={cn(
                'font-medium',
                reconstructionMode === 'single' ? 'text-terracotta' : 'text-charcoal'
              )}>
                {t('pages.capture.singlePhoto')}
              </h4>
            </div>
            <p className="text-xs text-stone-gray">
              {t('pages.capture.singlePhotoDesc')}
            </p>
          </button>

          <button
            onClick={() => setReconstructionMode('multi')}
            className={cn(
              'rounded-xl p-4 text-left rtl:text-right transition-all',
              reconstructionMode === 'multi'
                ? 'border-2 border-terracotta bg-terracotta/5'
                : 'border border-desert-sand bg-aged-paper hover:border-clay'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Layers className={cn(
                'w-5 h-5',
                reconstructionMode === 'multi' ? 'text-terracotta' : 'text-stone-gray'
              )} />
              <h4 className={cn(
                'font-medium',
                reconstructionMode === 'multi' ? 'text-terracotta' : 'text-charcoal'
              )}>
                {t('pages.capture.multiPhoto')}
              </h4>
            </div>
            <p className="text-xs text-stone-gray">
              {t('pages.capture.multiPhotoDesc')}
            </p>
          </button>
        </div>
      </div>

      {/* Capture Options */}
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-charcoal">
          {t('pages.capture.chooseCaptureMethod')}
        </h3>

        <button
          className="w-full flex items-center gap-4 rounded-xl bg-terracotta p-5 text-left rtl:text-right text-bone-white shadow-md transition-all hover:bg-clay active:scale-[0.98]"
          onClick={() => setCaptureMethod('camera')}
        >
          <div className="rounded-full bg-bone-white/20 p-3">
            <Camera className="h-8 w-8" />
          </div>
          <div>
            <h4 className="font-semibold text-lg">{t('pages.capture.useCamera')}</h4>
            <p className="text-bone-white/80 text-sm">
              {t('pages.capture.useCameraDesc')}
            </p>
          </div>
        </button>

        <button
          className="w-full flex items-center gap-4 rounded-xl bg-aged-paper border-2 border-dashed border-desert-sand p-5 text-left rtl:text-right transition-all hover:border-clay hover:bg-parchment active:scale-[0.98]"
          onClick={() => setCaptureMethod('upload')}
        >
          <div className="rounded-full bg-sienna/10 p-3">
            <Upload className="h-8 w-8 text-sienna" />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-charcoal">{t('pages.capture.uploadFiles')}</h4>
            <p className="text-stone-gray text-sm">
              {t('pages.capture.uploadFilesDesc')}
            </p>
          </div>
        </button>
      </div>

      {/* Tips */}
      <div className="mt-8">
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
          {t('pages.capture.captureTips')}
        </h3>
        <ul className="space-y-2 text-sm text-stone-gray">
          <li className="flex gap-2">
            <span className="text-terracotta">•</span>
            {t('pages.capture.tips.lighting')}
          </li>
          <li className="flex gap-2">
            <span className="text-terracotta">•</span>
            {t('pages.capture.tips.background')}
          </li>
          <li className="flex gap-2">
            <span className="text-terracotta">•</span>
            {t('pages.capture.tips.shadows')}
          </li>
          <li className="flex gap-2">
            <span className="text-terracotta">•</span>
            {t('pages.capture.tips.scale')}
          </li>
        </ul>
      </div>
    </div>
  );
}

// Color scheme preview component for colorize mode
function ColorSchemePreview({ name, colors }: { name: string; colors: string[] }) {
  return (
    <div className="rounded-xl bg-aged-paper border border-desert-sand p-3">
      <div className="flex gap-1 mb-2">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-desert-sand/50"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-charcoal">{name}</p>
    </div>
  );
}
