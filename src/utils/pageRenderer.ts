import { A4SheetSettings, BorderStyle, DocumentPage, PageLayoutType, ScannedImage } from '../types';
import { loadImage, processImage } from './imageProcessor';

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

/**
 * Calculates slot bounding boxes inside printable content rect
 */
export function calculateSlotRects(
  layout: PageLayoutType,
  capacity: number,
  contentRect: { x: number; y: number; width: number; height: number },
  gapPx: number
): SlotRect[] {
  const { x, y, width: W, height: H } = contentRect;
  const rects: SlotRect[] = [];

  switch (layout) {
    case 'single_fit': {
      rects.push({ x, y, width: W, height: H, index: 0 });
      break;
    }

    case 'split_vertical': {
      const colW = (W - gapPx) / 2;
      rects.push(
        { x, y, width: colW, height: H, index: 0 },
        { x: x + colW + gapPx, y, width: colW, height: H, index: 1 }
      );
      break;
    }

    case 'split_horizontal': {
      const rowH = (H - gapPx) / 2;
      rects.push(
        { x, y, width: W, height: rowH, index: 0 },
        { x, y: y + rowH + gapPx, width: W, height: rowH, index: 1 }
      );
      break;
    }

    case 'id_duo': {
      // 2 ID cards centered on A4 paper with standard ID ratio ~1.58
      const targetCardW = Math.min(W * 0.85, 480);
      const targetCardH = targetCardW / 1.58;
      const totalCardsH = targetCardH * 2 + gapPx * 2;
      const startY = y + Math.max(0, (H - totalCardsH) / 2);
      const startX = x + (W - targetCardW) / 2;

      rects.push(
        { x: startX, y: startY, width: targetCardW, height: targetCardH, index: 0 },
        {
          x: startX,
          y: startY + targetCardH + gapPx * 2,
          width: targetCardW,
          height: targetCardH,
          index: 1,
        }
      );
      break;
    }

    case 'hero_top_2_bottom': {
      const topH = (H - gapPx) * 0.52;
      const botH = H - gapPx - topH;
      const colW = (W - gapPx) / 2;
      rects.push(
        { x, y, width: W, height: topH, index: 0 },
        { x, y: y + topH + gapPx, width: colW, height: botH, index: 1 },
        { x: x + colW + gapPx, y: y + topH + gapPx, width: colW, height: botH, index: 2 }
      );
      break;
    }

    case 'hero_left_2_right': {
      const leftW = (W - gapPx) * 0.55;
      const rightW = W - gapPx - leftW;
      const rowH = (H - gapPx) / 2;
      rects.push(
        { x, y, width: leftW, height: H, index: 0 },
        { x: x + leftW + gapPx, y, width: rightW, height: rowH, index: 1 },
        { x: x + leftW + gapPx, y: y + rowH + gapPx, width: rightW, height: rowH, index: 2 }
      );
      break;
    }

    case 'tri_column': {
      const colW = (W - gapPx * 2) / 3;
      for (let i = 0; i < 3; i++) {
        rects.push({ x: x + i * (colW + gapPx), y, width: colW, height: H, index: i });
      }
      break;
    }

    case 'tri_row': {
      const rowH = (H - gapPx * 2) / 3;
      for (let i = 0; i < 3; i++) {
        rects.push({ x, y: y + i * (rowH + gapPx), width: W, height: rowH, index: i });
      }
      break;
    }

    case 'grid_2x2': {
      const colW = (W - gapPx) / 2;
      const rowH = (H - gapPx) / 2;
      rects.push(
        { x, y, width: colW, height: rowH, index: 0 },
        { x: x + colW + gapPx, y, width: colW, height: rowH, index: 1 },
        { x, y: y + rowH + gapPx, width: colW, height: rowH, index: 2 },
        { x: x + colW + gapPx, y: y + rowH + gapPx, width: colW, height: rowH, index: 3 }
      );
      break;
    }

    case 'hero_left_3_right': {
      const leftW = (W - gapPx) * 0.55;
      const rightW = W - gapPx - leftW;
      const rowH = (H - gapPx * 2) / 3;
      rects.push(
        { x, y, width: leftW, height: H, index: 0 },
        { x: x + leftW + gapPx, y, width: rightW, height: rowH, index: 1 },
        { x: x + leftW + gapPx, y: y + (rowH + gapPx), width: rightW, height: rowH, index: 2 },
        { x: x + leftW + gapPx, y: y + (rowH + gapPx) * 2, width: rightW, height: rowH, index: 3 }
      );
      break;
    }

    case 'quad_horizontal': {
      const rowH = (H - gapPx * 3) / 4;
      for (let i = 0; i < 4; i++) {
        rects.push({ x, y: y + i * (rowH + gapPx), width: W, height: rowH, index: i });
      }
      break;
    }

    case 'passport_grid': {
      const cols = 2;
      const rows = 3;
      const colW = (W - gapPx * (cols - 1)) / cols;
      const rowH = (H - gapPx * (rows - 1)) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          rects.push({
            x: x + c * (colW + gapPx),
            y: y + r * (rowH + gapPx),
            width: colW,
            height: rowH,
            index: r * cols + c,
          });
        }
      }
      break;
    }

    default: {
      rects.push({ x, y, width: W, height: H, index: 0 });
    }
  }

  return rects;
}

