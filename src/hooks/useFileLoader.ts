import { useState, useCallback } from 'react';
import type { FileState, BookFormat } from '../types';

export function useFileLoader() {
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    bookUrl: null,
    format: null,
  });

  const loadFile = useCallback((f: File) => {
    const parts = f.name.split('.');
    const ext = parts[parts.length - 1]?.toLowerCase();
    let format: BookFormat | null = null;
    let bookUrl: string | null = null;

    if (ext === 'epub') {
      format = 'epub';
      bookUrl = URL.createObjectURL(f);
    } else if (ext === 'pdf') {
      format = 'pdf';
    }

    if (!format) {
      throw new Error(`Formato no soportado: .${ext}`);
    }

    setFileState({ file: f, bookUrl, format });
  }, []);

  const reset = useCallback(() => {
    setFileState(prev => {
      if (prev.bookUrl) URL.revokeObjectURL(prev.bookUrl);
      return { file: null, bookUrl: null, format: null };
    });
  }, []);

  return { ...fileState, loadFile, reset };
}
