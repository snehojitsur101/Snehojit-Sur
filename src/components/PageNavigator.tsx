import React from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { DocumentPage } from '../types';

interface PageNavigatorProps {
  pages: DocumentPage[];
  currentPageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  pages,
  currentPageIndex,
  onSelectPageIndex,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
}) => {
  return (
    <div className="bg-white border-t border-sky-100 px-4 py-2.5 flex items-center justify-between gap-4 select-none z-20 shadow-xs">
      {/* Left Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectPageIndex(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="p-1.5 rounded-lg bg-sky-50 text-slate-700 hover:bg-sky-100 disabled:opacity-35 transition-colors border border-sky-200/60"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-slate-700">
          Page <span className="text-sky-700 font-bold">{currentPageIndex + 1}</span> of{' '}
          <span className="text-slate-500">{pages.length}</span>
        </span>

        <button
          onClick={() => onSelectPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === pages.length - 1}
          className="p-1.5 rounded-lg bg-sky-50 text-slate-700 hover:bg-sky-100 disabled:opacity-35 transition-colors border border-sky-200/60"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center Thumbnails Reel */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-lg py-1 scrollbar-none">
        {pages.map((p, idx) => {
          const isCurrent = idx === currentPageIndex;
          const assignedCount = p.slots.filter(Boolean).length;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPageIndex(idx)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isCurrent
                  ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-sky-50/60 hover:text-slate-900'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isCurrent ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>Page {idx + 1}</span>
              <span className="text-[10px] opacity-70 font-mono">({assignedCount})</span>
            </button>
          );
        })}
      </div>

      {/* Right Actions: Add Page, Duplicate, Delete */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onDuplicatePage(currentPageIndex)}
          className="p-1.5 rounded-xl bg-sky-50 text-slate-700 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1 transition-colors border border-sky-200/60"
          title="Duplicate Current Page"
        >
          <Copy className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">Duplicate</span>
        </button>

        {pages.length > 1 && (
          <button
            onClick={() => onDeletePage(currentPageIndex)}
            className="p-1.5 rounded-xl bg-white text-slate-400 hover:bg-red-50 hover:text-red-600 text-xs transition-colors border border-slate-200"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onAddPage}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-sky-600/20 transition-colors"
          title="Add New A4 Page"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Page</span>
        </button>
      </div>
    </div>
  );
};
