import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  FileImage,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { SampleDocumentPreset } from '../types';
import { SAMPLE_PRESETS } from '../utils/sampleData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  onLoadPreset: (preset: SampleDocumentPreset) => void;
  autoEnhance: boolean;
  setAutoEnhance: (val: boolean) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  onLoadPreset,
  autoEnhance,
  setAutoEnhance,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-white border border-sky-100 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4.5 border-b border-sky-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Documents & Images</h3>
              <p className="text-[11px] text-slate-500">
                Upload 1 to 4+ photos/scans or load instant sample document packs
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-50/80 scale-[0.99]'
                : 'border-sky-200 bg-sky-50/30 hover:bg-sky-50 hover:border-sky-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 shadow-2xs ring-4 ring-sky-50">
              <FileImage className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Click to browse or drop photos & documents here
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mb-3">
              Supports JPEG, PNG, WEBP, Receipts, ID Cards, Medical Prescriptions, Certificates
            </p>
            <span className="text-[11px] px-3.5 py-1 rounded-full bg-white text-sky-800 border border-sky-200 font-bold shadow-2xs">
              Upload multiple images at once (1 to 12 files)
            </span>
          </div>

          {/* Auto Enhance Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  AI Auto-Scan & Document Clarification
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically extracts OCR text, categorizes documents, and boosts white background clarity
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoEnhance}
              onChange={(e) => setAutoEnhance(e.target.checked)}
              className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
            />
          </div>

          {/* 1-Click Demo / Sample Packs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>One-Click Instant Sample Packs</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Try with realistic demo files</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onLoadPreset(preset);
                    onClose();
                  }}
                  className="group flex flex-col items-start p-4 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50/60 hover:border-sky-300 transition-all text-left shadow-2xs hover:shadow-md"
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 mb-2">
                    {preset.badge}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors mb-1 line-clamp-1">
                    {preset.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                    {preset.description}
                  </p>
                  <div className="mt-auto flex items-center gap-1 text-[11px] font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Load Pack</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
