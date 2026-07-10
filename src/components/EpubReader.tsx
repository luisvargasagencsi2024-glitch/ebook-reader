import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactReader } from 'react-book-reader';
import { api, type HighlightData } from '../api/client';
import './EpubReader.css';

interface TocItem {
  label: string;
  href: string;
  subitems?: TocItem[];
}

interface EpubReaderProps {
  url: string;
  fontSize: number;
  showToc: boolean;
  bookId: string;
  onLocationChange?: (cfi: string, progress: number) => void;
  onHighlightCreated?: () => void;
}

function getCfiFromRange(_range: Range, rendition: Record<string, unknown>): string {
  try {
    const book = (rendition as Record<string, unknown>).book as Record<string, unknown> | undefined;
    if (book && typeof (book as Record<string, unknown>).getCFI === 'function') {
      const renderer = (rendition as Record<string, unknown>).renderer as { getContents: () => { index: number }[] } | undefined;
      if (!renderer) return '';
      const contents = renderer.getContents();
      const idx = contents[0]?.index ?? 0;
      return (book as { getCFI: (idx: number, range: Range) => string }).getCFI(idx, _range);
    }
  } catch {}
  return '';
}

export function EpubReader({ url, fontSize, showToc, bookId, onLocationChange, onHighlightCreated }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const renditionRef = useRef<Record<string, unknown> | null>(null);
  const [toolbar, setToolbar] = useState<{ visible: boolean; top: number; left: number; text: string; range: Range | null }>({ visible: false, top: 0, left: 0, text: '', range: null });
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const appliedHighlightKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (bookId) {
      api.highlights.list(bookId).then(setHighlights).catch(() => {});
    }
  }, [bookId]);

  const tocChanged = useCallback((items: TocItem[]) => {
    setToc(items);
  }, []);

  const locationChanged = useCallback(
    (epubcfi: string) => {
      setLocation(epubcfi);
      const r = renditionRef.current;
      let pct = 0;
      if (r && typeof r.locations === 'object' && r.locations && typeof (r.locations as Record<string, unknown>).percentageFromCfi === 'function') {
        pct = ((r.locations as Record<string, unknown>).percentageFromCfi as (cfi: string) => number)(epubcfi);
      }
      onLocationChange?.(epubcfi, pct);
    },
    [onLocationChange],
  );

  const applyHighlightToDoc = useCallback((doc: Document, hlText: string, key: string) => {
    if (appliedHighlightKeys.current.has(key)) return;
    const body = doc.body;
    if (!body || !hlText) return;
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const idx = node.textContent?.indexOf(hlText);
      if (idx !== undefined && idx !== -1) {
        try {
          const range = doc.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + hlText.length);
          const span = doc.createElement('span');
          span.style.background = '#fef08a';
          span.style.borderRadius = '2px';
          range.surroundContents(span);
          appliedHighlightKeys.current.add(key);
        } catch {}
        break;
      }
    }
  }, []);

  const restoreHighlights = useCallback(() => {
    const r = renditionRef.current;
    if (!r || highlights.length === 0) return;
    const renderer = (r as Record<string, unknown>).renderer as { getContents: () => { document?: Document }[] } | undefined;
    if (!renderer) return;
    const contents = renderer.getContents();
    for (const c of contents) {
      const doc = c.document;
      if (!doc) continue;
      for (const hl of highlights) {
        const key = `hl-${hl._id}`;
        applyHighlightToDoc(doc, hl.text, key);
      }
    }
  }, [highlights, applyHighlightToDoc]);

  useEffect(() => {
    restoreHighlights();
  }, [restoreHighlights]);

  useEffect(() => {
    const r = renditionRef.current;
    if (!r) return;
    const renderer = (r as Record<string, unknown>).renderer as {
      addEventListener?: (e: string, cb: (e: CustomEvent) => void) => void;
      getContents?: () => { document?: Document }[];
    } | undefined;
    if (!renderer) return;

    const handleSelection = () => {
      const contents = renderer.getContents?.();
      if (!contents) return;
      for (const c of contents) {
        const doc = c.document;
        if (!doc) continue;
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) continue;
        const range = sel.getRangeAt(0);
        const text = range.toString().trim();
        if (!text || text.length < 2) return;

        const vr = doc.querySelector('.epub-reader__view')?.getBoundingClientRect();
        const host = document.querySelector('.epub-reader__view')?.getBoundingClientRect();
        if (!vr || !host) return;

        const rect = range.getBoundingClientRect();
        setToolbar({
          visible: true,
          top: rect.top - vr.top + host.top - 50,
          left: rect.left - vr.left + host.left + rect.width / 2,
          text,
          range,
        });
        return;
      }
    };

    const handleMouseDown = () => {
      setToolbar(prev => ({ ...prev, visible: false }));
    };

    for (const c of renderer.getContents?.() ?? []) {
      c.document?.addEventListener('mouseup', handleSelection);
      c.document?.addEventListener('mousedown', handleMouseDown);
    }

    renderer.addEventListener?.('load', () => {
      setTimeout(restoreHighlights, 500);
    });

    return () => {
      for (const c of renderer.getContents?.() ?? []) {
        c.document?.removeEventListener('mouseup', handleSelection);
        c.document?.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [renditionRef.current, restoreHighlights]);

  const handleHighlight = async () => {
    if (!toolbar.range || !toolbar.text || !bookId) return;
    const r = renditionRef.current;
    if (!r) return;

    const cfi = getCfiFromRange(toolbar.range, r);

    const renderer = (r as Record<string, unknown>).renderer as { getContents: () => { document?: Document }[] } | undefined;
    const contents = renderer?.getContents();
    if (contents) {
      for (const c of contents) {
        const doc = c.document;
        if (!doc) continue;
        const key = `sel-${Date.now()}`;
        applyHighlightToDoc(doc, toolbar.text, key);
      }
    }

    try {
      await api.highlights.create({ bookId, text: toolbar.text, location: cfi, color: '#fef08a', page: 0 });
      const updated = await api.highlights.list(bookId);
      setHighlights(updated);
      onHighlightCreated?.();
    } catch {}

    setToolbar({ visible: false, top: 0, left: 0, text: '', range: null });
  };

  const handleTocClick = (href: string) => {
    const r = renditionRef.current;
    if (r && typeof r.goToChapter === 'function') {
      (r.goToChapter as (h: string) => void)(href);
    }
  };

  return (
    <div className="epub-reader">
      {showToc && toc.length > 0 && (
        <nav className="epub-reader__toc">
          <h3 className="epub-reader__toc-title">Contenido</h3>
          <ul className="epub-reader__toc-list">
            {toc.map((item, i) => (
              <li key={i}>
                <button
                  className="epub-reader__toc-link"
                  onClick={() => handleTocClick(item.href)}
                >
                  {item.label}
                </button>
                {item.subitems && (
                  <ul className="epub-reader__toc-sublist">
                    {item.subitems.map((sub: TocItem, j: number) => (
                      <li key={j}>
                        <button
                          className="epub-reader__toc-link"
                          onClick={() => handleTocClick(sub.href)}
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="epub-reader__book">
        <div className="epub-reader__view">
          <ReactReader
            url={url}
            location={location}
            locationChanged={locationChanged}
            tocChanged={tocChanged}
            getRendition={(rendition: Record<string, unknown>) => {
              renditionRef.current = rendition;
            }}
            readerStyles={{
              fontSize: `${fontSize}px`,
            }}
            epubOptions={{
              spread: 'none',
            }}
          />
          {toolbar.visible && (
            <div
              className="epub-reader__toolbar"
              style={{
                position: 'absolute',
                top: toolbar.top,
                left: toolbar.left,
                transform: 'translateX(-50%)',
              }}
            >
              <button className="epub-reader__toolbar-btn" onClick={handleHighlight}>
                Resaltar
              </button>
              <span className="epub-reader__toolbar-text" title={toolbar.text}>
                {toolbar.text.substring(0, 30)}{toolbar.text.length > 30 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
