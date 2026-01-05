import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Box, Image, FileText, Palette, Download, Share2, Plus, ImageOff } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useArtifactData, useReconstruct3D, useColorize } from '@/hooks';
import { ReconstructionCard } from '@/components/reconstruction';
import { ModelViewer } from '@/components/viewer';
import { LoadingSpinner } from '@/components/ui';
import {
  InfoCardDisplay,
  InfoCardEditor,
  InfoCardExport,
  InfoCardGeneration,
} from '@/components/info-card';
import {
  ColorizationCard,
  ColorVariantGallery,
  VariantDetailView,
} from '@/components/colorization';
import type { ColorizationStatus } from '@/components/colorization';
import type { ReconstructionMethod } from '@/components/reconstruction';
import type { ReconstructionStatus } from '@/components/reconstruction/ReconstructionProgress';
import type { InfoCard, ColorVariant, ColorScheme, ArtifactImage } from '@/types';
import { deleteColorVariant } from '@/lib/db';

type Tab = '3d' | 'photos' | 'info' | 'colors';

export function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('3d');

  // Load artifact data
  const { data, isLoading, error, refetch } = useArtifactData(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-stone-gray">Loading artifact...</p>
        </div>
      </div>
    );
  }

  if (error || !data.artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Box className="h-16 w-16 text-stone-gray/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">
            Artifact Not Found
          </h2>
          <p className="text-stone-gray mb-4">
            {error?.message || 'This artifact could not be loaded.'}
          </p>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2 text-bone-white hover:bg-clay transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const { artifact, images, model } = data;
  const artifactName = artifact.metadata?.name || `Artifact #${artifact.id.slice(0, 8)}`;

  return (
    <div className="min-h-screen pb-20">
      {/* Back Header */}
      <div className="sticky top-14 z-40 bg-parchment border-b border-desert-sand">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/gallery"
            className="rounded-full p-2 hover:bg-aged-paper transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-charcoal" />
          </Link>
          <h2 className="font-heading font-semibold text-charcoal truncate">
            {artifactName}
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-desert-sand">
          <TabButton
            active={activeTab === '3d'}
            onClick={() => setActiveTab('3d')}
            icon={Box}
            label="3D Model"
          />
          <TabButton
            active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
            icon={Image}
            label="Photos"
            count={images.length}
          />
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            icon={FileText}
            label="Info"
          />
          <TabButton
            active={activeTab === 'colors'}
            onClick={() => setActiveTab('colors')}
            icon={Palette}
            label="Colors"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === '3d' && (
          <Model3DTab
            artifactId={artifact.id}
            model={model}
            images={images}
            artifactStatus={artifact.status}
            onReconstructionComplete={refetch}
          />
        )}
        {activeTab === 'photos' && <PhotosTab images={images} />}
        {activeTab === 'info' && (
          <InfoTab
            artifactId={artifact.id}
            artifact={artifact}
            images={images}
            infoCard={data.infoCard}
            onRefetch={refetch}
          />
        )}
        {activeTab === 'colors' && (
          <ColorsTab
            artifactId={artifact.id}
            colorVariants={data.colorVariants}
            images={images}
            onRefetch={refetch}
          />
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}

function TabButton({ active, onClick, icon: Icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2',
        active
          ? 'border-terracotta text-terracotta'
          : 'border-transparent text-stone-gray hover:text-charcoal'
      )}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-2 bg-terracotta text-bone-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
      <span>{label}</span>
    </button>
  );
}

interface Model3DTabProps {
  artifactId: string;
  model: ReturnType<typeof useArtifactData>['data']['model'];
  images: ReturnType<typeof useArtifactData>['data']['images'];
  artifactStatus: string;
  onReconstructionComplete: () => void;
}

