import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  FileImage,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import { A4SheetSettings, DocumentPage, ScannedImage } from '../types';
import { copyOcrTextToClipboard, exportPageAsImage, exportToPdf } from '../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: DocumentPage[];
  currentPage: DocumentPage;
  imagesMap: Map<string, ScannedImage>;
  allImages: ScannedImage[];
  settings: A4SheetSettings;
  onTriggerPrint: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPage,
  imagesMap,
  allImages,
  settings,
  onTriggerPrint,
}) => {
  if (!isOpen) return null;

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [docName, setDocName] = useState(settings.headerTitle || 'DocuFit_Scanned_A4');
  const [copiedOcr, setCopiedOcr] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const filename = `${docName.trim().replace(/\s+/g, '_') || 'DocuFit_Scanned_A4'}.pdf`;
      await exportToPdf(pages, imagesMap, settings, filename, (current, total) => {
        setPdfProgress({ current, total });
      });
      setIsExportingPdf(false);
      setPdfProgress(null);
      onClose();
    } catch (err) {
      console.error('PDF export failed:', err);
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    const filename = `${docName.trim().replace(/\s+/g, '_')}_Page_${currentPage.pageNumber}.png`;
    await exportPageAsImage(currentPage, imagesMap, settings, 'png', filename);
  };

  const handleDownloadJpg = async () => {
    const filename = `${docName.trim().replace(/\s+/g, '_')}_Page_${currentPage.pageNumber}.jpg`;
    await exportPageAsImage(currentPage, imagesMap, settings, 'jpeg', filename);
  };

  const handleCopyAllOcr = async () => {
    await copyOcrTextToClipboard(allImages);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-white border border-sky-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4.5 border-b border-sky-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Download & Print Studio</h3>
              <p className="text-[11px] text-slate-500">
                Ready for standard A4 printing, archival PDF, or high-res images
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* File Name input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Export File Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Scanned_Invoices_October"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
              <span className="text-xs text-slate-500 font-mono font-medium">.pdf / .png</span>
            </div>
          </div>

          {/* Primary PDF Download Card */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-2xs backdrop-blur-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Multi-Page A4 Document PDF</h4>
                  <p className="text-xs text-sky-100 font-medium">
                    High-Res 300 DPI vector + raster print standard ({pages.length}{' '}
                    {pages.length === 1 ? 'Page' : 'Pages'})
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/20 text-white font-bold backdrop-blur-xs">
                Recommended
              </span>
            </div>

            {/* Progress bar if active */}
            {isExportingPdf && pdfProgress && (
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-[11px] text-sky-100 font-medium">
                  <span>Generating high-res A4 pages...</span>
                  <span>
                    Page {pdfProgress.current} of {pdfProgress.total}
                  </span>
                </div>
                <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{
                      width: `${(pdfProgress.current / pdfProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-sky-700 text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-sky-50 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Building PDF Document...' : 'Download Full PDF Document'}</span>
            </button>
          </div>

          {/* Secondary Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Direct Print */}
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onTriggerPrint(), 200);
              }}
              className="p-4 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50/60 hover:border-sky-300 text-left transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <Printer className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-slate-400 font-medium">Direct</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Print to Paper</span>
                <span className="text-[10px] text-slate-500">Opens printer dialog</span>
              </div>
            </button>

            {/* Download PNG */}
            <button
              onClick={handleDownloadPng}
              className="p-4 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50/60 hover:border-sky-300 text-left transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <FileImage className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-slate-400 font-medium">Page {currentPage.pageNumber}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">High-Res PNG</span>
                <span className="text-[10px] text-slate-500">Lossless 300 DPI image</span>
              </div>
            </button>

            {/* Download JPEG */}
            <button
              onClick={handleDownloadJpg}
              className="p-4 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50/60 hover:border-sky-300 text-left transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <FileImage className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-slate-400 font-medium">Page {currentPage.pageNumber}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Standard JPEG</span>
                <span className="text-[10px] text-slate-500">Compressed photo file</span>
              </div>
            </button>
          </div>

          {/* OCR Transcript Export strip */}
          <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Export OCR Text Transcript
                </span>
                <span className="text-[10px] text-slate-500">
                  Transcribed text from all {allImages.length} documents
                </span>
              </div>
            </div>
            <button
              onClick={handleCopyAllOcr}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-sky-200 transition-colors shadow-2xs"
            >
              {copiedOcr ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
