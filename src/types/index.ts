export type DocumentFilter =
  | 'original'
  | 'magic_color'
  | 'bw_clean'
  | 'high_contrast'
  | 'sharp_photo'
  | 'faded_fix';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // 0 to 200 (100 = default)
  sharpness: number; // 0 to 100
  filter: DocumentFilter;
  rotation: number; // 0, 90, 180, 270, etc.
  fitMode: 'contain' | 'cover' | 'fill';
  scale: number; // 0.5 to 2.0 (zoom inside frame)
  offsetX: number; // pan inside frame
  offsetY: number;
}

export interface AIScanResult {
  documentType: string;
  title: string;
  confidence: number;
  dateDetected?: string;
  referenceNumber?: string;
  ocrText: string;
  recommendedFilter: DocumentFilter | string;
  recommendedRotation: number;
  qualityAssessment: {
    sharpness: number;
    lighting: string;
    contrast: string;
    notes: string;
  };
  keyFields: Array<{
    label: string;
    value: string;
  }>;
  summary: string;
}

export interface ScannedImage {
  id: string;
  name: string;
  originalUrl: string;
  processedUrl: string;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  sizeBytes: number;
  status: 'idle' | 'scanning' | 'scanned' | 'error';
  errorMessage?: string;
  scanResult?: AIScanResult;
  settings: ImageAdjustments;
}

export type PageLayoutType =
  | 'auto'
  | 'single_fit'
  | 'split_vertical'
  | 'split_horizontal'
  | 'id_duo'
  | 'hero_top_2_bottom'
  | 'hero_left_2_right'
  | 'tri_column'
  | 'tri_row'
  | 'grid_2x2'
  | 'quad_horizontal'
  | 'hero_left_3_right'
  | 'passport_grid';

export interface LayoutSlot {
  id: number;
  label: string;
  colSpan?: number;
  rowSpan?: number;
  aspectRatioPreference?: number; // e.g. 1.58 for ID card (85.6x54)
}

export interface LayoutDefinition {
  id: PageLayoutType;
  name: string;
  description: string;
  capacity: number;
  iconName: string;
  category: '1-Image' | '2-Images' | '3-Images' | '4-Images' | 'Specialty';
}

export type BorderStyle =
  | 'none'
  | 'subtle'
  | 'solid_black'
  | 'dashed_cut'
  | 'shadow'
  | 'rounded';

export interface A4SheetSettings {
  orientation: 'portrait' | 'landscape';
  marginMm: number; // 0, 5, 10, 15, 20
  gapPx: number; // spacing between images (0 to 32px)
  backgroundColor: string;
  borderStyle: BorderStyle;
  showHeader: boolean;
  headerTitle: string;
  headerSubtitle: string;
  showFooter: boolean;
  footerText: string;
  showPageNumber: boolean;
  showDate: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  showCutGuides: boolean;
  autoEnhanceOnUpload: boolean;
}

export interface DocumentPage {
  id: string;
  pageNumber: number;
  layout: PageLayoutType;
  slots: (string | null)[]; // image IDs in each slot
}

export interface SampleDocumentPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  layout: PageLayoutType;
  headerTitle: string;
  headerSubtitle: string;
  items: Array<{
    name: string;
    sampleSvgOrUrl: string;
    documentType: string;
    ocrText: string;
    filter: DocumentFilter;
    keyFields: Array<{ label: string; value: string }>;
  }>;
}
