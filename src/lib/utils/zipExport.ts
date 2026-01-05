import JSZip from 'jszip';
import type { ColorVariant } from '@/types/artifact';

export async function exportVariantsAsZip(
  variants: ColorVariant[],
  artifactName: string
): Promise<void> {
  const zip = new JSZip();

  // Add each variant image
  for (const variant of variants) {
    const filename = `${variant.colorScheme}-${variant.id.slice(0, 8)}.png`;
    zip.file(filename, variant.blob);
  }

  // Add metadata JSON
  const metadata = variants.map(v => ({
    filename: `${v.colorScheme}-${v.id.slice(0, 8)}.png`,
    colorScheme: v.colorScheme,
    prompt: v.prompt,
    aiModel: v.aiModel,
    createdAt: v.createdAt.toISOString(),
  }));
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${artifactName}-color-variants.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revocation to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Also export a function to download a single variant
export function downloadVariant(variant: ColorVariant, artifactName: string): void {
  const filename = `${artifactName}-${variant.colorScheme}.png`;
  const url = URL.createObjectURL(variant.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revocation to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
