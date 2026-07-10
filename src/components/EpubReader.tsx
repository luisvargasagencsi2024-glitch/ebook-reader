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

function findTextInDoc(doc: Document, text: string): Range | null {
  const body = doc.body;
  if (!body || !text) return null;
  const fullText = body.textContent || '';
  const idx = fullText.indexOf(text);
  if (idx === -1) return null;
  const treeWalker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = treeWalker.nextNode() as Text | null)) {
    textNodes.push(node);
  }
  let charCount = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  let found = false;
  for (const tn of textNodes) {
    const len = tn.textContent?.length ?? 0;
    if (!found) {
      if (charCount + len > idx) {
        startNode = tn;
        startOffset = idx - charCount;
        found = true;
      }
    }
    if (found) {
      if (charCount + len >= idx + text.length) {
        endNode = tn;
        endOffset = idx + text.length - charCount;
        break;
      }
    }
    charCount += len;
  }
  if (!startNode || !endNode) return null;
  try {
    const range = doc.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  } catch {
    return null;
  }
}

export function EpubReader({ url, fontSize, showToc, bookId, onLocationChange, onHighlightCreated }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [rendition, setRendition] = useState<Record<string, unknown> | null>(null);
  const [toolbar, setToolbar] = useState<{ visible: boolean; top: number; left: number; text: string; range: Range | null }>({ visible: false, top: 0, left: 0, text: '', range: null });
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const appliedHighlightKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (bookId) {
      api.highlights.list(bookId).then(setHighlights).catch(() => {});
    }
  }, [bookId]);

  useEffect(() => {
    const r = rendition;
    if (!r) return;
    const renderer = (r as Record<string, unknown>).renderer as { getContents?: () => { document?: Document }[] } | undefined;
    if (!renderer) return;
    const contents = renderer.getContents?.() ?? [];
    for (const c of contents) {
      const doc = c.document;
      if (doc) doc.documentElement.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize, rendition]);

  const tocChanged = useCallback((items: TocItem[]) => {
    setToc(items);
  }, []);

  const locationChanged = useCallback(
    (epubcfi: string) => {
      setLocation(epubcfi);
      const r = rendition;
      let pct = 0;
      if (r && typeof r.locations === 'object' && r.locations && typeof (r.locations as Record<string, unknown>).percentageFromCfi === 'function') {
        pct = ((r.locations as Record<string, unknown>).percentageFromCfi as (cfi: string) => number)(epubcfi);
      }
      onLocationChange?.(epubcfi, pct);
    },
    [onLocationChange, rendition],
  );

  const applyHighlightToDoc = useCallback((doc: Document, hlText: string, key: string) => {
    if (appliedHighlightKeys.current.has(key)) return;
    const range = findTextInDoc(doc, hlText);
    if (!range) return;
    try {
      const span = doc.createElement('span');
      span.style.background = '#fef08a';
      span.style.borderRadius = '2px';
      range.surroundContents(span);
      appliedHighlightKeys.current.add(key);
    } catch {}
  }, []);

  const restoreHighlights = useCallback(() => {
    const r = rendition;
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
  }, [highlights, applyHighlightToDoc, rendition]);

  useEffect(() => {
    restoreHighlights();
  }, [restoreHighlights]);

  useEffect(() => {
    const r = rendition;
    if (!r) return;
    const renderer = (r as Record<string, unknown>).renderer as {
      addEventListener?: (e: string, cb: (e: CustomEvent) => void) => void;
      getContents?: () => { document?: Document }[];
    } | undefined;
    if (!renderer) return;

    const contents = renderer.getContents?.() ?? [];

    const handleSelection = () => {
      const currentContents = renderer.getContents?.();
      if (!currentContents) return;
      for (const c of currentContents) {
        const doc = c.document;
        if (!doc) continue;
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) continue;
        const range = sel.getRangeAt(0);
        const text = range.toString().trim();
        if (!text || text.length < 2) return;

        const rect = range.getBoundingClientRect();
        const iFrame = doc.defaultView?.frameElement as HTMLElement | null;
        const iframeRect = iFrame?.getBoundingClientRect();

        setToolbar({
          visible: true,
          top: (iframeRect?.top ?? 0) + rect.top - 50,
          left: (iframeRect?.left ?? 0) + rect.left + rect.width / 2,
          text,
          range,
        });
        return;
      }
    };

    const handleMouseDown = () => {
      setToolbar(prev => ({ ...prev, visible: false }));
    };

    for (const c of contents) {
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
  }, [rendition, restoreHighlights]);

  const handleHighlight = async () => {
    if (!toolbar.range || !toolbar.text || !bookId) return;
    const r = rendition;
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
    const r = rendition;
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
            getRendition={(r) => setRendition(r)}
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
