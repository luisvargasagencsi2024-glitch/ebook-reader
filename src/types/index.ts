export type BookFormat = 'epub' | 'pdf' | 'audio';

export interface FileState {
  file: File | null;
  bookUrl: string | null;
  format: BookFormat | null;
}
