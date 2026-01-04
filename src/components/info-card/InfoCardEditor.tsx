import { useState, useCallback } from 'react';
import {
  Gem,
  Clock,
  Wrench,
  Globe,
  Archive,
  Shield,
  Save,
  X,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateInfoCard } from '@/lib/db';
import type { InfoCard } from '@/types';

interface InfoCardEditorProps {
  /** The info card to edit */
  infoCard: InfoCard;
  /** Called when editing is complete */
  onSave: (updatedCard: InfoCard) => void;
  /** Called when editing is cancelled */
  onCancel: () => void;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

export function InfoCardEditor({
  infoCard,
  onSave,
  onCancel,
}: InfoCardEditorProps) {
  // Form state
  const [material, setMaterial] = useState(infoCard.material);
  const [ageRange, setAgeRange] = useState(infoCard.estimatedAge.range);
  const [ageConfidence, setAgeConfidence] = useState<ConfidenceLevel>(
    infoCard.estimatedAge.confidence
  );
  const [ageReasoning, setAgeReasoning] = useState(
    infoCard.estimatedAge.reasoning || ''
  );
  const [possibleUse, setPossibleUse] = useState(infoCard.possibleUse);
  const [culturalContext, setCulturalContext] = useState(infoCard.culturalContext);
  const [similarArtifacts, setSimilarArtifacts] = useState<string[]>(
    infoCard.similarArtifacts || []
  );
  const [preservationNotes, setPreservationNotes] = useState(
    infoCard.preservationNotes
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [newSimilarArtifact, setNewSimilarArtifact] = useState('');

  /**
   * Add a similar artifact to the list
   */
  const addSimilarArtifact = useCallback(() => {
    if (newSimilarArtifact.trim()) {
      setSimilarArtifacts([...similarArtifacts, newSimilarArtifact.trim()]);
      setNewSimilarArtifact('');
    }
  }, [newSimilarArtifact, similarArtifacts]);

  /**
   * Remove a similar artifact from the list
   */
  const removeSimilarArtifact = useCallback(
    (index: number) => {
      setSimilarArtifacts(similarArtifacts.filter((_, i) => i !== index));
    },
    [similarArtifacts]
  );

  /**
   * Reset form to original values
   */
  const handleReset = useCallback(() => {
    setMaterial(infoCard.material);
    setAgeRange(infoCard.estimatedAge.range);
    setAgeConfidence(infoCard.estimatedAge.confidence);
    setAgeReasoning(infoCard.estimatedAge.reasoning || '');
    setPossibleUse(infoCard.possibleUse);
    setCulturalContext(infoCard.culturalContext);
    setSimilarArtifacts(infoCard.similarArtifacts || []);
    setPreservationNotes(infoCard.preservationNotes);
  }, [infoCard]);

  /**
   * Save the edited info card
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const updates: Partial<InfoCard> = {
        material,
        estimatedAge: {
          range: ageRange,
          confidence: ageConfidence,
          reasoning: ageReasoning || undefined,
        },
        possibleUse,
        culturalContext,
        similarArtifacts,
        preservationNotes,
        isHumanEdited: true,
        updatedAt: new Date(),
      };

      await updateInfoCard(infoCard.id, updates);

      const updatedCard: InfoCard = {
        ...infoCard,
        ...updates,
        estimatedAge: {
          range: ageRange,
          confidence: ageConfidence,
          reasoning: ageReasoning || undefined,
        },
      };

      onSave(updatedCard);
    } catch (error) {
      console.error('Failed to save info card:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [
    infoCard,
    material,
    ageRange,
    ageConfidence,
    ageReasoning,
    possibleUse,
    culturalContext,
    similarArtifacts,
    preservationNotes,
    onSave,
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-desert-sand">
        <h3 className="font-heading font-semibold text-charcoal">Edit Info Card</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-aged-paper text-stone-gray hover:text-charcoal transition-colors"
            title="Reset to original"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Material */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5">
          <Gem className="h-3.5 w-3.5 text-terracotta" />
          Material
        </label>
        <input
          type="text"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        />
      </div>

      {/* Estimated Age */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide">
          <Clock className="h-3.5 w-3.5 text-terracotta" />
          Estimated Age
        </label>

        <input
          type="text"
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          placeholder="e.g., 500-300 BCE"
          className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        />

        <div>
          <label className="text-xs text-stone-gray mb-1.5 block">
            Confidence Level
          </label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as ConfidenceLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setAgeConfidence(level)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  ageConfidence === level
                    ? level === 'high'
                      ? 'bg-oxidized-bronze text-bone-white border-oxidized-bronze'
                      : level === 'medium'
                      ? 'bg-gold-ochre text-bone-white border-gold-ochre'
                      : 'bg-rust-red text-bone-white border-rust-red'
                    : 'bg-aged-paper border-desert-sand text-charcoal hover:bg-desert-sand/50'
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-gray mb-1.5 block">
            Reasoning (optional)
          </label>
          <textarea
            value={ageReasoning}
            onChange={(e) => setAgeReasoning(e.target.value)}
            placeholder="Explain the dating reasoning..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
          />
        </div>
      </div>

      {/* Possible Use */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5">
          <Wrench className="h-3.5 w-3.5 text-terracotta" />
          Possible Use
        </label>
        <textarea
          value={possibleUse}
          onChange={(e) => setPossibleUse(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
        />
      </div>

      {/* Cultural Context */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5">
          <Globe className="h-3.5 w-3.5 text-terracotta" />
          Cultural Context
        </label>
        <textarea
          value={culturalContext}
          onChange={(e) => setCulturalContext(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
        />
      </div>

      {/* Similar Artifacts */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5">
          <Archive className="h-3.5 w-3.5 text-terracotta" />
          Similar Artifacts
        </label>

        <div className="space-y-2">
          {similarArtifacts.map((artifact, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-aged-paper px-3 py-2"
            >
              <span className="flex-1 text-charcoal">{artifact}</span>
              <button
                type="button"
                onClick={() => removeSimilarArtifact(index)}
                className="p-1 rounded hover:bg-rust-red/10 text-rust-red transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newSimilarArtifact}
              onChange={(e) => setNewSimilarArtifact(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSimilarArtifact();
                }
              }}
              placeholder="Add similar artifact..."
              className="flex-1 px-3 py-2 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
            <button
              type="button"
              onClick={addSimilarArtifact}
              disabled={!newSimilarArtifact.trim()}
              className="px-3 py-2 rounded-lg bg-terracotta text-bone-white hover:bg-clay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preservation Notes */}
      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-stone-gray uppercase tracking-wide mb-1.5">
          <Shield className="h-3.5 w-3.5 text-terracotta" />
          Preservation Notes
        </label>
        <textarea
          value={preservationNotes}
          onChange={(e) => setPreservationNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-desert-sand bg-bone-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-desert-sand">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-desert-sand text-charcoal hover:bg-aged-paper transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-terracotta text-bone-white hover:bg-clay disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default InfoCardEditor;
