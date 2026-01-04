import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  RotateCcw,
  Maximize,
  Minimize,
  Camera,
  Sun,
  Lamp,
  TreePine,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

export type LightingPreset = 'ambient' | 'museum' | 'outdoor';

export interface ModelViewerProps {
  /** URL or path to the GLB/GLTF model */
  modelUrl: string;
  /** Optional class name for the container */
  className?: string;
  /** Initial lighting preset */
  initialLighting?: LightingPreset;
  /** Callback when screenshot is taken */
  onScreenshot?: (dataUrl: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface ModelProps {
  url: string;
  onError: (error: Error) => void;
}

interface SceneLightingProps {
  preset: LightingPreset;
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  className?: string;
}

// ============================================================================
// Lighting Configurations
// ============================================================================

const LIGHTING_PRESETS: Record<
  LightingPreset,
  { name: string; icon: React.ReactNode; environment: string | null }
> = {
  ambient: {
    name: 'Ambient',
    icon: <Lamp className="w-4 h-4" />,
    environment: null,
  },
  museum: {
    name: 'Museum',
    icon: <Sun className="w-4 h-4" />,
    environment: 'warehouse',
  },
  outdoor: {
    name: 'Outdoor',
    icon: <TreePine className="w-4 h-4" />,
    environment: 'sunset',
  },
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Renders the 3D model from the given URL
 */
function Model({ url, onError }: ModelProps) {
  const { scene } = useGLTF(url, true, undefined, (error) => {
    onError(error instanceof Error ? error : new Error(String(error)));
  });

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone();

  return (
    <Center>
      <primitive object={clonedScene} />
    </Center>
  );
}

/**
 * Scene lighting based on the selected preset
 */
function SceneLighting({ preset }: SceneLightingProps) {
  const config = LIGHTING_PRESETS[preset];

  return (
    <>
      {/* Base ambient light */}
      <ambientLight intensity={preset === 'ambient' ? 0.8 : 0.4} />

      {/* Directional lights for all presets */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={preset === 'outdoor' ? 1.5 : preset === 'museum' ? 1.0 : 0.6}
        castShadow
      />
      <directionalLight
        position={[-5, 3, -5]}
        intensity={preset === 'outdoor' ? 0.8 : 0.3}
      />

      {/* Museum-specific spotlight */}
      {preset === 'museum' && (
        <>
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={1.5}
            castShadow
          />
          <pointLight position={[0, -5, 0]} intensity={0.2} />
        </>
      )}

      {/* Environment map for realistic reflections */}
      {config.environment && (
        <Environment preset={config.environment as 'warehouse' | 'sunset'} />
      )}
    </>
  );
}

/**
 * Control button component for the viewer toolbar
 */
function ControlButton({
  onClick,
  icon,
  label,
  active = false,
  className,
}: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
        'hover:bg-desert-sand/30 active:scale-95',
        active
          ? 'bg-terracotta text-bone-white'
          : 'bg-aged-paper/80 text-charcoal backdrop-blur-sm',
        className
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

/**
 * Screenshot capture functionality hook
 */
function useScreenshot(onScreenshot?: (dataUrl: string) => void) {
  const gl = useThree((state) => state.gl);

  const capture = useCallback(() => {
    const dataUrl = gl.domElement.toDataURL('image/png');
    onScreenshot?.(dataUrl);
    return dataUrl;
  }, [gl, onScreenshot]);

  return capture;
}

/**
 * Component to handle screenshot capture from within Canvas
 */
function ScreenshotHandler({
  onCapture,
  captureRef,
}: {
  onCapture?: (dataUrl: string) => void;
  captureRef: React.MutableRefObject<(() => string) | null>;
}) {
  const capture = useScreenshot(onCapture);

  useEffect(() => {
    captureRef.current = capture;
  }, [capture, captureRef]);

  return null;
}

/**
 * Component to handle camera reset from within Canvas
 */
function CameraResetHandler({
  resetRef,
  controlsRef,
}: {
  resetRef: React.MutableRefObject<(() => void) | null>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    resetRef.current = () => {
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };
  }, [camera, controlsRef, resetRef]);

  return null;
}

/**
 * Loading overlay for the 3D viewer
 */
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-aged-paper/90 backdrop-blur-sm z-10">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-stone-gray font-medium">Loading 3D model...</p>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-aged-paper p-6 z-10">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-rust-red/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-rust-red" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">
          Failed to Load Model
        </h3>
        <p className="text-stone-gray text-sm mb-4">
          {error.message || 'An error occurred while loading the 3D model.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-terracotta text-bone-white rounded-lg font-medium hover:bg-clay transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * 3D Model Viewer component for archaeology artifacts
 *
 * Features:
 * - Load and display GLB/GLTF models
 * - OrbitControls for rotate/zoom/pan
 * - Reset view button
 * - Fullscreen mode toggle
 * - Screenshot capture
 * - Lighting presets (ambient, museum, outdoor)
 */
export function ModelViewer({
  modelUrl,
  className,
  initialLighting = 'museum',
  onScreenshot,
  onError,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const captureRef = useRef<(() => string) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lightingPreset, setLightingPreset] =
    useState<LightingPreset>(initialLighting);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showLightingMenu, setShowLightingMenu] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle screenshot capture
  const handleScreenshot = useCallback(() => {
    if (captureRef.current) {
      const dataUrl = captureRef.current();

      // Download the screenshot
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `artifact-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Handle camera reset
  const handleResetView = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  // Handle model load complete
  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle model load error
  const handleModelError = useCallback(
    (err: Error) => {
      setError(err);
      setIsLoading(false);
      onError?.(err);
    },
    [onError]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Force re-mount by clearing GLTF cache
    useGLTF.clear(modelUrl);
  }, [modelUrl]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full min-h-[300px] bg-stone-gray/10 rounded-xl overflow-hidden',
        isFullscreen && 'rounded-none',
        className
      )}
    >
      {/* Loading overlay */}
      {isLoading && !error && <LoadingOverlay />}

      {/* Error display */}
      {error && <ErrorDisplay error={error} onRetry={handleRetry} />}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={() => handleModelLoad()}
        className="touch-none"
      >
        <Suspense fallback={null}>
          <Model url={modelUrl} onError={handleModelError} />
        </Suspense>

        <SceneLighting preset={lightingPreset} />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
          makeDefault
        />

        <ScreenshotHandler onCapture={onScreenshot} captureRef={captureRef} />
        <CameraResetHandler resetRef={resetRef} controlsRef={controlsRef} />
      </Canvas>

      {/* Controls toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-xl bg-parchment/90 backdrop-blur-sm shadow-lg border border-desert-sand/50">
        {/* Reset view */}
        <ControlButton
          onClick={handleResetView}
          icon={<RotateCcw className="w-4 h-4" />}
          label="Reset view"
        />

        {/* Lighting preset toggle */}
        <div className="relative">
          <ControlButton
            onClick={() => setShowLightingMenu((prev) => !prev)}
            icon={LIGHTING_PRESETS[lightingPreset].icon}
            label={`Lighting: ${LIGHTING_PRESETS[lightingPreset].name}`}
            active={showLightingMenu}
          />

          {/* Lighting menu */}
          {showLightingMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-parchment shadow-lg border border-desert-sand/50 min-w-[120px]">
              {(Object.keys(LIGHTING_PRESETS) as LightingPreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setLightingPreset(preset);
                      setShowLightingMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      lightingPreset === preset
                        ? 'bg-terracotta text-bone-white'
                        : 'hover:bg-desert-sand/30 text-charcoal'
                    )}
                  >
                    {LIGHTING_PRESETS[preset].icon}
                    <span>{LIGHTING_PRESETS[preset].name}</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-desert-sand/50" />

        {/* Screenshot */}
        <ControlButton
          onClick={handleScreenshot}
          icon={<Camera className="w-4 h-4" />}
          label="Take screenshot"
        />

        {/* Fullscreen toggle */}
        <ControlButton
          onClick={toggleFullscreen}
          icon={
            isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )
          }
          label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        />
      </div>

      {/* Lighting preset indicator (top-left) */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-parchment/80 backdrop-blur-sm text-sm text-charcoal flex items-center gap-2 border border-desert-sand/30">
        {LIGHTING_PRESETS[lightingPreset].icon}
        <span className="font-medium">
          {LIGHTING_PRESETS[lightingPreset].name}
        </span>
      </div>

      {/* Fullscreen exit hint */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-charcoal/70 backdrop-blur-sm text-sm text-bone-white">
          Press ESC to exit
        </div>
      )}
    </div>
  );
}

// Preload models for better performance
ModelViewer.preload = (url: string) => {
  useGLTF.preload(url);
};