function Model3DTab({
  artifactId,
  model,
  images,
  artifactStatus,
  onReconstructionComplete,
}: Model3DTabProps) {
  const [selectedMethod, setSelectedMethod] = useState<ReconstructionMethod>('multi');

  // Convert artifact status to reconstruction status
  const getReconstructionStatus = (): ReconstructionStatus => {
    if (model) return 'completed';
    if (artifactStatus === 'processing-3d') return 'processing';
    if (artifactStatus === 'error') return 'error';
    return 'idle';
  };

  // Use the reconstruction hook
  const {
    startReconstruction,
    cancel,
    state,
    progress,
    error,
    reset,
  } = useReconstruct3D({
    artifactId,
    onSuccess: () => {
      onReconstructionComplete();
    },
    onError: (err) => {
      console.error('Reconstruction failed:', err);
    },
  });

  // Map hook state to UI status
  const uiStatus: ReconstructionStatus = useMemo(() => {
    if (model) return 'completed';
    if (state === 'uploading') return 'uploading';
    if (state === 'processing') return 'processing';
    if (state === 'error') return 'error';
    if (state === 'complete') return 'completed';
    return getReconstructionStatus();
  }, [model, state, artifactStatus]);

  // Handle start reconstruction
  const handleStart = useCallback(async () => {
    if (images.length === 0) return;

    // Get image blobs
    const imageBlobs = images.map((img) => img.blob);
    await startReconstruction(imageBlobs, selectedMethod === 'single' ? 'single' : 'multi');
  }, [images, selectedMethod, startReconstruction]);

  // Handle view result - scroll to model viewer
  const handleViewResult = useCallback(() => {
    // Model is already visible, could trigger fullscreen or focus
  }, []);

  // Create model URL from blob for viewer
  const modelUrl = useMemo(() => {
    if (!model?.blob) return null;
    return URL.createObjectURL(model.blob);
  }, [model?.blob]);

  // If we have a 3D model, show the viewer
  if (model && modelUrl) {
    return (
      <div className="space-y-4">
        {/* Model Viewer */}
        <div className="aspect-square rounded-xl overflow-hidden border border-desert-sand">
          <ModelViewer
            modelUrl={modelUrl}
            initialLighting="museum"
            onError={(err) => console.error('Model viewer error:', err)}
          />
        </div>

        {/* Model Info */}
        <div className="rounded-xl bg-aged-paper p-4 space-y-3">
          <h3 className="font-heading font-semibold text-charcoal">Model Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-gray">Format</p>
              <p className="text-charcoal font-medium uppercase">{model.format}</p>
            </div>
            <div>
              <p className="text-stone-gray">Source</p>
              <p className="text-charcoal font-medium">
                {model.source === '3d-single' ? 'Single Image' : 'Multi-Image'}
              </p>
            </div>
            <div>
              <p className="text-stone-gray">Created</p>
              <p className="text-charcoal font-medium">
                {new Date(model.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-stone-gray">Size</p>
              <p className="text-charcoal font-medium">
                {model.metadata?.fileSize
                  ? `${(model.metadata.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = modelUrl;
              link.download = `artifact-${artifactId}.${model.format}`;
              link.click();
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-terracotta py-3 text-bone-white font-medium hover:bg-clay transition-colors"
          >
            <Download className="h-5 w-5" />
            Download 3D Model
          </button>
        </div>

        {/* Regenerate Option */}
        <div className="rounded-xl border border-desert-sand p-4">
          <p className="text-sm text-stone-gray mb-3">
            Not satisfied with the result? You can regenerate the 3D model.
          </p>
          <button
            onClick={() => reset()}
            className="text-sm text-terracotta hover:text-clay font-medium"
          >
            Generate New Model
          </button>
        </div>
      </div>
    );
  }

  // No model yet - show reconstruction card
  return (
    <ReconstructionCard
      status={uiStatus}
      progress={progress}
      statusMessage={getStatusMessage(state, progress)}
      errorMessage={error?.message}
      selectedMethod={selectedMethod}
      onMethodChange={setSelectedMethod}
      onStart={handleStart}
      onCancel={cancel}
      onRetry={() => {
        reset();
        handleStart();
      }}
      onViewResult={handleViewResult}
      imageCount={images.length}
    />
  );
}

function getStatusMessage(state: string, progress: number): string {
  switch (state) {
    case 'uploading':
      if (progress < 15) return 'Converting images...';
      if (progress < 30) return 'Encoding image data...';
      return 'Uploading to server...';
    case 'processing':
      if (progress < 50) return 'Starting 3D reconstruction...';
      if (progress < 70) return 'Analyzing image features...';
      if (progress < 85) return 'Building 3D geometry...';
      if (progress < 95) return 'Saving model...';
      return 'Finalizing...';
    case 'complete':
      return 'Reconstruction complete!';
    case 'error':
      return 'An error occurred';
    default:
      return 'Ready to start';
  }
}

interface PhotosTabProps {
  images: ReturnType<typeof useArtifactData>['data']['images'];
}

function PhotosTab({ images }: PhotosTabProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 text-stone-gray/50 mx-auto mb-3" />
        <p className="text-stone-gray">No photos captured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-gray">
        {images.length} photo{images.length !== 1 ? 's' : ''} captured
      </p>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-xl overflow-hidden border border-desert-sand bg-aged-paper"
          >
            <img
              src={URL.createObjectURL(image.blob)}
              alt={`Artifact ${image.angle}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-charcoal/70 text-bone-white text-xs capitalize">
              {image.angle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface InfoTabProps {
  artifactId: string;
  artifact: ReturnType<typeof useArtifactData>['data']['artifact'];
  images: ReturnType<typeof useArtifactData>['data']['images'];
  infoCard: ReturnType<typeof useArtifactData>['data']['infoCard'];
  onRefetch: () => void;
}

function InfoTab({ artifactId, artifact, images, infoCard, onRefetch }: InfoTabProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'generate'>('view');
  const [showExport, setShowExport] = useState(false);
  const [currentInfoCard, setCurrentInfoCard] = useState<InfoCard | null>(infoCard);

  // Update current info card when prop changes
  useMemo(() => {
    if (infoCard) {
      setCurrentInfoCard(infoCard);
    }
  }, [infoCard]);

  // Handle generation complete
  const handleGenerationComplete = useCallback((newInfoCard: InfoCard) => {
    setCurrentInfoCard(newInfoCard);
    setMode('view');
    onRefetch();
  }, [onRefetch]);

  // Handle edit save
  const handleEditSave = useCallback((updatedCard: InfoCard) => {
    setCurrentInfoCard(updatedCard);
    setMode('view');
    onRefetch();
  }, [onRefetch]);

  // No info card yet - show generation UI
  if (!currentInfoCard || mode === 'generate') {
    return (
      <InfoCardGeneration
        artifactId={artifactId}
        images={images}
        initialMetadata={artifact?.metadata}
        onComplete={handleGenerationComplete}
        onCancel={currentInfoCard ? () => setMode('view') : undefined}
      />
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <InfoCardEditor
        infoCard={currentInfoCard}
        onSave={handleEditSave}
        onCancel={() => setMode('view')}
      />
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aged-paper border border-desert-sand text-sm text-charcoal hover:bg-desert-sand/50 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          onClick={() => setMode('generate')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aged-paper border border-desert-sand text-sm text-charcoal hover:bg-desert-sand/50 transition-colors"
        >
          Regenerate
        </button>
      </div>

      {/* Info card display */}
      <InfoCardDisplay
        infoCard={currentInfoCard}
        onEdit={() => setMode('edit')}
        showEditButton
      />

      {/* Export modal */}
      {showExport && artifact && (
        <InfoCardExport
          infoCard={currentInfoCard}
          artifact={artifact}
          images={images}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

type ColorsTabMode = 'gallery' | 'generate' | 'detail';

interface ColorsTabProps {
  artifactId: string;
  colorVariants: ColorVariant[];
  images: ArtifactImage[];
  onRefetch: () => void;
}

function ColorsTab({ artifactId, colorVariants, images, onRefetch }: ColorsTabProps) {
  // State management
  const [mode, setMode] = useState<ColorsTabMode>(colorVariants.length > 0 ? 'gallery' : 'generate');
  const [selectedVariant, setSelectedVariant] = useState<ColorVariant | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>('original');
  const [customPrompt, setCustomPrompt] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get the first image to use for colorization
  const sourceImage = images.length > 0 ? images[0] : undefined;

  // Colorization hook
  const {
    colorize,
    cancel,
    state: colorizeState,
    progress,
    error: colorizeError,
    isProcessing,
    reset,
  } = useColorize({
    artifactId,
    onSuccess: () => {
      onRefetch();
      setMode('gallery');
      reset();
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  // Map colorize state to ColorizationStatus
  const colorizationStatus: ColorizationStatus = useMemo(() => {
    switch (colorizeState) {
      case 'uploading':
      case 'processing':
        return 'processing';
      case 'complete':
        return 'completed';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  }, [colorizeState]);

  // Handle generate colors
  const handleGenerate = useCallback(async () => {
    if (!sourceImage) return;
    setErrorMessage(null);
    await colorize(
      sourceImage.blob,
      selectedScheme,
      selectedScheme === 'custom' ? customPrompt : undefined
    );
  }, [sourceImage, selectedScheme, customPrompt, colorize]);

  // Handle variant click
  const handleVariantClick = useCallback((variant: ColorVariant) => {
    setSelectedVariant(variant);
    setMode('detail');
  }, []);

  // Handle variant delete
  const handleVariantDelete = useCallback(async (variantId: string) => {
    try {
      await deleteColorVariant(variantId);
      onRefetch();
      setSelectedVariant(null);
      setMode('gallery');
    } catch (err) {
      console.error('Failed to delete color variant:', err);
    }
  }, [onRefetch]);

  // Handle download variant
  const handleDownload = useCallback(() => {
    if (!selectedVariant) return;

    const url = URL.createObjectURL(selectedVariant.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `colorized-${selectedVariant.colorScheme}-${artifactId.slice(0, 8)}.png`;
    link.click();
    // Delay revocation to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [selectedVariant, artifactId]);

  // Handle close detail view
  const handleCloseDetail = useCallback(() => {
    setSelectedVariant(null);
    setMode('gallery');
  }, []);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    reset();
    setErrorMessage(null);
    handleGenerate();
  }, [reset, handleGenerate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancel();
    reset();
    setMode(colorVariants.length > 0 ? 'gallery' : 'generate');
  }, [cancel, reset, colorVariants.length]);

  // Handle view result after completion
  const handleViewResult = useCallback(() => {
    onRefetch();
    setMode('gallery');
    reset();
  }, [onRefetch, reset]);

  // No images available
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-aged-paper mx-auto mb-4 flex items-center justify-center">
          <ImageOff className="h-8 w-8 text-stone-gray/50" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">
          No Images Available
        </h3>
        <p className="text-stone-gray text-sm max-w-xs mx-auto">
          Capture photos of your artifact first to generate color variants.
        </p>
      </div>
    );
  }

  // Show detail view modal
  if (mode === 'detail' && selectedVariant && sourceImage) {
    return (
      <VariantDetailView
        variant={selectedVariant}
        originalImage={sourceImage}
        onClose={handleCloseDetail}
        onDownload={handleDownload}
        onDelete={() => handleVariantDelete(selectedVariant.id)}
      />
    );
  }

  // Show generate mode (no variants or user clicked generate more)
  if (mode === 'generate' || isProcessing) {
    return (
      <div className="space-y-4">
        {/* Back button if variants exist */}
        {colorVariants.length > 0 && !isProcessing && (
          <button
            onClick={() => setMode('gallery')}
            className="flex items-center gap-2 text-sm text-stone-gray hover:text-charcoal transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </button>
        )}

        <ColorizationCard
          status={colorizationStatus}
          progress={progress}
          statusMessage={getColorizeStatusMessage(colorizeState, progress)}
          errorMessage={errorMessage || colorizeError?.message}
          selectedScheme={selectedScheme}
          onSchemeChange={setSelectedScheme}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          onGenerate={handleGenerate}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onViewResult={handleViewResult}
          hasModel={true} // We're using images directly, not requiring a model
        />
      </div>
    );
  }

  // Gallery mode with variants
  return (
    <div className="space-y-4">
      {/* Header with count and generate more button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-gray">
          {colorVariants.length} color variant{colorVariants.length !== 1 ? 's' : ''} generated
        </p>
        <button
          onClick={() => setMode('generate')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terracotta text-bone-white text-sm font-medium hover:bg-clay transition-colors"
        >
          <Plus className="h-4 w-4" />
          Generate More
        </button>
      </div>

      {/* Color variant gallery */}
      <ColorVariantGallery
        variants={colorVariants}
        originalImage={sourceImage}
        onVariantClick={handleVariantClick}
        onVariantDelete={handleVariantDelete}
        emptyMessage="Generate color variants to see historical color reconstructions of your artifact."
      />
    </div>
  );
}

/**
 * Get status message based on colorization state
 */
function getColorizeStatusMessage(state: string, progress: number): string {
  switch (state) {
    case 'uploading':
      if (progress < 15) return 'Converting image...';
      if (progress < 30) return 'Encoding image data...';
      return 'Uploading to AI service...';
    case 'processing':
      if (progress < 50) return 'Analyzing artifact surfaces...';
      if (progress < 70) return 'Applying color scheme...';
      if (progress < 85) return 'Refining color details...';
      if (progress < 95) return 'Saving colorized image...';
      return 'Finalizing...';
    case 'complete':
      return 'Colorization complete!';
    case 'error':
      return 'An error occurred';
    default:
      return 'Ready to colorize';
  }
}
