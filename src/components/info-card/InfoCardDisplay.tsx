import { useState } from 'react';
import {
  Gem,
  Clock,
  Wrench,
  Globe,
  Archive,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InfoCard } from '@/types';

interface InfoCardDisplayProps {
  /** The info card data to display */
  infoCard: InfoCard;
  /** Called when user wants to edit the card */
  onEdit?: () => void;
  /** Whether the edit button should be shown */
  showEditButton?: boolean;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Get color for confidence level
 */
function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'text-oxidized-bronze bg-oxidized-bronze/10 border-oxidized-bronze/30';
    case 'medium':
      return 'text-gold-ochre bg-gold-ochre/10 border-gold-ochre/30';
    case 'low':
      return 'text-rust-red bg-rust-red/10 border-rust-red/30';
    default:
      return 'text-stone-gray bg-stone-gray/10 border-stone-gray/30';
  }
}

/**
 * Get icon for confidence level
 */
function getConfidenceIcon(confidence: 'high' | 'medium' | 'low') {
  switch (confidence) {
    case 'high':
      return Sparkles;
    case 'medium':
      return Clock;
    case 'low':
      return AlertTriangle;
  }
}

/**
 * Format AI confidence as percentage
 */
function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function InfoCardDisplay({
  infoCard,
  onEdit,
  showEditButton = true,
  compact = false,
}: InfoCardDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    compact ? null : 'material'
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const ConfidenceIcon = getConfidenceIcon(infoCard.estimatedAge.confidence);

  return (
    <div className="space-y-3">
      {/* Header with AI badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-terracotta to-clay flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-bone-white" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-charcoal">AI Analysis</h3>
            <p className="text-xs text-stone-gray">
              Confidence: {formatConfidence(infoCard.aiConfidence)}
            </p>
          </div>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aged-paper border border-desert-sand text-sm text-charcoal hover:bg-desert-sand/50 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Human edited badge */}
      {infoCard.isHumanEdited && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-oxidized-bronze/10 border border-oxidized-bronze/30 text-sm">
          <Edit3 className="h-4 w-4 text-oxidized-bronze" />
          <span className="text-oxidized-bronze">Edited by archaeologist</span>
        </div>
      )}

      {/* Material Section */}
      <InfoSection
        icon={Gem}
        title="Material"
        content={infoCard.material}
        isExpanded={!compact || expandedSection === 'material'}
        onToggle={() => compact && toggleSection('material')}
        compact={compact}
      />

      {/* Estimated Age Section */}
      <div className="rounded-xl border border-desert-sand overflow-hidden">
        <button
          onClick={() => compact && toggleSection('age')}
          className={cn(
            'w-full flex items-center justify-between p-3 text-left',
            compact ? 'hover:bg-aged-paper transition-colors' : ''
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-terracotta" />
            <span className="text-xs font-medium text-stone-gray uppercase tracking-wide">
              Estimated Age
            </span>
          </div>
          {compact && (
            expandedSection === 'age' ? (
              <ChevronUp className="h-4 w-4 text-stone-gray" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-gray" />
            )
          )}
        </button>

        {(!compact || expandedSection === 'age') && (
          <div className="px-3 pb-3 pt-0 space-y-2">
            <p className="text-charcoal font-medium">{infoCard.estimatedAge.range}</p>

            {/* Confidence badge */}
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
                getConfidenceColor(infoCard.estimatedAge.confidence)
              )}
            >
              <ConfidenceIcon className="h-3 w-3" />
              {infoCard.estimatedAge.confidence.charAt(0).toUpperCase() +
                infoCard.estimatedAge.confidence.slice(1)}{' '}
              confidence
            </div>

            {/* Reasoning */}
            {infoCard.estimatedAge.reasoning && (
              <p className="text-sm text-stone-gray mt-2 italic">
                "{infoCard.estimatedAge.reasoning}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Possible Use Section */}
      <InfoSection
        icon={Wrench}
        title="Possible Use"
        content={infoCard.possibleUse}
        isExpanded={!compact || expandedSection === 'use'}
        onToggle={() => compact && toggleSection('use')}
        compact={compact}
      />

      {/* Cultural Context Section */}
      <InfoSection
        icon={Globe}
        title="Cultural Context"
        content={infoCard.culturalContext}
        isExpanded={!compact || expandedSection === 'culture'}
        onToggle={() => compact && toggleSection('culture')}
        compact={compact}
      />

      {/* Similar Artifacts Section */}
      {infoCard.similarArtifacts && infoCard.similarArtifacts.length > 0 && (
        <div className="rounded-xl border border-desert-sand overflow-hidden">
          <button
            onClick={() => compact && toggleSection('similar')}
            className={cn(
              'w-full flex items-center justify-between p-3 text-left',
              compact ? 'hover:bg-aged-paper transition-colors' : ''
            )}
          >
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-terracotta" />
              <span className="text-xs font-medium text-stone-gray uppercase tracking-wide">
                Similar Artifacts
              </span>
            </div>
            {compact && (
              expandedSection === 'similar' ? (
                <ChevronUp className="h-4 w-4 text-stone-gray" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-gray" />
              )
            )}
          </button>

          {(!compact || expandedSection === 'similar') && (
            <div className="px-3 pb-3 pt-0">
              <ul className="space-y-1">
                {infoCard.similarArtifacts.map((artifact, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-charcoal"
                  >
                    <span className="text-terracotta mt-1">•</span>
                    <span>{artifact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preservation Notes Section */}
      <InfoSection
        icon={Shield}
        title="Preservation Notes"
        content={infoCard.preservationNotes}
        isExpanded={!compact || expandedSection === 'preservation'}
        onToggle={() => compact && toggleSection('preservation')}
        compact={compact}
        variant="warning"
      />

      {/* AI Disclaimer */}
      <div className="rounded-xl bg-desert-teal/10 border border-desert-teal/30 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-desert-teal flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-desert-teal mb-1">AI Disclaimer</p>
            <p className="text-xs text-stone-gray">{infoCard.disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Metadata footer */}
      <div className="flex items-center justify-between text-xs text-stone-gray pt-2 border-t border-desert-sand/50">
        <span>Model: {infoCard.aiModel}</span>
        <span>
          Generated: {new Date(infoCard.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

interface InfoSectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
  compact: boolean;
  variant?: 'default' | 'warning';
}

function InfoSection({
  icon: Icon,
  title,
  content,
  isExpanded,
  onToggle,
  compact,
  variant = 'default',
}: InfoSectionProps) {
  const bgClass = variant === 'warning' ? 'bg-gold-ochre/5' : '';

  return (
    <div
      className={cn(
        'rounded-xl border border-desert-sand overflow-hidden',
        bgClass
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-3 text-left',
          compact ? 'hover:bg-aged-paper transition-colors' : ''
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-terracotta" />
          <span className="text-xs font-medium text-stone-gray uppercase tracking-wide">
            {title}
          </span>
        </div>
        {compact && (
          isExpanded ? (
            <ChevronUp className="h-4 w-4 text-stone-gray" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-gray" />
          )
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-charcoal">{content}</p>
        </div>
      )}
    </div>
  );
}

export default InfoCardDisplay;
