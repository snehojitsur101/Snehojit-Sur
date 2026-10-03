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
  const stateRef = useRef<AppSnapshot>(initialState);
  const isUpdatingFromHistoryRef = useRef(false);

  const currentSnapshot = history[currentIndex] || stateRef.current;
  stateRef.current = currentSnapshot;

  // Push a new snapshot to history with support for updater functions
  const pushState = useCallback(
    (action: Partial<AppSnapshot> | ((prev: AppSnapshot) => AppSnapshot)) => {
      if (isUpdatingFromHistoryRef.current) {
        isUpdatingFromHistoryRef.current = false;
        return;
      }

      const currentState = stateRef.current;
      const nextState: AppSnapshot =
        typeof action === 'function'
          ? action(currentState)
          : {
              images: action.images !== undefined ? action.images : currentState.images,
              pages: action.pages !== undefined ? action.pages : currentState.pages,
              settings: action.settings !== undefined ? action.settings : currentState.settings,
              currentPageIndex:
                action.currentPageIndex !== undefined
                  ? action.currentPageIndex
                  : currentState.currentPageIndex,
            };

      stateRef.current = nextState;

      setHistory((prevHistory) => {
        const updated = prevHistory.slice(0, currentIndex + 1);
        if (updated.length >= 35) {
          updated.shift();
        }
        return [...updated, nextState];
      });

      setCurrentIndex((prev) => {
        return Math.min(prev + 1, 34);
      });
    },
    [currentIndex]
  );

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUpdatingFromHistoryRef.current = true;
      setCurrentIndex((idx) => {
        const nextIdx = idx - 1;
        stateRef.current = history[nextIdx] || stateRef.current;
        return nextIdx;
      });
    }
  }, [currentIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUpdatingFromHistoryRef.current = true;
      setCurrentIndex((idx) => {
        const nextIdx = idx + 1;
        stateRef.current = history[nextIdx] || stateRef.current;
        return nextIdx;
      });
    }
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Global Keyboard Shortcuts (Ctrl+Z, Cmd+Z, Ctrl+Y, Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: currentSnapshot,
    getCurrentState: () => stateRef.current,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
}
