import React from 'react';
import {
  FileText,
  RotateCw,
  Sparkles,
  Trash2,
  Plus,
  Sliders,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { DocumentFilter, ScannedImage } from '../types';

interface DocumentTrayProps {
  images: ScannedImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onOpenUpload: () => void;
  onOpenPresets: () => void;
  onOpenEditor: (image: ScannedImage) => void;
  onDeleteImage: (id: string) => void;
  onRotateImage: (id: string) => void;
  onChangeFilter: (id: string, filter: DocumentFilter) => void;
  onScanWithAi: (image: ScannedImage) => void;
}

export const DocumentTray: React.FC<DocumentTrayProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onOpenUpload,
  onOpenPresets,
  onOpenEditor,
  onDeleteImage,
  onRotateImage,
  onChangeFilter,
  onScanWithAi,
}) => {
  return (
    <div className="w-80 bg-white border-r border-sky-100 flex flex-col h-full overflow-hidden select-none shadow-xs">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/40">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Documents ({images.length})</span>
          </h2>
          <p className="text-[11px] text-slate-500">Manage, rotate & enhance scans</p>
        </div>
        <button
          onClick={onOpenUpload}
          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm shadow-sky-600/20 transition-colors"
          title="Upload more documents"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
        {images.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-sky-200 bg-white rounded-2xl shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-3 border border-sky-100">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No documents uploaded</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload 1 to 4+ photos, receipts, or documents to auto-fit into A4.
            </p>
            <div className="space-y-2">
              <button
                onClick={onOpenUpload}
                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-sky-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Documents</span>
              </button>
              <button
                onClick={onOpenPresets}
                className="w-full py-1.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 transition-colors"
              >
                ⚡ Load Sample Pack
              </button>
            </div>
          </div>
        ) : (
          images.map((doc, idx) => {
            const isSelected = selectedImageId === doc.id;
            const isScanning = doc.status === 'scanning';

            return (
              <div
                key={doc.id}
                onClick={() => onSelectImage(doc.id)}
                className={`group relative rounded-2xl border p-2.5 transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                    : 'bg-white border-sky-100/90 hover:bg-sky-50/40 hover:border-sky-300'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/80 flex items-center justify-center group-hover:border-sky-300">
                    <img
                      src={doc.processedUrl || doc.originalUrl}
                      alt={doc.name}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${doc.settings.rotation}deg)`,
                      }}
                    />
                    <span className="absolute top-1 left-1 bg-white/95 text-sky-900 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md shadow-2xs border border-sky-100">
                      #{idx + 1}
                    </span>
                    {isScanning && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-[9px] text-sky-600 font-bold">
                        <Sparkles className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Scanning</span>
                      </div>
                    )}
                  </div>

                  {/* Info & Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-700 transition-colors"
                          title={doc.scanResult?.title || doc.name}
                        >
                          {doc.scanResult?.title || doc.name}
                        </h4>
                        {doc.status === 'scanned' && (
                          <span
                            className="flex-shrink-0 flex items-center text-[10px] text-emerald-600"
                            title="AI Scanned & OCR Complete"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* AI Classification Tag */}
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200/80 truncate max-w-[130px]">
                          {doc.scanResult?.documentType || 'Document'}
                        </span>
                        {doc.scanResult?.dateDetected && (
                          <span className="text-[9px] text-slate-500 font-medium truncate max-w-[80px]">
                            {doc.scanResult.dateDetected}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Filter Presets Quick Strip */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-sky-100 pt-1.5">
                      <select
                        value={doc.settings.filter}
                        onChange={(e) => {
                          e.stopPropagation();
                          onChangeFilter(doc.id, e.target.value as DocumentFilter);
                        }}
                        className="bg-white text-slate-800 text-[11px] font-medium rounded-lg px-2 py-0.5 border border-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                      >
                        <option value="original">Original</option>
                        <option value="magic_color">✨ Magic Color</option>
                        <option value="bw_clean">📄 B&W Clean Scan</option>
                        <option value="high_contrast">⚡ High Contrast</option>
                        <option value="sharp_photo">🔍 Sharp Photo</option>
                        <option value="faded_fix">💡 Fix Faded</option>
                      </select>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRotateImage(doc.id);
                          }}
                          className="p-1 rounded-md hover:bg-sky-100 text-slate-500 hover:text-sky-700 transition-colors"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditor(doc);
                          }}
                          className="p-1 rounded-md hover:bg-sky-100 text-slate-500 hover:text-sky-700 transition-colors"
                          title="Open Fine-Tune Editor & OCR"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(doc.id);
                          }}
                          className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Key highlight pill if any */}
                {doc.scanResult?.summary && (
                  <p className="mt-2 text-[10px] text-slate-600 bg-sky-50/70 px-2.5 py-1 rounded-lg border border-sky-150 line-clamp-1">
                    <span className="text-sky-700 font-bold">AI: </span>
                    {doc.scanResult.summary}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-white border-t border-sky-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-sky-700">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Gemini OCR Active</span>
        </span>
        <span className="font-mono font-semibold text-slate-700">{images.length} / 12 items</span>
      </div>
    </div>
  );
};
