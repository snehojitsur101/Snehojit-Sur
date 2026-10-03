import React, { useEffect, useState } from 'react';
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
  CropArea,
  DocumentFilter,
  DocumentPage,
  PageLayoutType,
  SampleDocumentPreset,
  ScannedImage,
} from './types';
import { autoDetectDocumentEdges, fileToDataUrl, loadImage } from './utils/imageProcessor';
import { getAutoLayout, getLayoutCapacity } from './utils/layoutEngine';
import { Layers, FileText, SlidersHorizontal, Plus } from 'lucide-react';

const DEFAULT_SETTINGS: A4SheetSettings = {
  orientation: 'portrait',
  marginMm: 12,
  gapPx: 12,
  backgroundColor: '#ffffff',
  borderStyle: 'subtle',
  showHeader: true,
  headerTitle: 'SCANNED DOCUMENT COLLECTION',
  headerSubtitle: 'Formatted for Standard A4 Printing & Archival Record',
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
    layout: 'single_fit',
    slots: [null],
  },
];

type MobileViewTab = 'canvas' | 'tray' | 'settings';

export default function App() {
  // Undo / Redo History State
  const {
    state: historyState,
    getCurrentState,
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
  const [mobileTab, setMobileTab] = useState<MobileViewTab>('canvas');

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
    pushState(updates);
  };

  // Update Settings helper (with undo tracking)
  const handleUpdateSettings = (newSettings: Partial<A4SheetSettings>) => {
    commitState({
      settings: { ...settings, ...newSettings },
    });
  };

  // Load a sample preset (only when explicitly triggered by user)
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

    if (window.innerWidth < 768) {
      setMobileTab('canvas');
    }
  };

  // Upload user files with immediate auto-crop detection
  const handleFilesSelected = async (files: File[]) => {
    const newDocs: ScannedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const imgEl = await loadImage(dataUrl);
        const width = imgEl.naturalWidth || 800;
        const height = imgEl.naturalHeight || 600;

        // Auto-detect document edges to crop out background/margins immediately
        let detectedCrop: CropArea = { x: 0.02, y: 0.02, width: 0.96, height: 0.96 };
        try {
          detectedCrop = await autoDetectDocumentEdges(dataUrl);
        } catch {
          // fallback to 2% safe margin
        }

        const id = `upload-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

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
          scanResult: {
            documentType: 'Uploaded Document',
            title: cleanName,
            confidence: 85,
            ocrText: `${cleanName.toUpperCase()}\nDocument ready for A4 printing.`,
            recommendedFilter: 'magic_color',
            recommendedRotation: 0,
            qualityAssessment: {
              sharpness: 90,
              lighting: 'good',
              contrast: 'good',
              notes: 'Auto-cropped document ready for printing.',
            },
            keyFields: [{ label: 'File', value: file.name }],
            summary: `${cleanName} auto-cropped and fitted onto A4.`,
          },
          settings: {
            brightness: 0,
            contrast: 0,
            saturation: 100,
            sharpness: 0,
            filter: settings.autoEnhanceOnUpload ? 'magic_color' : 'original',
            rotation: 0,
            crop: detectedCrop, // Auto-crop applied directly!
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

    // Read freshest state from stateRef to avoid closure overwrite
    const current = getCurrentState();
    const allNewImages = [...current.images, ...newDocs];

    // Determine layout for page 1
    const targetLayout = getAutoLayout(allNewImages.length);
    const cap = getLayoutCapacity(targetLayout);

    const slots: (string | null)[] = [];
    for (let i = 0; i < cap; i++) {
      slots.push(allNewImages[i] ? allNewImages[i].id : null);
    }

    const updatedPages: DocumentPage[] = [
      {
        id: current.pages[0]?.id || 'page-1',
        pageNumber: 1,
        layout: targetLayout,
        slots,
      },
    ];

    // Commit state atomically
    pushState({
      images: allNewImages,
      pages: updatedPages,
      currentPageIndex: 0,
      settings: {
        ...current.settings,
        headerTitle:
          allNewImages.length === 1
            ? allNewImages[0].scanResult?.title || 'SCANNED DOCUMENT'
            : current.settings.headerTitle,
      },
    });

    // Switch to canvas tab on mobile so user immediately sees their uploaded document
    if (window.innerWidth < 768) {
      setMobileTab('canvas');
    }

    // Run AI scanning sequentially
    scanQueueSequentially(newDocs);
  };

  // Sequential AI Scanner Queue
  const scanQueueSequentially = async (docs: ScannedImage[]) => {
    for (const doc of docs) {
      await scanDocumentWithAi(doc);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  };

  // Trigger AI Document Scanner via backend API
  const scanDocumentWithAi = async (doc: ScannedImage) => {
    // Set scanning status
    pushState((prev) => ({
      ...prev,
      images: prev.images.map((item) =>
        item.id === doc.id ? { ...item, status: 'scanning' } : item
      ),
    }));

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

        pushState((prev) => ({
          ...prev,
          images: prev.images.map((item) => {
            if (item.id === doc.id) {
              const currentCrop = item.settings.crop;
              const refinedCrop =
                scanData.suggestedCrop &&
                scanData.suggestedCrop.width > 0.3 &&
                scanData.suggestedCrop.height > 0.3
                  ? scanData.suggestedCrop
                  : currentCrop;

              return {
                ...item,
                status: 'scanned',
                scanResult: scanData,
                settings: {
                  ...item.settings,
                  filter: recommendedFilter,
                  rotation: recommendedRotation,
                  crop: refinedCrop,
                },
              };
            }
            return item;
          }),
        }));
      }
    } catch (err: any) {
      console.warn('Scan handled with fallback:', err.message);
      pushState((prev) => ({
        ...prev,
        images: prev.images.map((item) =>
          item.id === doc.id ? { ...item, status: 'scanned' } : item
        ),
      }));
    }
  };

  // AI Auto-Arrange & Auto-Fit
  const handleAiAutoLayout = async () => {
    const current = getCurrentState();
    if (current.images.length === 0) return;
    setIsAiLoading(true);

    try {
      const payload = {
        documents: current.images.map((img) => ({
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

      const layoutId = (rec?.recommendedLayoutId || getAutoLayout(current.images.length)) as PageLayoutType;
      const capacity = getLayoutCapacity(layoutId);

      const slots: (string | null)[] = [];
      for (let i = 0; i < capacity; i++) {
        slots.push(current.images[i] ? current.images[i].id : null);
      }

      pushState((prev) => ({
        ...prev,
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
          ...prev.settings,
          headerTitle: rec?.headerTitle || prev.settings.headerTitle,
          headerSubtitle: rec?.explanation || prev.settings.headerSubtitle,
        },
      }));
    } catch (err) {
      console.error('Auto layout failed:', err);
      const autoL = getAutoLayout(current.images.length);
      handleSelectLayout(autoL);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Change page layout
  const handleSelectLayout = (layoutId: PageLayoutType) => {
    const capacity = getLayoutCapacity(layoutId);
    pushState((prev) => {
      const updated = [...prev.pages];
      const page = { ...updated[prev.currentPageIndex] };
      const oldSlots = page.slots;
      const newSlots: (string | null)[] = [];

      for (let i = 0; i < capacity; i++) {
        if (i < oldSlots.length && oldSlots[i]) {
          newSlots.push(oldSlots[i]);
        } else if (prev.images[i]) {
          newSlots.push(prev.images[i].id);
        } else {
          newSlots.push(null);
        }
      }

      page.layout = layoutId;
      page.slots = newSlots;
      updated[prev.currentPageIndex] = page;

      return {
        ...prev,
        pages: updated,
      };
    });
  };

  // Document item actions
  const handleDeleteImage = (id: string) => {
    pushState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
      pages: prev.pages.map((p) => ({
        ...p,
        slots: p.slots.map((s) => (s === id ? null : s)),
      })),
    }));
  };

  const handleRotateImage = (id: string) => {
    pushState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === id
          ? {
              ...img,
              settings: {
                ...img.settings,
                rotation: (img.settings.rotation + 90) % 360,
              },
            }
          : img
      ),
    }));
  };

  const handleChangeFilter = (id: string, filter: DocumentFilter) => {
    pushState((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === id
          ? {
              ...img,
              settings: {
                ...img.settings,
                filter,
              },
            }
          : img
      ),
    }));
  };

  const handleUpdateImage = (id: string, updates: Partial<ScannedImage>) => {
    pushState((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    }));
  };

  // Slot actions
  const handleAssignImageToSlot = (slotIndex: number, imageId: string | null) => {
    pushState((prev) => {
      const updated = [...prev.pages];
      const page = { ...updated[prev.currentPageIndex] };
      const newSlots = [...page.slots];
      newSlots[slotIndex] = imageId;
      page.slots = newSlots;
      updated[prev.currentPageIndex] = page;

      return {
        ...prev,
        pages: updated,
      };
    });
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
    pushState((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
      currentPageIndex: prev.pages.length,
    }));
  };

  const handleDuplicatePage = (index: number) => {
    pushState((prev) => {
      const srcPage = prev.pages[index];
      const newPage: DocumentPage = {
        id: `page-${Date.now()}`,
        pageNumber: prev.pages.length + 1,
        layout: srcPage.layout,
        slots: [...srcPage.slots],
      };
      const updated = [...prev.pages];
      updated.splice(index + 1, 0, newPage);
      updated.forEach((p, i) => (p.pageNumber = i + 1));

      return {
        ...prev,
        pages: updated,
        currentPageIndex: index + 1,
      };
    });
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    pushState((prev) => {
      const updated = prev.pages.filter((_, i) => i !== index);
      updated.forEach((p, i) => (p.pageNumber = i + 1));
      return {
        ...prev,
        pages: updated,
        currentPageIndex: Math.max(0, index - 1),
      };
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

      {/* Studio Workspace: Responsive for Mobile & Desktop */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Documents Tray */}
        <div
          className={`${
            mobileTab === 'tray' ? 'flex w-full absolute inset-0 z-20' : 'hidden'
          } md:relative md:flex md:w-80 md:z-0 shrink-0`}
        >
          <DocumentTray
            images={images}
            selectedImageId={selectedImageId}
            onSelectImage={(id) => {
              setSelectedImageId(id);
              if (window.innerWidth < 768) setMobileTab('canvas');
            }}
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
        </div>

        {/* Center: Live Interactive A4 Sheet Canvas */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden bg-sky-50/30 ${
            mobileTab !== 'canvas' ? 'hidden md:flex' : 'flex'
          }`}
        >
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

          {/* Page Navigator */}
          <PageNavigator
            pages={pages}
            currentPageIndex={currentPageIndex}
            onSelectPageIndex={(idx) => pushState({ currentPageIndex: idx })}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
          />
        </div>

        {/* Right Formatting Panel */}
        <div
          className={`${
            mobileTab === 'settings' ? 'flex w-full absolute inset-0 z-20' : 'hidden'
          } md:relative md:flex md:w-80 md:z-0 shrink-0`}
        >
          <FormattingPanel
            currentPage={currentPage}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSelectLayout={(layout) => {
              handleSelectLayout(layout);
              if (window.innerWidth < 768) setMobileTab('canvas');
            }}
            onAiAutoLayout={handleAiAutoLayout}
            isAiLoading={isAiLoading}
            totalImages={images.length}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden bg-white border-t border-sky-100 flex items-center justify-around py-2 px-3 z-30 shadow-lg">
        <button
          onClick={() => setMobileTab('tray')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'tray'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 bg-sky-600 text-white text-[9px] font-bold px-1 rounded-full">
              {images.length}
            </span>
          </div>
          <span className="text-[10px]">Documents</span>
        </button>

        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            mobileTab === 'canvas'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">A4 Canvas</span>
        </button>

        <button
          onClick={() => setMobileTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileTab === 'settings'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px]">Layout & Style</span>
        </button>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30"
          title="Upload"
        >
          <Plus className="w-5 h-5" />
        </button>
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
