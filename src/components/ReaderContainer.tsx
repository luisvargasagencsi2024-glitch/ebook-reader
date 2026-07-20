import { useState, useCallback, useRef, useEffect } from 'react';
import { FileLoader } from './FileLoader';
import { EpubReader } from './EpubReader';
import { PdfReader } from './PdfReader';
import { Toolbar } from './Toolbar';
import { ReaderSidebar } from './ReaderSidebar';
import { AiSummaryModal } from './AiSummaryModal';
import { ReadingSettings, loadSettings, saveSettings } from './ReadingSettings';
import { SearchPanel } from './SearchPanel';
import type { ProgressData } from '../api/client';
import type { ReaderSettings } from './ReadingSettings';

interface ReaderContainerProps {
  bookId?: string;
  bookFileUrl?: string;
  bookFormat?: 'epub' | 'pdf' | 'audio';
  bookTitle?: string;
  bookAuthor?: string;
  bookDescription?: string;
  file?: File;
  progress?: ProgressData | null;
  onProgressSave?: (data: Partial<ProgressData>) => void;
  onBack?: () => void;
}

export function ReaderContainer({
  bookId,
  bookFileUrl,
  bookFormat,
  bookTitle,
  bookAuthor,
  bookDescription,
  file: externalFile,
  progress,
  onProgressSave,
  onBack,
}: ReaderContainerProps) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    if (bookId) {
      const saved = localStorage.getItem(`ebook-fontsize-${bookId}`);
      if (saved) return parseInt(saved, 10);
    }
    return 16;
  });
  const [zoom, setZoom] = useState(1);
  const [progress_, setProgress_] = useState(progress?.progress ?? 0);
  const [pageInfo, setPageInfo] = useState('0%');
  const [pdfPageSize, setPdfPageSize] = useState<{ w: number; h: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchNavigateTo, setSearchNavigateTo] = useState<string | null>(null);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(loadSettings);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAutoFitted = useRef(false);
  const readingDeltaRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(true);

  const resolvedFile = externalFile ?? localFile;
  const format = resolvedFile
    ? (resolvedFile.name.endsWith('.pdf') ? 'pdf' : resolvedFile.name.match(/\.(mp3|m4a)$/i) ? 'audio' : 'epub')
    : bookFormat;

  useEffect(() => {
    if (!format || format === 'audio') return;
    readingDeltaRef.current = 0;
    const interval = setInterval(() => {
      readingDeltaRef.current += 0.5;
    }, 30000);
    return () => clearInterval(interval);
  }, [format, bookId, bookFileUrl]);

  useEffect(() => {
    setPdfPageSize(null);
    hasAutoFitted.current = false;
    setProgress_(0);
    setPageInfo('0%');
  }, [bookId, bookFileUrl]);

  useEffect(() => {
    if (pdfPageSize && contentRef.current && !hasAutoFitted.current) {
      const availW = contentRef.current.clientWidth - 48;
      const availH = contentRef.current.clientHeight - 100;
      const scaleW = availW / pdfPageSize.w;
      const scaleH = availH / pdfPageSize.h;
      setZoom(Math.max(0.3, Math.min(3, Math.min(scaleW, scaleH))));
      hasAutoFitted.current = true;
    }
  }, [pdfPageSize]);

  useEffect(() => {
    if (bookId) localStorage.setItem(`ebook-fontsize-${bookId}`, String(fontSize));
  }, [fontSize, bookId]);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setToolbarVisible(true);
    if (showSidebar || showSearch || showSettings || showAiSummary) return;
    hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 2000);
  }, [showSidebar, showSearch, showSettings, showAiSummary]);

  useEffect(() => {
    startHideTimer();
    const onMove = () => startHideTimer();
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [startHideTimer]);

  const handlePdfPageChange = useCallback((current: number, total: number) => {
    setPageInfo(`${current}/${total}`);
    const p = current / total;
    setProgress_(p);
    const delta = Math.round(readingDeltaRef.current);
    readingDeltaRef.current = 0;
    onProgressSave?.({ currentPage: current, totalPages: total, progress: p, lastReadAt: new Date().toISOString(), readingTimeMinutes: delta || undefined });
  }, [onProgressSave]);

  const handleEpubLocationChange = useCallback((cfi: string, pct: number) => {
    setProgress_(pct);
    setPageInfo(`${Math.round(pct * 100)}%`);
    const delta = Math.round(readingDeltaRef.current);
    readingDeltaRef.current = 0;
    onProgressSave?.({ progress: pct, location: cfi, lastReadAt: new Date().toISOString(), readingTimeMinutes: delta || undefined });
  }, [onProgressSave]);

  const handlePdfPageSize = useCallback((size: { w: number; h: number }) => {
    setPdfPageSize(size);
  }, []);

  const handleFitWidth = useCallback(() => {
    if (pdfPageSize && contentRef.current) {
      setZoom(Math.max(0.3, Math.min(4, (contentRef.current.clientWidth - 48) / pdfPageSize.w)));
    }
  }, [pdfPageSize]);

  const handleFitPage = useCallback(() => {
    if (pdfPageSize && contentRef.current) {
      const availW = contentRef.current.clientWidth - 48;
      const availH = contentRef.current.clientHeight - 100;
      setZoom(Math.max(0.3, Math.min(4, Math.min(availW / pdfPageSize.w, availH / pdfPageSize.h))));
    }
  }, [pdfPageSize]);

  const handleSettingsChange = useCallback((s: ReaderSettings) => {
    setReaderSettings(s);
    saveSettings(s);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const hasFile = !!resolvedFile || (!!bookFileUrl && !!bookFormat);

  if (!hasFile) {
    return <FileLoader onFile={(f) => setLocalFile(f)} />;
  }

  return (
    <div className={`reader-layout ${toolbarVisible ? '' : 'reader-layout--toolbar-hidden'}`}>
      <Toolbar
        fileName={resolvedFile?.name || bookFileUrl?.split('/').pop() || ''}
        format={format || null}
        bookTitle={bookTitle}
        bookAuthor={bookAuthor}
        bookDescription={bookDescription}
        onBack={() => {
          if (document.fullscreenElement) document.exitFullscreen();
          onBack?.();
        }}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={format === 'pdf' ? handleFitWidth : undefined}
        onFitPage={format === 'pdf' ? handleFitPage : undefined}
        progress={progress_}
        pageInfo={pageInfo}
        showToc={showToc}
        onToggleToc={() => setShowToc(prev => !prev)}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(prev => !prev)}
        onAiSummary={() => setShowAiSummary(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onReadingSettings={() => setShowSettings(true)}
        onSearch={() => setShowSearch(true)}
      />
      <div className="reader-layout__body">
        <div ref={contentRef} className="reader-layout__content" onClick={() => {
          if (toolbarVisible) {
            setToolbarVisible(false);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          } else {
            startHideTimer();
          }
        }}>
          {format === 'epub' && (bookFileUrl || resolvedFile) && (
            <EpubReader
              url={bookFileUrl || URL.createObjectURL(resolvedFile!)}
              fontSize={fontSize}
              readerSettings={readerSettings}
              showToc={showToc}
              bookId={bookId ?? ''}
              searchNavigateTo={searchNavigateTo}
              onLocationChange={handleEpubLocationChange}
              onHighlightCreated={() => setShowSidebar(true)}
            />
          )}
          {format === 'pdf' && (bookFileUrl || resolvedFile) && (
            <PdfReader
              file={resolvedFile ?? bookFileUrl!}
              zoom={zoom}
              onProgress={setProgress_}
              onPageChange={handlePdfPageChange}
              onPageSizeReady={(s) => handlePdfPageSize({ w: s.w, h: s.h })}
            />
          )}
        </div>
        {showSidebar && bookId && (
          <ReaderSidebar bookId={bookId} onClose={() => setShowSidebar(false)} />
        )}
      </div>
      {showAiSummary && (
        <AiSummaryModal
          title={resolvedFile?.name || bookFileUrl?.split('/').pop() || 'Libro'}
          onClose={() => setShowAiSummary(false)}
        />
      )}
      {showSettings && (
        <ReadingSettings
          settings={readerSettings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showSearch && bookId && (
        <SearchPanel
          bookId={bookId}
          onNavigate={(href) => {
            setSearchNavigateTo(href);
            setShowSearch(false);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
