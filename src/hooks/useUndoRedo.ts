import { useState, useCallback, useEffect, useRef } from 'react';
import { A4SheetSettings, DocumentPage, ScannedImage } from '../types';

export interface AppSnapshot {
  images: ScannedImage[];
  pages: DocumentPage[];
  settings: A4SheetSettings;
  currentPageIndex: number;
}

export function useUndoRedo(initialState: AppSnapshot) {
  const [history, setHistory] = useState<AppSnapshot[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const isUpdatingFromHistoryRef = useRef(false);

  const currentSnapshot = history[currentIndex] || initialState;

  // Push a new snapshot to history
  const pushState = useCallback((newSnapshot: AppSnapshot) => {
    if (isUpdatingFromHistoryRef.current) {
      isUpdatingFromHistoryRef.current = false;
      return;
    }

    setHistory((prevHistory) => {
      // Truncate any redo history beyond current index
      const updated = prevHistory.slice(0, currentIndex + 1);
      // Limit history to 35 steps
      if (updated.length >= 35) {
        updated.shift();
      }
      return [...updated, newSnapshot];
    });

    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, 34);
      return next;
    });
  }, [currentIndex]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUpdatingFromHistoryRef.current = true;
      setCurrentIndex((idx) => idx - 1);
    }
  }, [currentIndex]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUpdatingFromHistoryRef.current = true;
      setCurrentIndex((idx) => idx + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Global Keyboard Shortcuts (Ctrl+Z, Cmd+Z, Ctrl+Y, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          // Redo on Mac (Cmd+Shift+Z) or Windows (Ctrl+Shift+Z)
          e.preventDefault();
          redo();
        } else {
          // Undo
          e.preventDefault();
          undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        // Redo on Windows (Ctrl+Y)
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: currentSnapshot,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
}
