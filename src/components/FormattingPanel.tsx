import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Type,
  Stamp,
  AlignJustify,
  CreditCard,
  Square,
  Columns2,
  Rows2,
  Columns3,
  Rows3,
  Grid2x2,
  Rows4,
  LayoutDashboard,
} from 'lucide-react';
import { A4SheetSettings, BorderStyle, DocumentPage, PageLayoutType } from '../types';
import { LAYOUT_DEFINITIONS } from '../utils/layoutEngine';

interface FormattingPanelProps {
  currentPage: DocumentPage;
  settings: A4SheetSettings;
  onUpdateSettings: (newSettings: Partial<A4SheetSettings>) => void;
  onSelectLayout: (layout: PageLayoutType) => void;
  onAiAutoLayout: () => void;
  isAiLoading: boolean;
  totalImages: number;
}

export const FormattingPanel: React.FC<FormattingPanelProps> = ({
  currentPage,
  settings,
  onUpdateSettings,
  onSelectLayout,
  onAiAutoLayout,
  isAiLoading,
  totalImages,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'margins' | 'header_footer' | 'watermark'>('layout');

  const getLayoutIcon = (iconName: string) => {
    switch (iconName) {
      case 'Square':
        return <Square className="w-4 h-4" />;
      case 'Columns2':
        return <Columns2 className="w-4 h-4" />;
      case 'Rows2':
        return <Rows2 className="w-4 h-4" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4" />;
      case 'Columns3':
        return <Columns3 className="w-4 h-4" />;
      case 'Rows3':
        return <Rows3 className="w-4 h-4" />;
      case 'Grid2x2':
        return <Grid2x2 className="w-4 h-4" />;
      case 'Rows4':
        return <Rows4 className="w-4 h-4" />;
      default:
        return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-sky-100 flex flex-col h-full overflow-hidden select-none shadow-xs">
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 border-b border-sky-100 bg-sky-50/50 p-1 text-xs">
        <button
          onClick={() => setActiveTab('layout')}
          className={`py-2 px-1 rounded-xl font-bold text-center transition-all ${
            activeTab === 'layout'
              ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Layout
        </button>
        <button
          onClick={() => setActiveTab('margins')}
          className={`py-2 px-1 rounded-xl font-bold text-center transition-all ${
            activeTab === 'margins'
              ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Margins
        </button>
        <button
          onClick={() => setActiveTab('header_footer')}
          className={`py-2 px-1 rounded-xl font-bold text-center transition-all ${
            activeTab === 'header_footer'
              ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Headers
        </button>
        <button
          onClick={() => setActiveTab('watermark')}
          className={`py-2 px-1 rounded-xl font-bold text-center transition-all ${
            activeTab === 'watermark'
              ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Marks
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 bg-slate-50/30">
        {/* TAB 1: LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* AI Auto-Arrange Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/20">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>AI Smart Layout</span>
                </span>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                  {totalImages} docs
                </span>
              </div>
              <p className="text-[11px] text-sky-100 mb-3 leading-relaxed">
                Automatically detects document types and fits everything onto standard A4 paper.
              </p>
              <button
                onClick={onAiAutoLayout}
                disabled={isAiLoading || totalImages === 0}
                className="w-full py-2 px-3 rounded-xl bg-white text-sky-700 font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-sky-50 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-sky-600 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Analyzing & Arranging...' : 'Auto-Fit to A4'}</span>
              </button>
            </div>

            {/* Layout Grid Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-900">Page Grid Layout</label>
                <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-100 px-2 py-0.5 rounded-md">
                  {currentPage.slots.length} slots
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_DEFINITIONS.map((layout) => {
                  const isCurrent = currentPage.layout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => onSelectLayout(layout.id)}
                      className={`flex flex-col items-start p-2.5 rounded-2xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50/50 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`p-1 rounded-md ${isCurrent ? 'text-sky-600 bg-sky-100' : 'text-slate-500 bg-slate-100'}`}>
                          {getLayoutIcon(layout.iconName)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 font-mono font-bold text-slate-600">
                          {layout.capacity} {layout.capacity === 1 ? 'Doc' : 'Docs'}
                        </span>
                      </div>
                      <span className="font-bold text-[11px] line-clamp-1">{layout.name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {layout.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spacing & Gap Slider */}
            <div className="p-3.5 bg-white rounded-2xl border border-sky-100 space-y-2 shadow-2xs">
              <div className="flex justify-between items-center text-slate-800">
                <span className="font-bold">Image Spacing / Gap</span>
                <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {settings.gapPx}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={settings.gapPx}
                onChange={(e) => onUpdateSettings({ gapPx: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0px (Seamless)</span>
                <span>12px (Standard)</span>
                <span>32px (Spaced)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MARGINS & BORDERS */}
        {activeTab === 'margins' && (
          <div className="space-y-4">
            {/* Margins */}
            <div>
              <label className="font-bold text-slate-900 block mb-2">Page Margins (A4)</label>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { label: 'None', mm: 0 },
                  { label: 'Tight', mm: 5 },
                  { label: 'Normal', mm: 12 },
                  { label: 'Wide', mm: 20 },
                ].map((m) => (
                  <button
                    key={m.mm}
                    onClick={() => onUpdateSettings({ marginMm: m.mm })}
                    className={`py-2 rounded-xl border font-bold text-[11px] transition-all ${
                      settings.marginMm === m.mm
                        ? 'bg-sky-600 border-sky-600 text-white shadow-xs shadow-sky-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200'
                    }`}
                  >
                    {m.label} ({m.mm}mm)
                  </button>
                ))}
              </div>

              {/* Slider for custom mm */}
              <div className="p-3 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                <div className="flex justify-between items-center text-slate-800 mb-1.5">
                  <span className="font-medium">Custom Margin</span>
                  <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {settings.marginMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={settings.marginMm}
                  onChange={(e) => onUpdateSettings({ marginMm: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Frame / Border Styling */}
            <div className="border-t border-sky-100 pt-4">
              <label className="font-bold text-slate-900 block mb-2">Image Border & Frame</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'No Border', desc: 'Clean borderless' },
                  { id: 'subtle', label: 'Subtle Hairline', desc: '1px light slate' },
                  { id: 'solid_black', label: 'Solid Black', desc: '2px solid black' },
                  { id: 'dashed_cut', label: 'Dashed Cutline', desc: 'For scissors' },
                  { id: 'shadow', label: 'Paper Shadow', desc: 'Soft lift' },
                  { id: 'rounded', label: 'Rounded Corners', desc: 'Card style' },
                ].map((b) => {
                  const isSelected = settings.borderStyle === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onUpdateSettings({ borderStyle: b.id as BorderStyle })}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50/50 hover:border-sky-300'
                      }`}
                    >
                      <span className="font-bold block">{b.label}</span>
                      <span className="text-[10px] text-slate-500">{b.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Paper Shade */}
            <div className="border-t border-sky-100 pt-4">
              <label className="font-bold text-slate-900 block mb-2">A4 Paper Tone</label>
              <div className="flex gap-2">
                {[
                  { color: '#ffffff', name: 'Pure White' },
                  { color: '#fafaf9', name: 'Warm White' },
                  { color: '#fffdf5', name: 'Cream' },
                  { color: '#f0f9ff', name: 'Sky Soft' },
                ].map((bg) => (
                  <button
                    key={bg.color}
                    onClick={() => onUpdateSettings({ backgroundColor: bg.color })}
                    className={`flex-1 p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all bg-white ${
                      settings.backgroundColor === bg.color
                        ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md shadow-xs border border-slate-300"
                      style={{ backgroundColor: bg.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-700">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cut Marks Toggle */}
            <div className="border-t border-sky-100 pt-4">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 cursor-pointer shadow-2xs transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Print Cut Marks</span>
                    <span className="text-[10px] text-slate-500">Corner crop marks & fold guides</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showCutGuides}
                  onChange={(e) => onUpdateSettings({ showCutGuides: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: HEADER & FOOTER */}
        {activeTab === 'header_footer' && (
          <div className="space-y-4">
            {/* Header Settings */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-sky-600" />
                  <span>Page Header</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.showHeader}
                  onChange={(e) => onUpdateSettings({ showHeader: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {settings.showHeader && (
                <div className="space-y-2.5 p-3.5 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Document Title</label>
                    <input
                      type="text"
                      value={settings.headerTitle}
                      onChange={(e) => onUpdateSettings({ headerTitle: e.target.value })}
                      placeholder="e.g. EXPENSE REIMBURSEMENT REPORT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Subtitle / Ref #</label>
                    <input
                      type="text"
                      value={settings.headerSubtitle}
                      onChange={(e) => onUpdateSettings({ headerSubtitle: e.target.value })}
                      placeholder="e.g. Submitted for official verification"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showDate}
                      onChange={(e) => onUpdateSettings({ showDate: e.target.checked })}
                      className="w-3.5 h-3.5 accent-sky-600 rounded"
                    />
                    <span>Include Print Date (top-right)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Footer Settings */}
            <div className="border-t border-sky-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlignJustify className="w-4 h-4 text-sky-600" />
                  <span>Page Footer</span>
                </label>
                <input
                  type="checkbox"
                  checked={settings.showFooter}
                  onChange={(e) => onUpdateSettings({ showFooter: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {settings.showFooter && (
                <div className="space-y-2.5 p-3.5 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Footer Text / Disclaimer</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => onUpdateSettings({ footerText: e.target.value })}
                      placeholder="e.g. Confidential • For Official Use Only"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPageNumber}
                      onChange={(e) => onUpdateSettings({ showPageNumber: e.target.checked })}
                      className="w-3.5 h-3.5 accent-sky-600 rounded"
                    />
                    <span>Include "Page X" counter (bottom-right)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WATERMARK & SECURITY */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <Stamp className="w-4 h-4 text-sky-600" />
                <span>Diagonal Watermark</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Adds high-security diagonal text across the printed A4 sheet.
              </p>

              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={settings.watermarkText}
                  onChange={(e) => onUpdateSettings({ watermarkText: e.target.value })}
                  placeholder="e.g. CONFIDENTIAL / COPY / DRAFT"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
                />

                {/* Quick watermark chips */}
                <div className="flex flex-wrap gap-1.5">
                  {['CONFIDENTIAL', 'OFFICIAL COPY', 'VERIFIED', 'FOR RECORDS ONLY', 'DRAFT'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          onUpdateSettings({
                            watermarkText: tag,
                            watermarkOpacity: settings.watermarkOpacity === 0 ? 12 : settings.watermarkOpacity,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[10px] font-bold text-sky-800 border border-sky-200 transition-colors"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Watermark Opacity */}
              <div className="p-3.5 bg-white rounded-2xl border border-sky-100 space-y-2 shadow-2xs">
                <div className="flex justify-between items-center text-slate-800">
                  <span className="font-medium">Watermark Opacity</span>
                  <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {settings.watermarkOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={settings.watermarkOpacity}
                  onChange={(e) => onUpdateSettings({ watermarkOpacity: Number(e.target.value) })}
                  className="w-full accent-sky-500 bg-sky-100 h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>0% (Hidden)</span>
                  <span>12% (Subtle)</span>
                  <span>35% (Strong)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary at bottom */}
      <div className="p-3 bg-white border-t border-sky-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>A4 {settings.orientation.toUpperCase()} (210×297mm)</span>
        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
          {settings.marginMm}mm Margin
        </span>
      </div>
    </div>
  );
};
