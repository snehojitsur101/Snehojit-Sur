import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  Sliders,
  FileText,
  Copy,
  Check,
  Crop,
  Sun,
  Contrast,
  Droplets,
  Zap,
} from 'lucide-react';
import { CropArea, DocumentFilter, ScannedImage } from '../types';
import { processImage } from '../utils/imageProcessor';
import { SmartCropView } from './SmartCropView';

interface ImageEditorModalProps {
  image: ScannedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateImage: (id: string, updates: Partial<ScannedImage>) => void;
  onScanWithAi: (image: ScannedImage) => void;
  isAiScanning: boolean;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  image,
  isOpen,
  onClose,
  onUpdateImage,
  onScanWithAi,
  isAiScanning,
}) => {
  if (!isOpen || !image) return null;

  const [previewUrl, setPreviewUrl] = useState<string>(image.processedUrl || image.originalUrl);
  const [activeTab, setActiveTab] = useState<'crop' | 'adjustments' | 'ocr' | 'ai_meta'>('crop');
  const [copiedText, setCopiedText] = useState(false);

  const settings = image.settings;

  // Re-generate preview in real-time when adjustments change
  useEffect(() => {
    let active = true;
    const updatePreview = async () => {
      try {
        const url = await processImage(image.originalUrl, settings, 1200);
        if (active) {
          setPreviewUrl(url);
          onUpdateImage(image.id, { processedUrl: url });
        }
      } catch (err) {
        console.error('Failed to update live preview:', err);
      }
    };
    updatePreview();
    return () => {
      active = false;
    };
  }, [settings, image.originalUrl]);

  const handleUpdateAdjustments = (delta: Partial<typeof settings>) => {
    onUpdateImage(image.id, {
      settings: {
        ...settings,
        ...delta,
      },
    });
  };

  const handleResetToOriginal = () => {
    onUpdateImage(image.id, {
      settings: {
        brightness: 0,
        contrast: 0,
        saturation: 100,
        sharpness: 0,
        filter: 'original',
        rotation: 0,
        crop: { x: 0, y: 0, width: 1, height: 1 },
        fitMode: 'contain',
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      },
    });
  };

  const handleApplyCrop = (crop: CropArea) => {
    handleUpdateAdjustments({ crop });
    setActiveTab('adjustments');
  };

  const handleResetCrop = () => {
    handleUpdateAdjustments({ crop: { x: 0, y: 0, width: 1, height: 1 } });
  };

  const handleCopyOcr = async () => {
    if (image.scanResult?.ocrText) {
      await navigator.clipboard.writeText(image.scanResult.ocrText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in select-none">
      <div className="bg-white border border-sky-100 w-full max-w-5xl h-[92vh] sm:h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                <span className="truncate">{image.scanResult?.title || image.name}</span>
                {image.scanResult?.documentType && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-bold hidden sm:inline shrink-0">
                    {image.scanResult.documentType}
                  </span>
                )}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Smart crop, scanner filters, clarity enhancement & OCR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onScanWithAi(image)}
              disabled={isAiScanning}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 text-xs font-bold transition-colors shadow-xs shadow-sky-600/20 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAiScanning ? 'Scanning...' : 'Re-Scan with AI'}</span>
              <span className="sm:hidden">Scan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Sub-Navigation Tabs */}
        <div className="flex border-b border-sky-100 bg-sky-50/40 p-1.5 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex items-center justify-center gap-1.5 flex-1 min-w-[100px] py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'crop'
                ? 'bg-white text-sky-700 shadow-2xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Smart Crop & Edges</span>
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex items-center justify-center gap-1.5 flex-1 min-w-[100px] py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'adjustments'
                ? 'bg-white text-sky-700 shadow-2xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Filters & Tone</span>
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center justify-center gap-1.5 flex-1 min-w-[90px] py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'ocr'
                ? 'bg-white text-sky-700 shadow-2xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>OCR Text</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_meta')}
            className={`flex items-center justify-center gap-1.5 flex-1 min-w-[90px] py-2 px-3 rounded-xl font-bold transition-all ${
              activeTab === 'ai_meta'
                ? 'bg-white text-sky-700 shadow-2xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Insights</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* TAB 1: SMART CROP & EDGE DETECTION */}
          {activeTab === 'crop' && (
            <SmartCropView
              imageUrl={image.originalUrl}
              initialCrop={settings.crop}
              onApplyCrop={handleApplyCrop}
              onResetCrop={handleResetCrop}
            />
          )}

          {/* TAB 2: FILTERS & TONE ADJUSTMENTS */}
          {activeTab === 'adjustments' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Live Preview */}
              <div className="flex-1 bg-slate-100/70 p-4 sm:p-6 flex items-center justify-center overflow-auto relative border-b md:border-b-0 md:border-r border-sky-100 min-h-[220px]">
                <img
                  src={previewUrl}
                  alt="Enhanced preview"
                  className="max-h-[30vh] md:max-h-[55vh] max-w-full object-contain rounded-xl shadow-xl ring-1 ring-slate-300 bg-white"
                  style={{
                    transform: `rotate(${settings.rotation}deg)`,
                  }}
                />

                {/* Floating Rotate & Crop button on preview */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-sky-200 text-xs shadow-md">
                  <button
                    onClick={() =>
                      handleUpdateAdjustments({ rotation: (settings.rotation + 90) % 360 })
                    }
                    className="flex items-center gap-1 font-bold text-slate-700 hover:text-sky-700"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                    <span>Rotate 90°</span>
                  </button>
                  <div className="w-px h-3.5 bg-slate-200" />
                  <button
                    onClick={() => setActiveTab('crop')}
                    className="flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Adjust Crop</span>
                  </button>
                </div>
              </div>

              {/* Right Settings */}
              <div className="w-full md:w-96 bg-white flex flex-col overflow-y-auto p-4 space-y-4 text-xs text-slate-700">
                {/* Scanner Mode Presets */}
                <div>
                  <label className="font-bold text-slate-900 block mb-2">
                    Document Scanner Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'original', label: 'Original', desc: 'No enhancement' },
                      { id: 'magic_color', label: '✨ Magic Color', desc: 'Clean white, rich text' },
                      { id: 'bw_clean', label: '📄 B&W Clean Scan', desc: 'Flatbed scanner style' },
                      { id: 'high_contrast', label: '⚡ High Contrast', desc: 'For faint receipts' },
                      { id: 'sharp_photo', label: '🔍 Sharp Photo', desc: 'Edge crispness' },
                      { id: 'faded_fix', label: '💡 Fix Faded', desc: 'Gamma level boost' },
                    ].map((f) => {
                      const isSelected = settings.filter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() =>
                            handleUpdateAdjustments({ filter: f.id as DocumentFilter })
                          }
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50/50 hover:border-sky-300'
                          }`}
                        >
                          <span className="font-bold block">{f.label}</span>
                          <span className="text-[10px] text-slate-500">{f.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine Tone Sliders */}
                <div className="space-y-3 pt-2 border-t border-sky-100">
                  <span className="font-bold text-slate-900 block">Tone Adjustments</span>

                  {/* Brightness */}
                  <div className="p-3 bg-slate-50/60 rounded-2xl border border-sky-100">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Brightness</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600">{settings.brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={settings.brightness}
                      onChange={(e) =>
                        handleUpdateAdjustments({ brightness: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-200/60 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="p-3 bg-slate-50/60 rounded-2xl border border-sky-100">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Contrast className="w-3.5 h-3.5 text-sky-700" />
                        <span>Contrast</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600">{settings.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={settings.contrast}
                      onChange={(e) =>
                        handleUpdateAdjustments({ contrast: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-200/60 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="p-3 bg-slate-50/60 rounded-2xl border border-sky-100">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Saturation</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600">{settings.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.saturation}
                      onChange={(e) =>
                        handleUpdateAdjustments({ saturation: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-200/60 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Sharpness */}
                  <div className="p-3 bg-slate-50/60 rounded-2xl border border-sky-100">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sharpness</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600">{settings.sharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpness}
                      onChange={(e) =>
                        handleUpdateAdjustments({ sharpness: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-200/60 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleResetToOriginal}
                    className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>↺ Reset to Original (100% High Quality)</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-md shadow-sky-600/20"
                  >
                    Apply & Return to A4 Studio
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OCR TEXT */}
          {activeTab === 'ocr' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Transcribed Content</span>
                </span>
                <button
                  onClick={handleCopyOcr}
                  disabled={!image.scanResult?.ocrText}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold border border-sky-200 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {copiedText ? (
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

              <div className="flex-1 min-h-[220px] bg-white border border-sky-200 rounded-2xl p-4 text-xs text-slate-800 font-mono overflow-auto whitespace-pre-wrap leading-relaxed select-text shadow-2xs">
                {image.scanResult?.ocrText || (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-10">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p>No OCR text generated yet.</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Click "Re-Scan with AI" to transcribe text.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI INSIGHTS */}
          {activeTab === 'ai_meta' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-700 bg-slate-50/40">
              {image.scanResult?.qualityAssessment && (
                <div className="p-4 bg-white rounded-2xl border border-sky-150 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Scan Quality Score</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">
                      {image.scanResult.qualityAssessment.sharpness}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          image.scanResult.qualityAssessment.sharpness
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {image.scanResult.qualityAssessment.notes}
                  </p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 block mb-2">
                  Structured Data Fields
                </span>
                {image.scanResult?.keyFields && image.scanResult.keyFields.length > 0 ? (
                  <div className="space-y-1.5">
                    {image.scanResult.keyFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-sky-100 shadow-2xs"
                      >
                        <span className="text-slate-500 font-medium">{field.label}</span>
                        <span className="font-bold text-slate-900 font-mono text-right">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No structured fields detected.</p>
                )}
              </div>

              {image.scanResult?.summary && (
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl">
                  <span className="text-sky-800 font-bold block mb-1">AI Summary</span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {image.scanResult.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
