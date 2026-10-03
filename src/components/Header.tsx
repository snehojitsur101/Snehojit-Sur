import React from 'react';
import {
  FileText,
  Printer,
  Download,
  Upload,
  Sparkles,
  RotateCw,
  Undo2,
  Redo2,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderOpen,
} from 'lucide-react';
import { A4SheetSettings } from '../types';

interface HeaderProps {
  settings: A4SheetSettings;
  onUpdateSettings: (newSettings: Partial<A4SheetSettings>) => void;
  onOpenUpload: () => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  onTriggerPrint: () => void;
  onOpenOcrModal: () => void;
  onAiAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isAiLoading: boolean;
  totalImages: number;
  totalPages: number;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenUpload,
  onOpenPresets,
  onOpenExport,
  onTriggerPrint,
  onOpenOcrModal,
  onAiAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isAiLoading,
  totalImages,
  totalPages,
  zoom,
  setZoom,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-sky-100 text-slate-800 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20 ring-1 ring-sky-200">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-900 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                DocuFit AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                A4 Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              AI Scan, Resize & Auto-Fit Documents for Print & PDF
            </p>
          </div>
        </div>

        {/* Center Utilities: Undo/Redo, Orientation, Zoom, Quick AI Auto-Arrange */}
        <div className="hidden md:flex items-center gap-2 bg-sky-50/80 p-1 rounded-xl border border-sky-150">
          {/* Undo & Redo Buttons */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-sky-100 shadow-2xs">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
              title="Undo last change (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Undo</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
              title="Redo change (Ctrl+Y / ⌘⇧Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Redo</span>
            </button>
          </div>

          <div className="w-px h-4 bg-sky-200 mx-0.5" />

          {/* Orientation Toggle */}
          <button
            onClick={() =>
              onUpdateSettings({
                orientation: settings.orientation === 'portrait' ? 'landscape' : 'portrait',
              })
            }
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-white text-slate-700 hover:text-sky-700 transition-all"
            title="Toggle Portrait / Landscape"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-600" />
            <span>{settings.orientation === 'portrait' ? 'Portrait A4' : 'Landscape A4'}</span>
          </button>

          <div className="w-px h-4 bg-sky-200 mx-0.5" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1 rounded-md hover:bg-white text-slate-600 hover:text-sky-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono font-semibold text-[11px] text-sky-900">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(1))))}
              className="p-1 rounded-md hover:bg-white text-slate-600 hover:text-sky-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded-md hover:bg-white text-slate-600 hover:text-sky-700"
              title="Reset 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-sky-200 mx-0.5" />

          {/* AI Auto-Arrange Button */}
          <button
            onClick={onAiAutoLayout}
            disabled={isAiLoading || totalImages === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 shadow-xs shadow-sky-600/20 transition-all disabled:opacity-50"
            title="AI scans documents and auto-selects optimal A4 arrangement"
          >
            <Sparkles className={`w-3.5 h-3.5 text-sky-200 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>AI Auto-Fit</span>
          </button>
        </div>

        {/* Right Actions: Samples, Upload, OCR Text, Print, Export */}
        <div className="flex items-center gap-2">
          {/* Sample Templates Button */}
          <button
            onClick={onOpenPresets}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Packs</span>
          </button>

          {/* OCR Transcript Button */}
          {totalImages > 0 && (
            <button
              onClick={onOpenOcrModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 transition-colors shadow-2xs"
              title="View & copy extracted OCR text"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>OCR Text</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Upload ({totalImages})</span>
          </button>

          {/* Print Button */}
          <button
            onClick={onTriggerPrint}
            disabled={totalImages === 0}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 transition-colors disabled:opacity-50 shadow-2xs"
            title="Open browser print dialog"
          >
            <Printer className="w-3.5 h-3.5 text-sky-700" />
            <span>Print</span>
          </button>

          {/* Download PDF / Export */}
          <button
            onClick={onOpenExport}
            disabled={totalImages === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
