import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessingStatus, ProcessingStep } from '@/types';

/**
 * Main application store
 * Manages current artifact, processing status, and app-wide state
 */

interface AppState {
  // Current artifact being worked on
  currentArtifactId: string | null;

  // Processing status for async operations
  processingStatus: ProcessingStatus | null;

  // UI state
  isOnline: boolean;
  isSidebarOpen: boolean;

  // Actions
  setCurrentArtifact: (id: string | null) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  updateProcessingProgress: (progress: number, message: string) => void;
  setProcessingError: (error: string) => void;
  setProcessingStep: (step: ProcessingStep) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial state
  currentArtifactId: null,
  processingStatus: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSidebarOpen: false,

  // Actions
  setCurrentArtifact: (id) => set({ currentArtifactId: id }),

  setProcessingStatus: (status) => set({ processingStatus: status }),

  updateProcessingProgress: (progress, message) => {
    const current = get().processingStatus;
    if (current) {
      set({
        processingStatus: {
          ...current,
          progress,
          message,
        },
      });
    }
  },

  setProcessingError: (error) => {
    const current = get().processingStatus;
    if (current) {
      set({
        processingStatus: {
          ...current,
          step: 'error',
          error,
        },
      });
    }
  },

  setProcessingStep: (step) => {
    const current = get().processingStatus;
    if (current) {
      set({
        processingStatus: {
          ...current,
          step,
          progress: step === 'complete' ? 100 : current.progress,
        },
      });
    }
  },

  setOnlineStatus: (isOnline) => set({ isOnline }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));

/**
 * Settings store (persisted)
 * Manages user preferences
 */

interface SettingsState {
  // Theme
  theme: 'light' | 'dark' | 'system';

  // Language
  language: 'en' | 'he' | 'system';

  // 3D reconstruction preferences
  default3DMethod: 'single' | 'multi';
  autoRemoveBackground: boolean;

  // Info card preferences
  autoGenerateInfoCard: boolean;

  // Mobile UX preferences
  hapticsEnabled: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'he' | 'system') => void;
  setDefault3DMethod: (method: 'single' | 'multi') => void;
  setAutoRemoveBackground: (auto: boolean) => void;
  setAutoGenerateInfoCard: (auto: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      theme: 'system',
      language: 'system', // Auto-detect from browser
      default3DMethod: 'single',
      autoRemoveBackground: true,
      autoGenerateInfoCard: true,
      hapticsEnabled: true, // Enabled by default on supported devices

      // Actions
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDefault3DMethod: (method) => set({ default3DMethod: method }),
      setAutoRemoveBackground: (auto) => set({ autoRemoveBackground: auto }),
      setAutoGenerateInfoCard: (auto) => set({ autoGenerateInfoCard: auto }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
    }),
    {
      name: 'archaeology-settings',
    }
  )
);

/**
 * Capture session store
 * Manages the current image capture session
 */

interface CaptureImage {
  id: string;
  blob: Blob;
  angle: string;
  timestamp: Date;
}

interface CaptureState {
  // Session state
  isCapturing: boolean;
  capturedImages: CaptureImage[];
  selectedCamera: 'user' | 'environment';

  // Actions
  startCapture: () => void;
  endCapture: () => void;
  addCapturedImage: (image: CaptureImage) => void;
  removeCapturedImage: (id: string) => void;
  clearCapturedImages: () => void;
  setSelectedCamera: (camera: 'user' | 'environment') => void;
}

export const useCaptureStore = create<CaptureState>()((set) => ({
  // Initial state
  isCapturing: false,
  capturedImages: [],
  selectedCamera: 'environment', // Back camera by default

  // Actions
  startCapture: () => set({ isCapturing: true }),
  endCapture: () => set({ isCapturing: false }),

  addCapturedImage: (image) =>
    set((state) => ({
      capturedImages: [...state.capturedImages, image],
    })),

  removeCapturedImage: (id) =>
    set((state) => ({
      capturedImages: state.capturedImages.filter((img) => img.id !== id),
    })),

  clearCapturedImages: () => set({ capturedImages: [] }),

  setSelectedCamera: (camera) => set({ selectedCamera: camera }),
}));
