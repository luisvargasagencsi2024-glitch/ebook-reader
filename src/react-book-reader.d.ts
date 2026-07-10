declare module 'react-book-reader' {
  import type { ReactNode } from 'react';

  interface TocItem {
    label: string;
    href: string;
    subitems?: TocItem[];
  }

  interface ReactReaderProps {
    url: string;
    location?: string | number;
    locationChanged?: (epubcfi: string) => void;
    tocChanged?: (toc: TocItem[]) => void;
    getRendition?: (rendition: Record<string, unknown>) => void;
    readerStyles?: Record<string, string>;
    loadingView?: ReactNode;
    title?: string;
    showToc?: boolean;
    swipeable?: boolean;
    epubInitOptions?: Record<string, unknown>;
    epubOptions?: Record<string, unknown>;
  }

  export const ReactReader: React.FC<ReactReaderProps>;
  export const BookView: React.FC<ReactReaderProps>;
  export default ReactReader;
}
