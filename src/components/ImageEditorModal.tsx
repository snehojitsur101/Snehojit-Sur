import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  RotateCw,
  Sliders,
  FileText,
  Copy,
  Check,
  Sun,
  Contrast,
  Droplets,
  Zap,
} from 'lucide-react';
import { DocumentFilter, ScannedImage } from '../types';
import { processImage } from '../utils/imageProcessor';

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
  const [activeTab, setActiveTab] = useState<'adjustments' | 'ocr' | 'ai_meta'>('adjustments');
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

  const handleCopyOcr = async () => {
    if (image.scanResult?.ocrText) {
      await navigator.clipboard.writeText(image.scanResult.ocrText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 lg:p-6 animate-in fade-in select-none">
      <div className="bg-white border border-sky-100 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{image.scanResult?.title || image.name}</span>
                {image.scanResult?.documentType && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                    {image.scanResult.documentType}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Enhance clarity, apply scanner filters, inspect AI OCR & metadata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onScanWithAi(image)}
              disabled={isAiScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500 text-xs font-bold transition-colors shadow-xs shadow-sky-600/20 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiScanning ? 'animate-spin' : ''}`} />
              <span>{isAiScanning ? 'Scanning...' : 'Re-Scan with AI'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Canvas Preview + Right Settings Tabs */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Preview Pane */}
          <div className="flex-1 bg-slate-100/60 p-6 flex items-center justify-center overflow-auto relative border-b md:border-b-0 md:border-r border-sky-100">
            <div className="max-w-full max-h-full flex items-center justify-center relative">
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-xl ring-1 ring-slate-300 bg-white"
                style={{
                  transform: `rotate(${settings.rotation}deg)`,
                }}
              />
            </div>

            {/* Quick Rotate & Reset floating toolbar */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-sky-200 text-xs shadow-md">
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
                onClick={() =>
                  handleUpdateAdjustments({
                    brightness: 0,
                    contrast: 0,
                    saturation: 100,
                    sharpness: 0,
                    filter: 'original',
                    rotation: 0,
                  })
                }
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Right Inspector Tabs */}
          <div className="w-full md:w-96 bg-white flex flex-col h-full overflow-hidden">
            {/* Sub-tabs */}
            <div className="flex border-b border-sky-100 bg-sky-50/40 p-1 text-xs">
              <button
                onClick={() => setActiveTab('adjustments')}
                className={`flex-1 py-2 rounded-xl font-bold text-center transition-all ${
                  activeTab === 'adjustments'
                    ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Filters & Clarity
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`flex-1 py-2 rounded-xl font-bold text-center transition-all ${
                  activeTab === 'ocr'
                    ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OCR Text
              </button>
              <button
                onClick={() => setActiveTab('ai_meta')}
                className={`flex-1 py-2 rounded-xl font-bold text-center transition-all ${
                  activeTab === 'ai_meta'
                    ? 'bg-white text-sky-700 shadow-2xs border border-sky-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Insights
              </button>
            </div>

            {/* Tab 1: Filters & Clarity */}
            {activeTab === 'adjustments' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 bg-slate-50/30">
                {/* Scanner Filter Presets */}
                <div>
                  <label className="font-bold text-slate-900 block mb-2">
                    Document Scanner Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'original', label: 'Original', desc: 'No enhancement' },
                      { id: 'magic_color', label: '✨ Magic Color', desc: 'Whitens bg, rich text' },
                      { id: 'bw_clean', label: '📄 B&W Clean Scan', desc: 'Flatbed high contrast' },
                      { id: 'high_contrast', label: '⚡ High Contrast', desc: 'For faint receipts' },
                      { id: 'sharp_photo', label: '🔍 Sharp Photo', desc: 'Edge enhancement' },
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

                {/* Manual Fine-Tuning Sliders */}
                <div className="border-t border-sky-100 pt-4 space-y-3.5">
                  <span className="font-bold text-slate-900 block">Fine Tone Adjustments</span>

                  {/* Brightness */}
                  <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Brightness</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {settings.brightness}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={settings.brightness}
                      onChange={(e) =>
                        handleUpdateAdjustments({ brightness: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Contrast className="w-3.5 h-3.5 text-sky-700" />
                        <span>Contrast</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {settings.contrast}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={settings.contrast}
                      onChange={(e) =>
                        handleUpdateAdjustments({ contrast: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Saturation</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {settings.saturation}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.saturation}
                      onChange={(e) =>
                        handleUpdateAdjustments({ saturation: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Sharpness */}
                  <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-center text-slate-800 mb-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sharpness</span>
                      </span>
                      <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        {settings.sharpness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpness}
                      onChange={(e) =>
                        handleUpdateAdjustments({ sharpness: Number(e.target.value) })
                      }
                      className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Fit Mode */}
                <div className="border-t border-sky-100 pt-4">
                  <label className="font-bold text-slate-900 block mb-2">Slot Fit Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateAdjustments({ fitMode: 'contain' })}
                      className={`py-2 px-3 rounded-xl border font-bold text-center ${
                        settings.fitMode === 'contain'
                          ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50'
                      }`}
                    >
                      Fit Inside (Contain)
                    </button>
                    <button
                      onClick={() => handleUpdateAdjustments({ fitMode: 'cover' })}
                      className={`py-2 px-3 rounded-xl border font-bold text-center ${
                        settings.fitMode === 'cover'
                          ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50'
                      }`}
                    >
                      Fill Slot (Crop)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: OCR Extracted Text */}
            {activeTab === 'ocr' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
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
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
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

            {/* Tab 3: AI Intelligence & Key Fields */}
            {activeTab === 'ai_meta' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 bg-slate-50/30">
                {/* Quality Gauge */}
                {image.scanResult?.qualityAssessment && (
                  <div className="p-3.5 bg-white rounded-2xl border border-sky-100 shadow-2xs space-y-2">
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

                {/* Key Extracted Fields */}
                <div>
                  <span className="font-bold text-slate-900 block mb-2">
                    Structured Data Fields
                  </span>
                  {image.scanResult?.keyFields && image.scanResult.keyFields.length > 0 ? (
                    <div className="space-y-1.5">
                      {image.scanResult.keyFields.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-sky-100 shadow-2xs"
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

                {/* AI Summary */}
                {image.scanResult?.summary && (
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl">
                    <span className="text-sky-800 font-bold block mb-1">AI Summary</span>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      {image.scanResult.summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Done Button */}
            <div className="p-3.5 bg-white border-t border-sky-100">
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-md shadow-sky-600/20"
              >
                Apply & Back to A4 Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
