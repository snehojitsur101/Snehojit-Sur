import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCw,
  Sliders,
  Trash2,
  Plus,
} from 'lucide-react';
import { A4SheetSettings, DocumentPage, ScannedImage } from '../types';
import { calculateSlotRects, renderA4PageToCanvas, SlotRect } from '../utils/pageRenderer';

interface A4SheetCanvasProps {
  page: DocumentPage;
  imagesMap: Map<string, ScannedImage>;
  allImages: ScannedImage[];
  settings: A4SheetSettings;
  zoom: number;
  selectedSlotIndex: number | null;
  onSelectSlot: (slotIndex: number | null) => void;
  onAssignImageToSlot: (slotIndex: number, imageId: string | null) => void;
  onRotateSlotImage: (slotIndex: number) => void;
  onOpenEditorForSlot: (slotIndex: number) => void;
  onOpenUpload: () => void;
}

export const A4SheetCanvas: React.FC<A4SheetCanvasProps> = ({
  page,
  imagesMap,
  allImages,
  settings,
  zoom,
  selectedSlotIndex,
  onSelectSlot,
  onAssignImageToSlot,
  onRotateSlotImage,
  onOpenEditorForSlot,
  onOpenUpload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slotRects, setSlotRects] = useState<SlotRect[]>([]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const isLandscape = settings.orientation === 'landscape';
  const baseW = isLandscape ? 1123 : 794;
  const baseH = isLandscape ? 794 : 1123;

  // Render Canvas when dependencies change
  useEffect(() => {
    let active = true;

    const doRender = async () => {
      try {
        const rendered = await renderA4PageToCanvas(page, imagesMap, settings, 1.5);
        if (!active) return;

        const targetCanvas = canvasRef.current;
        if (targetCanvas) {
          targetCanvas.width = rendered.width;
          targetCanvas.height = rendered.height;
          const ctx = targetCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(rendered, 0, 0);
          }
        }

        // Calculate slot rectangles relative to base dimensions for overlays
        const marginPx = Math.round(settings.marginMm * 3.78);
        const gapPx = settings.gapPx;
        let topOffset = marginPx;
        let bottomOffset = marginPx;

        if (settings.showHeader && (settings.headerTitle || settings.headerSubtitle)) {
          topOffset += 44 + 8;
        }
        if (settings.showFooter) {
          bottomOffset += 28 + 4;
        }

        const contentRect = {
          x: marginPx,
          y: topOffset,
          width: Math.max(10, baseW - marginPx * 2),
          height: Math.max(10, baseH - topOffset - bottomOffset),
        };

        const rects = calculateSlotRects(page.layout, page.slots.length, contentRect, gapPx);
        setSlotRects(rects);
      } catch (err) {
        console.error('Error rendering A4 canvas:', err);
      }
    };

    doRender();

    return () => {
      active = false;
    };
  }, [page, imagesMap, settings]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-sky-50/40 flex flex-col items-center justify-start p-6 lg:p-10 select-none relative"
      onClick={() => onSelectSlot(null)}
    >
      {/* Paper Dimension & Margin Badge */}
      <div className="mb-4 flex items-center gap-3 text-[11px] font-medium text-slate-600 bg-white/95 px-3.5 py-1.5 rounded-full border border-sky-200 shadow-xs backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sky-900">ISO 216 A4 Paper</span>
        </span>
        <span className="text-slate-300">•</span>
        <span>{isLandscape ? '297 × 210 mm (Landscape)' : '210 × 297 mm (Portrait)'}</span>
        <span className="text-slate-300">•</span>
        <span className="font-mono font-bold text-sky-700">Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      {/* The Printable A4 Sheet container */}
      <div
        id="printable-a4-sheet"
        className="relative transition-all duration-200"
        style={{
          width: `${baseW * zoom}px`,
          height: `${baseH * zoom}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real paper shadow & border */}
        <div
          className="absolute inset-0 bg-white rounded-[2px] shadow-xl shadow-sky-900/10 ring-1 ring-slate-300/80 overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${baseW}px`,
            height: `${baseH}px`,
          }}
        >
          {/* Underlying Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: `${baseW}px`, height: `${baseH}px` }}
          />

          {/* Interactive Slot Overlays (Hover & Click tools) */}
          {slotRects.map((slot, sIdx) => {
            const imageId = page.slots[sIdx];
            const doc = imageId ? imagesMap.get(imageId) : null;
            const isHovered = hoveredSlot === sIdx;
            const isSelected = selectedSlotIndex === sIdx;

            return (
              <div
                key={sIdx}
                style={{
                  position: 'absolute',
                  left: `${slot.x}px`,
                  top: `${slot.y}px`,
                  width: `${slot.width}px`,
                  height: `${slot.height}px`,
                }}
                onMouseEnter={() => setHoveredSlot(sIdx)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSlot(sIdx);
                }}
                className={`group transition-all rounded-sm cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-sky-500 ring-offset-1 bg-sky-500/10'
                    : isHovered
                    ? 'ring-2 ring-sky-400/80 bg-sky-400/5'
                    : ''
                }`}
              >
                {/* Floating Slot Toolbar when Hovered or Selected */}
                {(isHovered || isSelected) && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur text-slate-800 p-1 rounded-xl shadow-lg border border-sky-200 animate-in fade-in duration-150">
                    {doc ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRotateSlotImage(sIdx);
                          }}
                          className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditorForSlot(sIdx);
                          }}
                          className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                          title="Fine-Tune Filters & OCR"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignImageToSlot(sIdx, null);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Clear Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allImages.length > 0) {
                            onAssignImageToSlot(sIdx, allImages[0].id);
                          } else {
                            onOpenUpload();
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Doc</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Empty Slot Helper Placeholder */}
                {!doc && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5 border border-sky-200 shadow-2xs">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">
                      Slot {sIdx + 1}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">Click to assign document</span>
                  </div>
                )}

                {/* Slot Tag on bottom-left */}
                {doc && isHovered && (
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200 pointer-events-none truncate max-w-[200px] shadow-2xs">
                    {doc.scanResult?.title || doc.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
