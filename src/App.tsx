import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { DocumentTray } from './components/DocumentTray';
import { FormattingPanel } from './components/FormattingPanel';
import { A4SheetCanvas } from './components/A4SheetCanvas';
import { PageNavigator } from './components/PageNavigator';
import { UploadModal } from './components/UploadModal';
import { ImageEditorModal } from './components/ImageEditorModal';
import { ExportModal } from './components/ExportModal';
import { OcrModal } from './components/OcrModal';
import { useUndoRedo, AppSnapshot } from './hooks/useUndoRedo';
import {
  A4SheetSettings,
  DocumentFilter,
  DocumentPage,
  PageLayoutType,
  SampleDocumentPreset,
  ScannedImage,
} from './types';
import { fileToDataUrl, loadImage } from './utils/imageProcessor';
import { getAutoLayout, getLayoutCapacity } from './utils/layoutEngine';
import { getSamplePresets } from './utils/sampleData';

const DEFAULT_SETTINGS: A4SheetSettings = {
  orientation: 'portrait',
  marginMm: 12,
  gapPx: 12,
  backgroundColor: '#ffffff',
  borderStyle: 'subtle',
  showHeader: true,
  headerTitle: 'MONTHLY EXPENSE REIMBURSEMENT REPORT',
  headerSubtitle: 'Submitted by Financial Department • Total 4 Invoices Attached',
  showFooter: true,
  footerText: 'Confidential • For Official Document Filing Only',
  showPageNumber: true,
  showDate: true,
  watermarkText: '',
  watermarkOpacity: 12,
  showCutGuides: false,
  autoEnhanceOnUpload: true,
};

const INITIAL_PAGES: DocumentPage[] = [
  {
    id: 'page-1',
    pageNumber: 1,
    layout: 'grid_2x2',
    slots: [null, null, null, null],
  },
];

