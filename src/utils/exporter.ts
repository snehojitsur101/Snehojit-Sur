import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { A4SheetSettings, DocumentPage, ScannedImage } from '../types';
import { renderA4PageToCanvas } from './pageRenderer';

/**
 * Fires celebration confetti
 */
export function triggerSuccessConfetti() {
  confetti({
    particleCount: 65,
    spread: 60,
    origin: { y: 0.8 },
  });
}

/**
 * Generates and downloads a multi-page A4 PDF
 */
export async function exportToPdf(
  pages: DocumentPage[],
  images: Map<string, ScannedImage>,
  settings: A4SheetSettings,
  fileName = 'DocuFit_Scanned_A4.pdf',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const isLandscape = settings.orientation === 'landscape';
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const total = pages.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    if (i > 0) {
      pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    const page = pages[i];
    // High DPI canvas rendering (1200 x 1700 approx for crisp 300DPI)
    const pageCanvas = await renderA4PageToCanvas(page, images, settings, 2.0);
    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);

    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  pdf.save(fileName);
  triggerSuccessConfetti();
}

/**
 * Downloads a specific page as high-res PNG / JPEG
 */
export async function exportPageAsImage(
  page: DocumentPage,
  images: Map<string, ScannedImage>,
  settings: A4SheetSettings,
  format: 'png' | 'jpeg' = 'png',
  fileName?: string
): Promise<void> {
  const canvas = await renderA4PageToCanvas(page, images, settings, 2.5);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mime, 0.95);

  const name = fileName || `A4_Page_${page.pageNumber}.${format === 'png' ? 'png' : 'jpg'}`;
  const link = document.createElement('a');
  link.download = name;
  link.href = dataUrl;
  link.click();
  triggerSuccessConfetti();
}

/**
 * Copies all OCR text to clipboard
 */
export async function copyOcrTextToClipboard(images: ScannedImage[]): Promise<string> {
  let combined = '=== DOCUFIT AI EXTRACTED OCR TEXT ===\n\n';

  images.forEach((img, index) => {
    combined += `--- [Document ${index + 1}: ${img.scanResult?.title || img.name}] ---\n`;
    if (img.scanResult?.documentType) {
      combined += `Category: ${img.scanResult.documentType}\n`;
    }
    if (img.scanResult?.dateDetected) {
      combined += `Date: ${img.scanResult.dateDetected}\n`;
    }
    if (img.scanResult?.referenceNumber) {
      combined += `Reference/ID: ${img.scanResult.referenceNumber}\n`;
    }
    if (img.scanResult?.summary) {
      combined += `Summary: ${img.scanResult.summary}\n`;
    }
    combined += '\nExtracted Content:\n';
    combined += (img.scanResult?.ocrText || 'No text extracted') + '\n\n';
  });

  await navigator.clipboard.writeText(combined);
  return combined;
}
