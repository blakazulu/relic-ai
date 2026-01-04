import { useState, useCallback } from 'react';
import {
  MapPin,
  Layers,
  MapPinned,
  Calendar,
  StickyNote,
  Navigation,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGeoLocation, formatCoordinates, formatAccuracy } from '@/hooks/useGeoLocation';
import type { ArtifactMetadata } from '@/types';

/**
 * Field template presets for common archaeological scenarios
 */
const FIELD_TEMPLATES = [
  {
    id: 'excavation',
    name: 'Excavation Site',
    icon: Layers,
    description: 'Standard excavation context',
    defaults: {
      excavationLayer: 'Layer ',
      notes: 'Found during systematic excavation. ',
    },
  },
  {
    id: 'survey',
    name: 'Field Survey',
    icon: MapPin,
    description: 'Surface collection during survey',
    defaults: {
      excavationLayer: 'Surface find',
      notes: 'Collected during pedestrian survey. ',
    },
  },
  {
    id: 'rescue',
    name: 'Rescue Archaeology',
    icon: AlertCircle,
    description: 'Emergency/salvage excavation',
    defaults: {
      excavationLayer: 'Disturbed context',
      notes: 'Rescue excavation - limited time for documentation. ',
    },
  },
];

interface MetadataFormProps {
  /** Initial values for the form */
  initialValues?: Partial<ArtifactMetadata>;
  /** Called when form values change */
  onChange: (metadata: ArtifactMetadata) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Whether to show the full form or compact version */
  compact?: boolean;
}

export function MetadataForm({
  initialValues = {},
  onChange,
  disabled = false,
  compact = false,
}: MetadataFormProps) {
  // Form state
  const [metadata, setMetadata] = useState<ArtifactMetadata>({
    discoveryLocation: initialValues.discoveryLocation || '',
    excavationLayer: initialValues.excavationLayer || '',
    siteName: initialValues.siteName || '',
    dateFound: initialValues.dateFound || new Date(),
    notes: initialValues.notes || '',
    coordinates: initialValues.coordinates,
    tags: initialValues.tags || [],
  });

  // GPS hook
  const {
    coordinates,
    state: geoState,
    error: geoError,
    requestLocation,
    clearLocation,
    isLoading: isGeoLoading,
    isSupported: isGeoSupported,
  } = useGeoLocation();

  // Expanded state for compact mode
  const [isExpanded, setIsExpanded] = useState(!compact);

  /**
   * Update a single field
   */
  const updateField = useCallback(
    (field: keyof ArtifactMetadata, value: unknown) => {
      const updated = { ...metadata, [field]: value };
      setMetadata(updated);
      onChange(updated);
    },
    [metadata, onChange]
  );

  /**
   * Apply a field template
   */
  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = FIELD_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const updated = {
        ...metadata,
        ...template.defaults,
        // Append to existing notes rather than replace
        notes: metadata.notes
          ? metadata.notes + template.defaults.notes
          : template.defaults.notes,
      };
      setMetadata(updated);
      onChange(updated);
    },
    [metadata, onChange]
  );

  /**
   * Handle GPS capture
   */
  const handleGPSCapture = useCallback(async () => {
    const coords = await requestLocation();
    if (coords) {
      const updated = {
        ...metadata,
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        },
      };
      setMetadata(updated);
      onChange(updated);
    }
  }, [metadata, onChange, requestLocation]);

  /**
   * Clear GPS coordinates
   */
  const handleClearGPS = useCallback(() => {
    clearLocation();
    const updated = { ...metadata, coordinates: undefined };
    setMetadata(updated);
    onChange(updated);
  }, [metadata, onChange, clearLocation]);

  // Use coordinates from state or GPS hook
  const currentCoords = metadata.coordinates || coordinates
    ? {
        latitude: metadata.coordinates?.latitude ?? coordinates?.latitude ?? 0,
        longitude: metadata.coordinates?.longitude ?? coordinates?.longitude ?? 0,
        accuracy: metadata.coordinates?.accuracy ?? coordinates?.accuracy ?? 0,
      }
    : null;

  return (
    <div className={cn('space-y-4', disabled && 'opacity-60 pointer-events-none')}>
      {/* Header with expand/collapse for compact mode */}
      {compact && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-aged-paper hover:bg-desert-sand/20 transition-colors"
        >
          <span className="font-medium text-charcoal">Additional Context (Optional)</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-stone-gray" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-gray" />
          )}
        </button>
      )}

      {/* Form fields */}
      {(!compact || isExpanded) && (
        <div className="space-y-4">
          {/* Quick Templates */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-2 block">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {FIELD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-aged-paper border border-desert-sand text-sm text-charcoal hover:bg-desert-sand/50 transition-colors"
                >
                  <template.icon className="h-3.5 w-3.5" />
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Site Name */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <MapPinned className="h-3.5 w-3.5 inline mr-1" />
              Site Name
            </label>
            <input
              type="text"
              value={metadata.siteName || ''}
              onChange={(e) => updateField('siteName', e.target.value)}
              placeholder="e.g., Tel Megiddo, Pompeii"
              className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal placeholder:text-stone-gray/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>

          {/* Discovery Location */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <MapPin className="h-3.5 w-3.5 inline mr-1" />
              Discovery Location
            </label>
            <input
              type="text"
              value={metadata.discoveryLocation || ''}
              onChange={(e) => updateField('discoveryLocation', e.target.value)}
              placeholder="e.g., Trench A, Grid Square B4"
              className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal placeholder:text-stone-gray/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>

          {/* Excavation Layer */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <Layers className="h-3.5 w-3.5 inline mr-1" />
              Excavation Layer / Context
            </label>
            <input
              type="text"
              value={metadata.excavationLayer || ''}
              onChange={(e) => updateField('excavationLayer', e.target.value)}
              placeholder="e.g., Layer III, Context 1042, Stratum B"
              className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal placeholder:text-stone-gray/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>

          {/* Date Found */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              Date Found
            </label>
            <input
              type="date"
              value={metadata.dateFound ? new Date(metadata.dateFound).toISOString().split('T')[0] : ''}
              onChange={(e) => updateField('dateFound', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>

          {/* GPS Coordinates */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <Navigation className="h-3.5 w-3.5 inline mr-1" />
              GPS Coordinates
            </label>

            {currentCoords ? (
              <div className="rounded-lg border border-oxidized-bronze/30 bg-oxidized-bronze/10 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-oxidized-bronze">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Location captured</span>
                    </div>
                    <p className="text-sm text-charcoal mt-1 font-mono">
                      {formatCoordinates(currentCoords)}
                    </p>
                    <p className="text-xs text-stone-gray mt-0.5">
                      {formatAccuracy(currentCoords.accuracy)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearGPS}
                    className="text-xs text-rust-red hover:text-rust-red/80"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-desert-sand bg-aged-paper p-3">
                {!isGeoSupported ? (
                  <p className="text-sm text-stone-gray">
                    GPS is not available in this browser
                  </p>
                ) : geoState === 'denied' ? (
                  <div className="text-sm text-rust-red">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Location permission denied. Enable in browser settings.
                  </div>
                ) : geoError ? (
                  <div className="text-sm text-rust-red">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {geoError}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGPSCapture}
                    disabled={isGeoLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-terracotta text-bone-white hover:bg-clay transition-colors disabled:opacity-50"
                  >
                    {isGeoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4" />
                        Capture GPS Location
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5 block">
              <StickyNote className="h-3.5 w-3.5 inline mr-1" />
              Additional Notes
            </label>
            <textarea
              value={metadata.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional observations, context, or details..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal placeholder:text-stone-gray/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MetadataForm;
