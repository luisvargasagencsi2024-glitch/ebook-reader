import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PdfReader.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfReaderProps {
  file: File | string;
  zoom: number;
  onProgress: (progress: number) => void;
  onPageChange: (current: number, total: number) => void;
  onPageSizeReady?: (size: { w: number; h: number }) => void;
}

export function PdfReader({
  file,
  zoom,
  onProgress,
  onPageChange,
  onPageSizeReady,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [turning, setTurning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      onPageChange(1, n);
    },
    [onPageChange],
  );

  const onPageLoadSuccess = useCallback(
    (page: { width: number; height: number }) => {
      onPageSizeReady?.({ w: page.width, h: page.height });
    },
    [onPageSizeReady],
  );

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(numPages, page));
      if (p === pageNumber) return;
      setTurning(true);
      timeoutRef.current = setTimeout(() => {
        setPageNumber(p);
        onPageChange(p, numPages);
        onProgress(p / numPages);
        setTurning(false);
      }, 250);
    },
    [numPages, pageNumber, onPageChange, onProgress],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goToPage(pageNumber + 1);
    else goToPage(pageNumber - 1);
  }, [goToPage, pageNumber]);

  return (
    <div className="pdf-reader">
      <div className="pdf-reader__viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="pdf-reader__page-wrap">
          <div className="pdf-reader__page-label">
            Página {pageNumber} de {numPages}
          </div>
          <div className={`pdf-reader__page-single ${turning ? 'turning' : ''}`}>
            <Document
              file={file}
              onLoadSuccess={onLoadSuccess}
              loading={
                <div className="pdf-reader__loading">
                  <div className="pdf-reader__spinner" />
                  <p>Cargando PDF...</p>
                </div>
              }
              error={
                <div className="pdf-reader__error">
                  <p>No se pudo cargar el PDF.</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={zoom}
                renderTextLayer
                renderAnnotationLayer
                onLoadSuccess={onPageLoadSuccess}
                loading={
                  <div className="pdf-reader__loading">
                    <div className="pdf-reader__spinner" />
                  </div>
                }
              />
            </Document>

            <div className="pdf-reader__page-arrows">
              <div
                className="pdf-reader__page-arrow pdf-reader__page-arrow--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPage(pageNumber - 1);
                }}
              >
                <span className="pdf-reader__arrow-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </span>
              </div>
              <div
                className="pdf-reader__page-arrow pdf-reader__page-arrow--next"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPage(pageNumber + 1);
                }}
              >
                <span className="pdf-reader__arrow-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