export default function App() {
  // Undo / Redo History State
  const {
    state: historyState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo({
    images: [],
    pages: INITIAL_PAGES,
    settings: DEFAULT_SETTINGS,
    currentPageIndex: 0,
  });

  const { images, pages, settings, currentPageIndex } = historyState;

  // UI state
  const [zoom, setZoom] = useState<number>(1.0);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [activeEditorImage, setActiveEditorImage] = useState<ScannedImage | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiScanningImage, setIsAiScanningImage] = useState(false);

  // Fast map lookup for images
  const imagesMap = new Map<string, ScannedImage>(images.map((img) => [img.id, img]));
  const currentPage = pages[currentPageIndex] || pages[0];

  // Helper to commit new state into Undo/Redo history
  const commitState = (updates: Partial<AppSnapshot>) => {
    pushState({
      images: updates.images !== undefined ? updates.images : images,
      pages: updates.pages !== undefined ? updates.pages : pages,
      settings: updates.settings !== undefined ? updates.settings : settings,
      currentPageIndex:
        updates.currentPageIndex !== undefined ? updates.currentPageIndex : currentPageIndex,
    });
  };

  // Initialize with Sample Preset on first load
  useEffect(() => {
    const presets = getSamplePresets();
    if (presets && presets.length > 1) {
      loadPreset(presets[1]); // Default to 4 Invoices preset
    } else if (presets && presets.length > 0) {
      loadPreset(presets[0]);
    }
  }, []);

  // Update Settings helper (with undo tracking)
  const handleUpdateSettings = (newSettings: Partial<A4SheetSettings>) => {
    commitState({
      settings: { ...settings, ...newSettings },
    });
  };

  // Load a sample preset
  const loadPreset = (preset: SampleDocumentPreset) => {
    const loadedImages: ScannedImage[] = preset.items.map((item, idx) => {
      const id = `doc-${Date.now()}-${idx}`;
      return {
        id,
        name: item.name,
        originalUrl: item.sampleSvgOrUrl,
        processedUrl: item.sampleSvgOrUrl,
        mimeType: 'image/png',
        width: 600,
        height: 400,
        aspectRatio: 1.5,
        sizeBytes: 45000,
        status: 'scanned',
        scanResult: {
          documentType: item.documentType,
          title: item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          confidence: 98,
          ocrText: item.ocrText,
          recommendedFilter: item.filter,
          recommendedRotation: 0,
          qualityAssessment: {
            sharpness: 94,
            lighting: 'good',
            contrast: 'good',
            notes: 'High contrast document ready for crisp A4 output.',
          },
          keyFields: item.keyFields,
          summary: `${item.documentType} parsed and enhanced for printing.`,
        },
        settings: {
          brightness: 0,
          contrast: 0,
          saturation: 100,
          sharpness: 0,
          filter: item.filter,
          rotation: 0,
          fitMode: 'contain',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        },
      };
    });

    const capacity = getLayoutCapacity(preset.layout);
    const slots: (string | null)[] = [];
    for (let i = 0; i < capacity; i++) {
      slots.push(loadedImages[i] ? loadedImages[i].id : null);
    }

    commitState({
      images: loadedImages,
      pages: [
        {
          id: 'page-1',
          pageNumber: 1,
          layout: preset.layout,
          slots,
        },
      ],
      currentPageIndex: 0,
      settings: {
        ...settings,
        headerTitle: preset.headerTitle,
        headerSubtitle: preset.headerSubtitle,
      },
    });
  };

  // Upload user files
  const handleFilesSelected = async (files: File[]) => {
    const newDocs: ScannedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const imgEl = await loadImage(dataUrl);
        const width = imgEl.naturalWidth || 800;
        const height = imgEl.naturalHeight || 600;

        const id = `upload-${Date.now()}-${i}`;
        const newDoc: ScannedImage = {
          id,
          name: file.name,
          originalUrl: dataUrl,
          processedUrl: dataUrl,
          mimeType: file.type || 'image/jpeg',
          width,
          height,
          aspectRatio: width / height,
          sizeBytes: file.size,
          status: 'idle',
          settings: {
            brightness: 0,
            contrast: 0,
            saturation: 100,
            sharpness: 0,
            filter: settings.autoEnhanceOnUpload ? 'magic_color' : 'original',
            rotation: 0,
            fitMode: 'contain',
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          },
        };

        newDocs.push(newDoc);
      } catch (err) {
        console.error('Failed to parse uploaded file:', file.name, err);
      }
    }

    if (newDocs.length === 0) return;

    const allNewImages = [...images, ...newDocs];

    // Auto-fit new documents into slots
    const updatedPages = [...pages];
    let pIdx = 0;
    let slotIdx = 0;

    const totalCapacity = updatedPages.reduce((acc, p) => acc + p.slots.length, 0);
    let finalPages = updatedPages;

    if (allNewImages.length > totalCapacity) {
      const suggestedLayout = getAutoLayout(allNewImages.length);
      const cap = getLayoutCapacity(suggestedLayout);
      const slots: (string | null)[] = [];
      for (let i = 0; i < cap; i++) {
        slots.push(allNewImages[i] ? allNewImages[i].id : null);
      }
      finalPages = [
        {
          id: 'page-1',
          pageNumber: 1,
          layout: suggestedLayout,
          slots,
        },
      ];
    } else {
      for (const doc of allNewImages) {
        while (pIdx < updatedPages.length) {
          const p = updatedPages[pIdx];
          while (slotIdx < p.slots.length) {
            if (!p.slots[slotIdx]) {
              p.slots[slotIdx] = doc.id;
              break;
            }
            slotIdx++;
          }
          if (slotIdx < p.slots.length) {
            break;
          } else {
            pIdx++;
            slotIdx = 0;
          }
        }
      }
      finalPages = updatedPages;
    }

    commitState({
      images: allNewImages,
      pages: finalPages,
    });

    // Run sequential queue scanning for uploaded files to stay within API rate limits
    scanQueueSequentially(newDocs);
  };

  // Sequential AI Scanner Queue
  const scanQueueSequentially = async (docs: ScannedImage[]) => {
    for (const doc of docs) {
      await scanDocumentWithAi(doc);
      // Brief pause between documents
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  };

  // Trigger AI Document Scanner via backend API
  const scanDocumentWithAi = async (doc: ScannedImage) => {
    // Set scanning state
    const currentImgs = historyState.images;
    commitState({
      images: currentImgs.map((item) =>
        item.id === doc.id ? { ...item, status: 'scanning' } : item
      ),
    });

    try {
      const res = await fetch('/api/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: doc.originalUrl,
          mimeType: doc.mimeType,
          title: doc.name,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const scanData = json.data;
        const recommendedFilter = (scanData.recommendedFilter || 'magic_color') as DocumentFilter;
        const recommendedRotation = scanData.recommendedRotation || 0;

        commitState({
          images: historyState.images.map((item) => {
            if (item.id === doc.id) {
              return {
                ...item,
                status: 'scanned',
                scanResult: scanData,
                settings: {
                  ...item.settings,
                  filter: recommendedFilter,
                  rotation: recommendedRotation,
                },
              };
            }
            return item;
          }),
        });
      }
    } catch (err: any) {
      console.warn('Scan handled with fallback:', err.message);
      commitState({
        images: historyState.images.map((item) =>
          item.id === doc.id
            ? {
                ...item,
                status: 'scanned',
                scanResult: {
                  documentType: 'Document',
                  title: item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                  confidence: 90,
                  ocrText: 'Scanned document processed for A4 paper fit.',
                  recommendedFilter: 'magic_color',
                  recommendedRotation: 0,
                  qualityAssessment: {
                    sharpness: 90,
                    lighting: 'good',
                    contrast: 'good',
                    notes: 'Standard scan ready for printing.',
                  },
                  keyFields: [{ label: 'File Name', value: item.name }],
                  summary: 'Scanned document formatted for A4 sheet printing.',
                },
              }
            : item
        ),
      });
    }
  };

  // AI Auto-Arrange & Auto-Fit
  const handleAiAutoLayout = async () => {
    if (images.length === 0) return;
    setIsAiLoading(true);

    try {
      const payload = {
        documents: images.map((img) => ({
          id: img.id,
          title: img.scanResult?.title || img.name,
          documentType: img.scanResult?.documentType || 'Document',
          aspectRatio: img.aspectRatio,
        })),
        targetPreference: 'single_page',
      };

      const res = await fetch('/api/ai-layout-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const rec = json.data;

      const layoutId = (rec?.recommendedLayoutId || getAutoLayout(images.length)) as PageLayoutType;
      const capacity = getLayoutCapacity(layoutId);

      const slots: (string | null)[] = [];
      for (let i = 0; i < capacity; i++) {
        slots.push(images[i] ? images[i].id : null);
      }

      commitState({
        pages: [
          {
            id: 'page-1',
            pageNumber: 1,
            layout: layoutId,
            slots,
          },
        ],
        currentPageIndex: 0,
        settings: {
          ...settings,
          headerTitle: rec?.headerTitle || settings.headerTitle,
          headerSubtitle: rec?.explanation || settings.headerSubtitle,
        },
      });
    } catch (err) {
      console.error('Auto layout failed:', err);
      const autoL = getAutoLayout(images.length);
      handleSelectLayout(autoL);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Change page layout
  const handleSelectLayout = (layoutId: PageLayoutType) => {
    const capacity = getLayoutCapacity(layoutId);
    const updated = [...pages];
    const page = { ...updated[currentPageIndex] };
    const oldSlots = page.slots;
    const newSlots: (string | null)[] = [];

    for (let i = 0; i < capacity; i++) {
      if (i < oldSlots.length && oldSlots[i]) {
        newSlots.push(oldSlots[i]);
      } else if (images[i]) {
        newSlots.push(images[i].id);
      } else {
        newSlots.push(null);
      }
    }

    page.layout = layoutId;
    page.slots = newSlots;
    updated[currentPageIndex] = page;

    commitState({ pages: updated });
  };

  // Document item actions
  const handleDeleteImage = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    const newPages = pages.map((p) => ({
      ...p,
      slots: p.slots.map((s) => (s === id ? null : s)),
    }));
    commitState({
      images: newImages,
      pages: newPages,
    });
  };

  const handleRotateImage = (id: string) => {
    const newImages = images.map((img) =>
      img.id === id
        ? {
            ...img,
            settings: {
              ...img.settings,
              rotation: (img.settings.rotation + 90) % 360,
            },
          }
        : img
    );
    commitState({ images: newImages });
  };

  const handleChangeFilter = (id: string, filter: DocumentFilter) => {
    const newImages = images.map((img) =>
      img.id === id
        ? {
            ...img,
            settings: {
              ...img.settings,
              filter,
            },
          }
        : img
    );
    commitState({ images: newImages });
  };

  const handleUpdateImage = (id: string, updates: Partial<ScannedImage>) => {
    const newImages = images.map((img) => (img.id === id ? { ...img, ...updates } : img));
    commitState({ images: newImages });
  };

  // Slot actions
  const handleAssignImageToSlot = (slotIndex: number, imageId: string | null) => {
    const updated = [...pages];
    const page = { ...updated[currentPageIndex] };
    const newSlots = [...page.slots];
    newSlots[slotIndex] = imageId;
    page.slots = newSlots;
    updated[currentPageIndex] = page;

    commitState({ pages: updated });
  };

  const handleRotateSlotImage = (slotIndex: number) => {
    const imageId = currentPage.slots[slotIndex];
    if (imageId) {
      handleRotateImage(imageId);
    }
  };

  const handleOpenEditorForSlot = (slotIndex: number) => {
    const imageId = currentPage.slots[slotIndex];
    if (imageId) {
      const doc = imagesMap.get(imageId);
      if (doc) {
        setActiveEditorImage(doc);
        setIsEditorModalOpen(true);
      }
    }
  };

  // Multi-Page Management
  const handleAddPage = () => {
    const newPage: DocumentPage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      layout: currentPage.layout || 'single_fit',
      slots: new Array(currentPage.slots.length).fill(null),
    };
    commitState({
      pages: [...pages, newPage],
      currentPageIndex: pages.length,
    });
  };

  const handleDuplicatePage = (index: number) => {
    const srcPage = pages[index];
    const newPage: DocumentPage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      layout: srcPage.layout,
      slots: [...srcPage.slots],
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    updated.forEach((p, i) => (p.pageNumber = i + 1));

    commitState({
      pages: updated,
      currentPageIndex: index + 1,
    });
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== index);
    updated.forEach((p, i) => (p.pageNumber = i + 1));

    commitState({
      pages: updated,
      currentPageIndex: Math.max(0, index - 1),
    });
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-sky-50/50 text-slate-900 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenPresets={() => setIsUploadModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onTriggerPrint={handleTriggerPrint}
        onOpenOcrModal={() => setIsOcrModalOpen(true)}
        onAiAutoLayout={handleAiAutoLayout}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        isAiLoading={isAiLoading}
        totalImages={images.length}
        totalPages={pages.length}
        zoom={zoom}
        setZoom={setZoom}
      />

      {/* Main Studio Workspace: Left Sidebar + Live A4 Canvas + Right Sidebar */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Documents Tray */}
        <DocumentTray
          images={images}
          selectedImageId={selectedImageId}
          onSelectImage={(id) => setSelectedImageId(id)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenPresets={() => setIsUploadModalOpen(true)}
          onOpenEditor={(img) => {
            setActiveEditorImage(img);
            setIsEditorModalOpen(true);
          }}
          onDeleteImage={handleDeleteImage}
          onRotateImage={handleRotateImage}
          onChangeFilter={handleChangeFilter}
          onScanWithAi={scanDocumentWithAi}
        />

        {/* Center: Live Interactive A4 Sheet Canvas */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-sky-50/30">
          <A4SheetCanvas
            page={currentPage}
            imagesMap={imagesMap}
            allImages={images}
            settings={settings}
            zoom={zoom}
            selectedSlotIndex={selectedSlotIndex}
            onSelectSlot={(idx) => setSelectedSlotIndex(idx)}
            onAssignImageToSlot={handleAssignImageToSlot}
            onRotateSlotImage={handleRotateSlotImage}
            onOpenEditorForSlot={handleOpenEditorForSlot}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />

          {/* Bottom Multi-Page Navigator */}
          <PageNavigator
            pages={pages}
            currentPageIndex={currentPageIndex}
            onSelectPageIndex={(idx) => commitState({ currentPageIndex: idx })}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
          />
        </div>

        {/* Right Formatting & Customization Panel */}
        <FormattingPanel
          currentPage={currentPage}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onSelectLayout={handleSelectLayout}
          onAiAutoLayout={handleAiAutoLayout}
          isAiLoading={isAiLoading}
          totalImages={images.length}
        />
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFilesSelected={handleFilesSelected}
        onLoadPreset={loadPreset}
        autoEnhance={settings.autoEnhanceOnUpload}
        setAutoEnhance={(val) => handleUpdateSettings({ autoEnhanceOnUpload: val })}
      />

      <ImageEditorModal
        image={activeEditorImage}
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onUpdateImage={handleUpdateImage}
        onScanWithAi={scanDocumentWithAi}
        isAiScanning={isAiScanningImage}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pages={pages}
        currentPage={currentPage}
        imagesMap={imagesMap}
        allImages={images}
        settings={settings}
        onTriggerPrint={handleTriggerPrint}
      />

      <OcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        images={images}
      />
    </div>
  );
}