/**
 * Draws border style around an image slot
 */
function drawSlotBorder(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  style: BorderStyle,
  scale: number
) {
  if (style === 'none') return;

  ctx.save();
  if (style === 'subtle') {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'solid_black') {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(2, 2 * scale);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'dashed_cut') {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(1.5, 1.5 * scale);
    ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  } else if (style === 'rounded') {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(1.5, 1.5 * scale);
    const radius = 10 * scale;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders an entire A4 page to an HTML5 Canvas
 */
export async function renderA4PageToCanvas(
  page: DocumentPage,
  imagesMap: Map<string, ScannedImage>,
  settings: A4SheetSettings,
  scale = 1.0
): Promise<HTMLCanvasElement> {
  const isLandscape = settings.orientation === 'landscape';

  // Base A4 dimensions in px (794 x 1123 is standard 96 DPI A4, scaled by `scale`)
  const baseW = isLandscape ? 1123 : 794;
  const baseH = isLandscape ? 794 : 1123;

  const canvasW = Math.round(baseW * scale);
  const canvasH = Math.round(baseH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background
  ctx.fillStyle = settings.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Margins in px (1 mm ≈ 3.78 px at 96 DPI)
  const marginPx = Math.round(settings.marginMm * 3.78 * scale);
  const gapPx = Math.round(settings.gapPx * scale);

  let topOffset = marginPx;
  let bottomOffset = marginPx;

  // 1. Draw Header if enabled
  if (settings.showHeader && (settings.headerTitle || settings.headerSubtitle)) {
    const headerH = Math.round(44 * scale);
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(14 * scale)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(settings.headerTitle, marginPx, topOffset + 18 * scale);

    if (settings.headerSubtitle) {
      ctx.fillStyle = '#64748b';
      ctx.font = `${Math.round(10 * scale)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(settings.headerSubtitle, marginPx, topOffset + 34 * scale);
    }

    if (settings.showDate) {
      ctx.fillStyle = '#64748b';
      ctx.font = `${Math.round(10 * scale)}px system-ui, -apple-system, sans-serif`;
      const dateStr = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      ctx.textAlign = 'right';
      ctx.fillText(dateStr, canvasW - marginPx, topOffset + 18 * scale);
    }

    // Header divider line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.beginPath();
    ctx.moveTo(marginPx, topOffset + headerH);
    ctx.lineTo(canvasW - marginPx, topOffset + headerH);
    ctx.stroke();

    ctx.restore();
    topOffset += headerH + Math.round(8 * scale);
  }

  // 2. Draw Footer if enabled
  if (settings.showFooter) {
    const footerH = Math.round(28 * scale);
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.beginPath();
    ctx.moveTo(marginPx, canvasH - bottomOffset - footerH);
    ctx.lineTo(canvasW - marginPx, canvasH - bottomOffset - footerH);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.round(9 * scale)}px system-ui, -apple-system, sans-serif`;
    if (settings.footerText) {
      ctx.fillText(settings.footerText, marginPx, canvasH - bottomOffset - 8 * scale);
    }

    if (settings.showPageNumber) {
      ctx.textAlign = 'right';
      ctx.fillText(`Page ${page.pageNumber}`, canvasW - marginPx, canvasH - bottomOffset - 8 * scale);
    }
    ctx.restore();

    bottomOffset += footerH + Math.round(4 * scale);
  }

  // Content Area
  const contentRect = {
    x: marginPx,
    y: topOffset,
    width: Math.max(10, canvasW - marginPx * 2),
    height: Math.max(10, canvasH - topOffset - bottomOffset),
  };

  // Calculate Slots
  const slotRects = calculateSlotRects(page.layout, page.slots.length, contentRect, gapPx);

  // Render each image in its slot
  for (let sIdx = 0; sIdx < slotRects.length; sIdx++) {
    const slot = slotRects[sIdx];
    const imageId = page.slots[sIdx];

    if (!imageId) {
      // Empty placeholder slot
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.lineWidth = Math.max(1, 1 * scale);
      ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(11 * scale)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Slot ${sIdx + 1} (Empty)`, slot.x + slot.width / 2, slot.y + slot.height / 2);
      ctx.restore();
      continue;
    }

    const doc = imagesMap.get(imageId);
    if (!doc) continue;

    try {
      // Render processed image data url or fallback to original lossless
      let processedUrl = doc.originalUrl;
      try {
        processedUrl = await processImage(doc.originalUrl, doc.settings, 4096);
      } catch (e) {
        console.warn('Filter processing fallback to original:', e);
        processedUrl = doc.originalUrl;
      }
      
      const img = await loadImage(processedUrl);

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const imgAspect = naturalW / naturalH;
      const slotAspect = slot.width / slot.height;

      const fitMode = doc.settings.fitMode || 'contain';

      let drawW = slot.width;
      let drawH = slot.height;
      let drawX = slot.x;
      let drawY = slot.y;

      if (fitMode === 'contain') {
        if (imgAspect > slotAspect) {
          drawW = slot.width;
          drawH = slot.width / imgAspect;
          drawY = slot.y + (slot.height - drawH) / 2;
        } else {
          drawH = slot.height;
          drawW = slot.height * imgAspect;
          drawX = slot.x + (slot.width - drawW) / 2;
        }
      }

      // Clip inside slot
      ctx.save();
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
      ctx.clip();

      if (settings.borderStyle === 'shadow') {
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetY = 3 * scale;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Draw border
      drawSlotBorder(ctx, { x: drawX, y: drawY, width: drawW, height: drawH }, settings.borderStyle, scale);

      // If ID Duo mode, draw center dashed cutline if enabled
      if (page.layout === 'id_duo' && sIdx === 0 && settings.showCutGuides) {
        ctx.save();
        const nextSlot = slotRects[1];
        if (nextSlot) {
          const cutY = (slot.y + slot.height + nextSlot.y) / 2;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = Math.max(1, 1 * scale);
          ctx.setLineDash([6 * scale, 4 * scale]);
          ctx.beginPath();
          ctx.moveTo(marginPx, cutY);
          ctx.lineTo(canvasW - marginPx, cutY);
          ctx.stroke();

          // Little scissor icon/text
          ctx.fillStyle = '#64748b';
          ctx.font = `${Math.round(9 * scale)}px monospace`;
          ctx.fillText('✂ FOLD OR CUT HERE', marginPx + 10 * scale, cutY - 3 * scale);
        }
        ctx.restore();
      }
    } catch (err) {
      console.error('Failed to draw image into slot:', err);
    }
  }

  // 3. Draw Watermark if present
  if (settings.watermarkText && settings.watermarkOpacity > 0) {
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((-35 * Math.PI) / 180);
    ctx.font = `bold ${Math.round(48 * scale)}px sans-serif`;
    ctx.fillStyle = `rgba(15, 23, 42, ${settings.watermarkOpacity / 100})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(settings.watermarkText.toUpperCase(), 0, 0);
    ctx.restore();
  }

  // 4. Draw Cut Marks / Crosshairs if enabled
  if (settings.showCutGuides && settings.marginMm >= 5) {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(1, 1 * scale);
    const m = marginPx;
    const len = 14 * scale;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(m - len, m);
    ctx.lineTo(m, m);
    ctx.moveTo(m, m - len);
    ctx.lineTo(m, m);

    // Top-right
    ctx.moveTo(canvasW - m + len, m);
    ctx.lineTo(canvasW - m, m);
    ctx.moveTo(canvasW - m, m - len);
    ctx.lineTo(canvasW - m, m);

    // Bottom-left
    ctx.moveTo(m - len, canvasH - m);
    ctx.lineTo(m, canvasH - m);
    ctx.moveTo(m, canvasH - m + len);
    ctx.lineTo(m, canvasH - m);

    // Bottom-right
    ctx.moveTo(canvasW - m + len, canvasH - m);
    ctx.lineTo(canvasW - m, canvasH - m);
    ctx.moveTo(canvasW - m, canvasH - m + len);
    ctx.lineTo(canvasW - m, canvasH - m);

    ctx.stroke();
    ctx.restore();
  }

  return canvas;
}
