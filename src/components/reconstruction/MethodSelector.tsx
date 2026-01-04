import { useState } from 'react';
import { Image, Images, Zap, Target, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReconstructionMethod = 'single' | 'multi';

export interface MethodSelectorProps {
  value: ReconstructionMethod;
  onChange: (method: ReconstructionMethod) => void;
  disabled?: boolean;
  className?: string;
}

interface MethodOption {
  id: ReconstructionMethod;
  name: string;
  description: string;
  icon: typeof Image;
  features: { icon: typeof Zap; label: string }[];
  recommended?: boolean;
}

const methodOptions: MethodOption[] = [
  {
    id: 'single',
    name: 'Quick Capture',
    description: 'Fast 3D estimation from a single image',
    icon: Image,
    features: [
      { icon: Zap, label: 'Fast processing' },
      { icon: Clock, label: '~30 seconds' },
    ],
  },
  {
    id: 'multi',
    name: 'Full Reconstruction',
    description: 'Detailed 3D model from multiple angles',
    icon: Images,
    recommended: true,
    features: [
      { icon: Target, label: 'High accuracy' },
      { icon: Clock, label: '2-5 minutes' },
    ],
  },
];

export function MethodSelector({
  value,
  onChange,
  disabled = false,
  className,
}: MethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<ReconstructionMethod | null>(null);

  return (
    <div className={cn('w-full', className)}>
      <label className="block font-heading text-sm font-semibold text-charcoal mb-3">
        Reconstruction Method
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methodOptions.map((option) => {
          const isSelected = value === option.id;
          const isHovered = hoveredMethod === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !disabled && onChange(option.id)}
              onMouseEnter={() => setHoveredMethod(option.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              disabled={disabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2',
                isSelected
                  ? 'border-terracotta bg-terracotta/5'
                  : 'border-desert-sand bg-aged-paper hover:border-clay hover:bg-desert-sand/20',
                disabled && 'opacity-50 cursor-not-allowed',
                !disabled && !isSelected && 'cursor-pointer'
              )}
              aria-pressed={isSelected}
            >
              {/* Recommended badge */}
              {option.recommended && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-medium bg-oxidized-bronze text-bone-white rounded-full">
                  Recommended
                </span>
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'border-terracotta bg-terracotta'
                    : 'border-desert-sand bg-transparent'
                )}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3 text-bone-white" />}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                  isSelected || isHovered
                    ? 'bg-terracotta/10'
                    : 'bg-sienna/10'
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isSelected || isHovered ? 'text-terracotta' : 'text-sienna'
                  )}
                />
              </div>

              {/* Content */}
              <h3
                className={cn(
                  'font-heading font-semibold mb-1 transition-colors',
                  isSelected ? 'text-terracotta' : 'text-charcoal'
                )}
              >
                {option.name}
              </h3>
              <p className="text-stone-gray text-sm mb-3">{option.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {option.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs text-stone-gray bg-desert-sand/30 px-2 py-1 rounded-full"
                    >
                      <FeatureIcon className="w-3 h-3" />
                      {feature.label}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-stone-gray">
        {value === 'single'
          ? 'Quick capture uses AI to estimate 3D structure from a single photo. Best for quick documentation.'
          : 'Full reconstruction creates detailed 3D models using photogrammetry. Requires 8-20 photos from different angles.'}
      </p>
    </div>
  );
}
