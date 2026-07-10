export type BookFormat = 'epub' | 'pdf';

export interface FileState {
  file: File | null;
  bookUrl: string | null;
  format: BookFormat | null;
}
