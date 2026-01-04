import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Box, Image, FileText, Palette, Download } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useArtifactData, useReconstruct3D } from '@/hooks';
import { ReconstructionCard } from '@/components/reconstruction';
import { ModelViewer } from '@/components/viewer';
import { LoadingSpinner } from '@/components/ui';
import type { ReconstructionMethod } from '@/components/reconstruction';
import type { ReconstructionStatus } from '@/components/reconstruction/ReconstructionProgress';

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
        {activeTab === 'info' && <InfoTab infoCard={data.infoCard} />}
        {activeTab === 'colors' && <ColorsTab colorVariants={data.colorVariants} />}
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
  infoCard: ReturnType<typeof useArtifactData>['data']['infoCard'];
}

function InfoTab({ infoCard }: InfoTabProps) {
  if (!infoCard) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-stone-gray/50 mx-auto mb-3" />
        <p className="text-stone-gray">Info card not generated yet</p>
        <button className="mt-4 rounded-lg bg-terracotta px-6 py-2.5 font-medium text-bone-white transition-colors hover:bg-clay">
          Generate Info Card
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Material */}
      {infoCard.material && (
        <div className="rounded-xl bg-aged-paper p-4">
          <p className="text-xs text-stone-gray uppercase mb-1">Material</p>
          <p className="text-charcoal font-medium">{infoCard.material}</p>
        </div>
      )}

      {/* Estimated Age */}
      {infoCard.estimatedAge && (
        <div className="rounded-xl border border-desert-sand p-4">
          <p className="text-xs text-stone-gray uppercase mb-1">Estimated Age</p>
          <p className="text-charcoal font-medium">{infoCard.estimatedAge.range}</p>
          <p className="text-xs text-stone-gray mt-1">
            Confidence: {infoCard.estimatedAge.confidence}
          </p>
        </div>
      )}

      {/* Possible Use */}
      {infoCard.possibleUse && (
        <div className="rounded-xl border border-desert-sand p-4">
          <p className="text-xs text-stone-gray uppercase mb-1">Possible Use</p>
          <p className="text-charcoal font-medium">{infoCard.possibleUse}</p>
        </div>
      )}

      {/* Cultural Context */}
      {infoCard.culturalContext && (
        <div className="rounded-xl border border-desert-sand p-4">
          <p className="text-xs text-stone-gray uppercase mb-1">Cultural Context</p>
          <p className="text-charcoal font-medium">{infoCard.culturalContext}</p>
        </div>
      )}

      {/* Preservation Notes */}
      {infoCard.preservationNotes && (
        <div className="rounded-xl border border-desert-sand p-4">
          <p className="text-xs text-stone-gray uppercase mb-1">Preservation Notes</p>
          <p className="text-charcoal font-medium">{infoCard.preservationNotes}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-desert-teal/10 border border-desert-teal/30 p-4">
        <p className="text-xs text-stone-gray">{infoCard.disclaimer}</p>
      </div>
    </div>
  );
}

interface ColorsTabProps {
  colorVariants: ReturnType<typeof useArtifactData>['data']['colorVariants'];
}

function ColorsTab({ colorVariants }: ColorsTabProps) {
  if (colorVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <Palette className="h-12 w-12 text-stone-gray/50 mx-auto mb-3" />
        <p className="text-stone-gray">No color variants yet</p>
        <button className="mt-4 rounded-lg bg-terracotta px-6 py-2.5 font-medium text-bone-white transition-colors hover:bg-clay">
          Generate Colors
        </button>
      </div>
    );
  }

  // Format color scheme for display
  const formatColorScheme = (scheme: string): string => {
    return scheme.charAt(0).toUpperCase() + scheme.slice(1);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-gray">
        {colorVariants.length} color variant{colorVariants.length !== 1 ? 's' : ''} generated
      </p>
      <div className="grid grid-cols-2 gap-3">
        {colorVariants.map((variant) => (
          <div
            key={variant.id}
            className="relative aspect-square rounded-xl overflow-hidden border border-desert-sand bg-aged-paper"
          >
            <img
              src={URL.createObjectURL(variant.blob)}
              alt={`${variant.colorScheme} color variant`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-charcoal/70 text-bone-white text-xs">
              {formatColorScheme(variant.colorScheme)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
