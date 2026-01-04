import { useState, useCallback } from 'react';
import {
  FileJson,
  FileText,
  Share2,
  Copy,
  Check,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InfoCard, Artifact, ArtifactImage } from '@/types';

/**
 * Escape HTML to prevent XSS attacks in PDF export
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

interface InfoCardExportProps {
  /** The info card to export */
  infoCard: InfoCard;
  /** The parent artifact */
  artifact: Artifact;
  /** Images associated with the artifact */
  images?: ArtifactImage[];
  /** Called when the export modal should close */
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'json' | 'share';

export function InfoCardExport({
  infoCard,
  artifact,
  images,
  onClose,
}: InfoCardExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Generate PDF report
   */
  const exportPDF = useCallback(async () => {
    setIsExporting(true);

    try {
      // Create printable HTML content
      const artifactName = artifact.metadata?.name || `Artifact #${artifact.id.slice(0, 8)}`;

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archaeological Artifact Report - ${artifactName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Source Sans 3', sans-serif;
      color: #2D2D2D;
      background: #FFFEF9;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    h1, h2, h3 {
      font-family: 'Playfair Display', serif;
      color: #8B4513;
    }

    .header {
      text-align: center;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #D4A574;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .header .subtitle {
      color: #6B6B6B;
      font-size: 0.875rem;
    }

    .section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #F5E6D3;
      border-radius: 8px;
      border-left: 4px solid #C65D3B;
    }

    .section h3 {
      font-size: 0.875rem;
      color: #C65D3B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .section p {
      line-height: 1.6;
    }

    .confidence-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .confidence-high { background: #4A7C59; color: white; }
    .confidence-medium { background: #C9A227; color: white; }
    .confidence-low { background: #A63D2F; color: white; }

    .similar-list {
      list-style: none;
      padding-left: 1rem;
    }

    .similar-list li::before {
      content: "•";
      color: #C65D3B;
      margin-right: 0.5rem;
    }

    .disclaimer {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(61, 139, 139, 0.1);
      border: 1px solid rgba(61, 139, 139, 0.3);
      border-radius: 8px;
      font-size: 0.75rem;
      color: #6B6B6B;
    }

    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #D4A574;
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6B6B6B;
    }

    @media print {
      body { padding: 1rem; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(artifactName)}</h1>
    <p class="subtitle">Archaeological Artifact Report • Generated ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="section">
    <h3>Material</h3>
    <p>${escapeHtml(infoCard.material)}</p>
  </div>

  <div class="section">
    <h3>Estimated Age</h3>
    <p>${escapeHtml(infoCard.estimatedAge.range)}</p>
    <span class="confidence-badge confidence-${infoCard.estimatedAge.confidence}">
      ${infoCard.estimatedAge.confidence.toUpperCase()} CONFIDENCE
    </span>
    ${infoCard.estimatedAge.reasoning ? `<p style="margin-top: 0.5rem; font-style: italic;">"${escapeHtml(infoCard.estimatedAge.reasoning)}"</p>` : ''}
  </div>

  <div class="section">
    <h3>Possible Use</h3>
    <p>${escapeHtml(infoCard.possibleUse)}</p>
  </div>

  <div class="section">
    <h3>Cultural Context</h3>
    <p>${escapeHtml(infoCard.culturalContext)}</p>
  </div>

  ${infoCard.similarArtifacts && infoCard.similarArtifacts.length > 0 ? `
  <div class="section">
    <h3>Similar Artifacts</h3>
    <ul class="similar-list">
      ${infoCard.similarArtifacts.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h3>Preservation Notes</h3>
    <p>${escapeHtml(infoCard.preservationNotes)}</p>
  </div>

  ${artifact.metadata?.siteName || artifact.metadata?.discoveryLocation ? `
  <div class="section">
    <h3>Discovery Context</h3>
    ${artifact.metadata?.siteName ? `<p><strong>Site:</strong> ${escapeHtml(artifact.metadata.siteName)}</p>` : ''}
    ${artifact.metadata?.discoveryLocation ? `<p><strong>Location:</strong> ${escapeHtml(artifact.metadata.discoveryLocation)}</p>` : ''}
    ${artifact.metadata?.excavationLayer ? `<p><strong>Layer:</strong> ${escapeHtml(artifact.metadata.excavationLayer)}</p>` : ''}
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>AI Disclaimer:</strong> ${escapeHtml(infoCard.disclaimer)}
  </div>

  <div class="footer">
    <span>AI Model: ${infoCard.aiModel}</span>
    <span>Confidence: ${Math.round(infoCard.aiConfidence * 100)}%</span>
  </div>
</body>
</html>
      `.trim();

      // Create blob and trigger download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // Also offer direct download
      const link = document.createElement('a');
      link.href = url;
      link.download = `artifact-report-${artifact.id.slice(0, 8)}.html`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [artifact, infoCard]);

  /**
   * Export as JSON
   */
  const exportJSON = useCallback(async () => {
    setIsExporting(true);

    try {
      const exportData = {
        artifact: {
          id: artifact.id,
          createdAt: artifact.createdAt,
          updatedAt: artifact.updatedAt,
          status: artifact.status,
          metadata: artifact.metadata,
        },
        infoCard: {
          id: infoCard.id,
          createdAt: infoCard.createdAt,
          updatedAt: infoCard.updatedAt,
          material: infoCard.material,
          estimatedAge: infoCard.estimatedAge,
          possibleUse: infoCard.possibleUse,
          culturalContext: infoCard.culturalContext,
          similarArtifacts: infoCard.similarArtifacts,
          preservationNotes: infoCard.preservationNotes,
          aiModel: infoCard.aiModel,
          aiConfidence: infoCard.aiConfidence,
          isHumanEdited: infoCard.isHumanEdited,
          disclaimer: infoCard.disclaimer,
        },
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `artifact-${artifact.id.slice(0, 8)}.json`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('Failed to export JSON. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [artifact, infoCard]);

  /**
   * Copy share text to clipboard
   */
  const copyShareText = useCallback(async () => {
    const artifactName = artifact.metadata?.name || `Artifact #${artifact.id.slice(0, 8)}`;

    const shareText = `
Archaeological Artifact: ${artifactName}

📦 Material: ${infoCard.material}
📅 Estimated Age: ${infoCard.estimatedAge.range} (${infoCard.estimatedAge.confidence} confidence)
🔧 Possible Use: ${infoCard.possibleUse}
🌍 Cultural Context: ${infoCard.culturalContext}
${infoCard.similarArtifacts && infoCard.similarArtifacts.length > 0 ? `\n📚 Similar Artifacts:\n${infoCard.similarArtifacts.map(a => `  • ${a}`).join('\n')}` : ''}

⚠️ Note: This analysis was AI-generated and should be verified by qualified archaeologists.

---
Generated with Save The Past
    `.trim();

    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  }, [artifact, infoCard]);

  /**
   * Handle export based on selected format
   */
  const handleExport = useCallback(() => {
    switch (selectedFormat) {
      case 'pdf':
        exportPDF();
        break;
      case 'json':
        exportJSON();
        break;
      case 'share':
        copyShareText();
        break;
    }
  }, [selectedFormat, exportPDF, exportJSON, copyShareText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50">
      <div className="w-full max-w-md rounded-2xl bg-parchment shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-desert-sand">
          <h2 className="font-heading font-semibold text-charcoal">Export Info Card</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-aged-paper transition-colors"
          >
            <X className="h-5 w-5 text-stone-gray" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-stone-gray mb-3">Choose an export format:</p>

          {/* PDF Option */}
          <button
            onClick={() => setSelectedFormat('pdf')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left',
              selectedFormat === 'pdf'
                ? 'border-terracotta bg-terracotta/5'
                : 'border-desert-sand hover:border-terracotta/50'
            )}
          >
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                selectedFormat === 'pdf' ? 'bg-terracotta text-bone-white' : 'bg-aged-paper text-terracotta'
              )}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-charcoal">PDF Report</p>
              <p className="text-xs text-stone-gray">
                Printable report with all artifact details
              </p>
            </div>
          </button>

          {/* JSON Option */}
          <button
            onClick={() => setSelectedFormat('json')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left',
              selectedFormat === 'json'
                ? 'border-terracotta bg-terracotta/5'
                : 'border-desert-sand hover:border-terracotta/50'
            )}
          >
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                selectedFormat === 'json' ? 'bg-terracotta text-bone-white' : 'bg-aged-paper text-terracotta'
              )}
            >
              <FileJson className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-charcoal">JSON Data</p>
              <p className="text-xs text-stone-gray">
                Structured data for databases or integration
              </p>
            </div>
          </button>

          {/* Share/Copy Option */}
          <button
            onClick={() => setSelectedFormat('share')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left',
              selectedFormat === 'share'
                ? 'border-terracotta bg-terracotta/5'
                : 'border-desert-sand hover:border-terracotta/50'
            )}
          >
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                selectedFormat === 'share' ? 'bg-terracotta text-bone-white' : 'bg-aged-paper text-terracotta'
              )}
            >
              <Share2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-charcoal">Copy to Clipboard</p>
              <p className="text-xs text-stone-gray">
                Plain text summary for sharing
              </p>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-desert-sand flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-desert-sand text-charcoal hover:bg-aged-paper transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-terracotta text-bone-white hover:bg-clay disabled:opacity-50 transition-colors"
          >
            {isExporting ? (
              'Exporting...'
            ) : copySuccess ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : selectedFormat === 'share' ? (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InfoCardExport;
