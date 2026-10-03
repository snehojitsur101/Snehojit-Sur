import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RotateCcw,
  Crop,
  Check,
  Maximize,
  CreditCard,
  FileText,
  Square,
} from 'lucide-react';
import { CropArea } from '../types';
import { autoDetectDocumentEdges } from '../utils/imageProcessor';

interface SmartCropViewProps {
  imageUrl: string;
  initialCrop?: CropArea;
  onApplyCrop: (crop: CropArea) => void;
  onResetCrop: () => void;
}

type HandleType =
  | 'tl'
  | 'tr'
  | 'bl'
  | 'br'
  | 't'
  | 'b'
  | 'l'
  | 'r'
  | 'move';

type AspectRatioMode = 'free' | 'a4' | 'id' | '1:1' | '4:3';

export const SmartCropView: React.FC<SmartCropViewProps> = ({
  imageUrl,
  initialCrop,
  onApplyCrop,
  onResetCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<CropArea>(
    initialCrop || { x: 0.05, y: 0.05, width: 0.9, height: 0.9 }
  );

  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('free');
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropArea } | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [imgDisplayRect, setImgDisplayRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Calculate displayed image bounds within the container
  const updateDisplayRect = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;

    const contW = container.clientWidth;
    const contH = container.clientHeight;
    const naturalW = img.naturalWidth || 800;
    const naturalH = img.naturalHeight || 600;

    const imgAspect = naturalW / naturalH;
    const contAspect = contW / contH;

    let dispW = contW;
    let dispH = contH;
    let dispX = 0;
    let dispY = 0;

    if (imgAspect > contAspect) {
      dispW = contW;
      dispH = contW / imgAspect;
      dispY = (contH - dispH) / 2;
    } else {
      dispH = contH;
      dispW = contH * imgAspect;
      dispX = (contW - dispW) / 2;
    }

    setImgDisplayRect({ x: dispX, y: dispY, width: dispW, height: dispH });
  }, []);

  useEffect(() => {
    updateDisplayRect();
    window.addEventListener('resize', updateDisplayRect);
    return () => window.removeEventListener('resize', updateDisplayRect);
  }, [updateDisplayRect]);

  // Auto-Detect Edges trigger
  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    try {
      const detected = await autoDetectDocumentEdges(imageUrl);
      setCrop(detected);
    } catch (err) {
      console.warn('Auto-detect error:', err);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Aspect ratio enforcer
  const applyAspectRatioLock = (newCrop: CropArea, mode: AspectRatioMode): CropArea => {
    if (mode === 'free' || !imgRef.current) return newCrop;

    const imgNaturalAspect = (imgRef.current.naturalWidth || 800) / (imgRef.current.naturalHeight || 600);
    let targetAspect = 1.0;

    if (mode === 'a4') {
      targetAspect = 1 / 1.4142; // Portrait A4
    } else if (mode === 'id') {
      targetAspect = 85.6 / 54; // Standard ID Card ~1.58
    } else if (mode === '1:1') {
      targetAspect = 1.0;
    } else if (mode === '4:3') {
      targetAspect = 4 / 3;
    }

    // Convert pixel aspect ratio to normalized width/height ratio
    const normalizedAspect = targetAspect / imgNaturalAspect;

    let w = newCrop.width;
    let h = w / normalizedAspect;

    if (h > 1.0) {
      h = 1.0;
      w = h * normalizedAspect;
    }
    if (newCrop.y + h > 1.0) {
      newCrop.y = Math.max(0, 1.0 - h);
    }
    if (newCrop.x + w > 1.0) {
      newCrop.x = Math.max(0, 1.0 - w);
    }

    return {
      x: Math.max(0, newCrop.x),
      y: Math.max(0, newCrop.y),
      width: Math.min(1.0 - newCrop.x, w),
      height: Math.min(1.0 - newCrop.y, h),
    };
  };

  const handleSelectAspect = (mode: AspectRatioMode) => {
    setAspectRatio(mode);
    setCrop((prev) => applyAspectRatioLock(prev, mode));
  };

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStart || imgDisplayRect.width === 0 || imgDisplayRect.height === 0) return;

    const deltaX = (e.clientX - dragStart.x) / imgDisplayRect.width;
    const deltaY = (e.clientY - dragStart.y) / imgDisplayRect.height;
    const orig = dragStart.crop;

    let next = { ...orig };
    const minSize = 0.1;

    switch (activeHandle) {
      case 'move': {
        const maxX = 1.0 - orig.width;
        const maxY = 1.0 - orig.height;
        next.x = Math.max(0, Math.min(maxX, orig.x + deltaX));
        next.y = Math.max(0, Math.min(maxY, orig.y + deltaY));
        break;
      }
      case 'tl': {
        const right = orig.x + orig.width;
        const bottom = orig.y + orig.height;
        next.x = Math.max(0, Math.min(right - minSize, orig.x + deltaX));
        next.y = Math.max(0, Math.min(bottom - minSize, orig.y + deltaY));
        next.width = right - next.x;
        next.height = bottom - next.y;
        break;
      }
      case 'tr': {
        const left = orig.x;
        const bottom = orig.y + orig.height;
        next.y = Math.max(0, Math.min(bottom - minSize, orig.y + deltaY));
        next.width = Math.max(minSize, Math.min(1.0 - left, orig.width + deltaX));
        next.height = bottom - next.y;
        break;
      }
      case 'bl': {
        const right = orig.x + orig.width;
        const top = orig.y;
        next.x = Math.max(0, Math.min(right - minSize, orig.x + deltaX));
        next.width = right - next.x;
        next.height = Math.max(minSize, Math.min(1.0 - top, orig.height + deltaY));
        break;
      }
      case 'br': {
        next.width = Math.max(minSize, Math.min(1.0 - orig.x, orig.width + deltaX));
        next.height = Math.max(minSize, Math.min(1.0 - orig.y, orig.height + deltaY));
        break;
      }
      case 't': {
        const bottom = orig.y + orig.height;
        next.y = Math.max(0, Math.min(bottom - minSize, orig.y + deltaY));
        next.height = bottom - next.y;
        break;
      }
      case 'b': {
        next.height = Math.max(minSize, Math.min(1.0 - orig.y, orig.height + deltaY));
        break;
      }
      case 'l': {
        const right = orig.x + orig.width;
        next.x = Math.max(0, Math.min(right - minSize, orig.x + deltaX));
        next.width = right - next.x;
        break;
      }
      case 'r': {
        next.width = Math.max(minSize, Math.min(1.0 - orig.x, orig.width + deltaX));
        break;
      }
    }

    if (aspectRatio !== 'free' && activeHandle !== 'move') {
      next = applyAspectRatioLock(next, aspectRatio);
    }

    setCrop(next);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setActiveHandle(null);
    setDragStart(null);
  };

  // Convert normalized crop rect to pixel values on screen
  const pixelCrop = {
    left: imgDisplayRect.x + crop.x * imgDisplayRect.width,
    top: imgDisplayRect.y + crop.y * imgDisplayRect.height,
    width: crop.width * imgDisplayRect.width,
    height: crop.height * imgDisplayRect.height,
  };

  return (
    <div className="flex flex-col h-full bg-slate-100/70 select-none">
      {/* Top Toolbar: Aspect Ratio & Auto Detect */}
      <div className="p-3 bg-white border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        {/* Preset Ratios */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Ratio:</span>
          {[
            { id: 'free', label: 'Freeform', icon: <Crop className="w-3 h-3" /> },
            { id: 'a4', label: 'A4 Page', icon: <FileText className="w-3 h-3" /> },
            { id: 'id', label: 'ID Card (85×54)', icon: <CreditCard className="w-3 h-3" /> },
            { id: '1:1', label: '1:1 Square', icon: <Square className="w-3 h-3" /> },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectAspect(r.id as AspectRatioMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                aspectRatio === r.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50/80 hover:bg-sky-100 text-slate-700 border border-sky-200/60'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={isAutoDetecting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 text-white text-xs font-bold shadow-sm shadow-sky-600/20 hover:opacity-90 transition-all disabled:opacity-50"
            title="Auto-detect document corners & edges"
          >
            <Sparkles className={`w-3.5 h-3.5 text-yellow-300 ${isAutoDetecting ? 'animate-spin' : ''}`} />
            <span>{isAutoDetecting ? 'Detecting...' : 'Auto-Detect Edges'}</span>
          </button>

          <button
            onClick={() => {
              setCrop({ x: 0, y: 0, width: 1, height: 1 });
              setAspectRatio('free');
              onResetCrop();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-slate-600 text-xs font-bold border border-slate-200 transition-colors"
            title="Reset crop to full image"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Crop Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center p-4 bg-slate-900/90 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Smart Crop Target"
          onLoad={updateDisplayRect}
          className="max-h-full max-w-full object-contain pointer-events-none rounded shadow-xl"
        />

        {/* Dimmed Overlay outside crop rect */}
        {imgDisplayRect.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${imgDisplayRect.x}px`,
              top: `${imgDisplayRect.y}px`,
              width: `${imgDisplayRect.width}px`,
              height: `${imgDisplayRect.height}px`,
            }}
          >
            {/* Dark Mask Top */}
            <div
              className="absolute bg-black/65 left-0 top-0 right-0"
              style={{ height: `${crop.y * 100}%` }}
            />
            {/* Dark Mask Bottom */}
            <div
              className="absolute bg-black/65 left-0 right-0 bottom-0"
              style={{ height: `${(1.0 - (crop.y + crop.height)) * 100}%` }}
            />
            {/* Dark Mask Left */}
            <div
              className="absolute bg-black/65 left-0"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.height * 100}%`,
                width: `${crop.x * 100}%`,
              }}
            />
            {/* Dark Mask Right */}
            <div
              className="absolute bg-black/65 right-0"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.height * 100}%`,
                width: `${(1.0 - (crop.x + crop.width)) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Interactive Crop Window Box */}
        {imgDisplayRect.width > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${pixelCrop.left}px`,
              top: `${pixelCrop.top}px`,
              width: `${pixelCrop.width}px`,
              height: `${pixelCrop.height}px`,
            }}
            className="border-2 border-sky-400 shadow-2xl ring-1 ring-sky-300/40"
          >
            {/* Draggable Inner Move Area */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              className="w-full h-full cursor-move touch-none bg-sky-500/5 active:bg-sky-500/15 transition-colors"
            >
              {/* 3x3 Rule-of-Thirds Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                <div className="border-r border-b border-sky-300" />
                <div className="border-r border-b border-sky-300" />
                <div className="border-b border-sky-300" />
                <div className="border-r border-b border-sky-300" />
                <div className="border-r border-b border-sky-300" />
                <div className="border-b border-sky-300" />
                <div className="border-r border-sky-300" />
                <div className="border-r border-sky-300" />
                <div />
              </div>
            </div>

            {/* 4 Corner Touch Handles (Extra large 36px touch zone for mobile thumb precision) */}
            {/* Top-Left */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'tl')}
              className="absolute -top-4 -left-4 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-30 group"
            >
              <div className="w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg group-hover:scale-125 transition-transform ring-2 ring-sky-300" />
            </div>

            {/* Top-Right */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'tr')}
              className="absolute -top-4 -right-4 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-30 group"
            >
              <div className="w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg group-hover:scale-125 transition-transform ring-2 ring-sky-300" />
            </div>

            {/* Bottom-Left */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'bl')}
              className="absolute -bottom-4 -left-4 w-9 h-9 flex items-center justify-center cursor-nesw-resize touch-none z-30 group"
            >
              <div className="w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg group-hover:scale-125 transition-transform ring-2 ring-sky-300" />
            </div>

            {/* Bottom-Right */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'br')}
              className="absolute -bottom-4 -right-4 w-9 h-9 flex items-center justify-center cursor-nwse-resize touch-none z-30 group"
            >
              <div className="w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg group-hover:scale-125 transition-transform ring-2 ring-sky-300" />
            </div>

            {/* 4 Edge Midpoint Handles */}
            {/* Top Edge */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 't')}
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize touch-none z-20"
            >
              <div className="w-6 h-2 bg-sky-500 border border-white rounded-full shadow-md" />
            </div>

            {/* Bottom Edge */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'b')}
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize touch-none z-20"
            >
              <div className="w-6 h-2 bg-sky-500 border border-white rounded-full shadow-md" />
            </div>

            {/* Left Edge */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'l')}
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize touch-none z-20"
            >
              <div className="w-2 h-6 bg-sky-500 border border-white rounded-full shadow-md" />
            </div>

            {/* Right Edge */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'r')}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize touch-none z-20"
            >
              <div className="w-2 h-6 bg-sky-500 border border-white rounded-full shadow-md" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Strip */}
      <div className="p-3.5 bg-white border-t border-sky-100 flex items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-slate-500 font-medium">
          Drag corner handles to align document borders
        </div>
        <button
          onClick={() => onApplyCrop(crop)}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Apply Crop to Document</span>
        </button>
      </div>
    </div>
  );
};
