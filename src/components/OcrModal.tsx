import React, { useState } from 'react';
import { X, FileCode, Copy, Check, Download, FileText } from 'lucide-react';
import { ScannedImage } from '../types';
import { copyOcrTextToClipboard } from '../utils/exporter';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ScannedImage[];
}

export const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose, images }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const handleCopyAll = async () => {
    await copyOcrTextToClipboard(images);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = async () => {
    const text = await copyOcrTextToClipboard(images);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DocuFit_Extracted_OCR_Text.txt';
    link.click();
  };

  const currentDoc = images[selectedIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="bg-white border border-sky-100 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4.5 border-b border-sky-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI OCR Text Extraction Studio</h3>
              <p className="text-[11px] text-slate-500">
                Transcribed text & structured fields extracted by Gemini Vision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-sky-50 text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Download .txt</span>
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>All Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All ({images.length})</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left doc selector list */}
          <div className="w-64 bg-slate-50/70 border-r border-sky-100 p-3 overflow-y-auto space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
              Select Document
            </span>
            {images.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left p-2.5 rounded-2xl text-xs font-medium transition-all ${
                  selectedIdx === idx
                    ? 'bg-white border-2 border-sky-500 text-sky-900 shadow-sm'
                    : 'bg-white/60 border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate font-bold text-slate-800">
                    {doc.scanResult?.title || doc.name}
                  </span>
                  <span className="text-[10px] font-mono opacity-70 font-bold">#{idx + 1}</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  {doc.scanResult?.documentType || 'Document'}
                </span>
              </button>
            ))}
          </div>

          {/* Right OCR Content Display */}
          <div className="flex-1 bg-white p-6 overflow-y-auto space-y-4">
            {currentDoc ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentDoc.scanResult?.title || currentDoc.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Category: {currentDoc.scanResult?.documentType || 'Document'}
                      {currentDoc.scanResult?.dateDetected && ` • Date: ${currentDoc.scanResult.dateDetected}`}
                    </p>
                  </div>
                  {currentDoc.scanResult?.ocrText && (
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(currentDoc.scanResult?.ocrText || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Current</span>
                    </button>
                  )}
                </div>

                {/* Extracted text box */}
                <div className="bg-sky-50/40 border border-sky-200 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text max-h-[340px] overflow-auto shadow-2xs">
                  {currentDoc.scanResult?.ocrText || (
                    <span className="text-slate-400 italic">No text extracted for this document.</span>
                  )}
                </div>

                {/* Structured Fields */}
                {currentDoc.scanResult?.keyFields && currentDoc.scanResult.keyFields.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900">
                      Key Structured Fields
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {currentDoc.scanResult.keyFields.map((f, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl bg-sky-50/40 border border-sky-150 text-xs shadow-2xs"
                        >
                          <span className="text-[10px] text-slate-500 font-medium block">{f.label}</span>
                          <span className="font-bold text-slate-900">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No document selected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
