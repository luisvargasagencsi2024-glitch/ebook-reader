import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import './FileLoader.css';

interface FileLoaderProps {
  onFile: (file: File) => void;
}

export function FileLoader({ onFile }: FileLoaderProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <div
      className={`file-loader ${dragging ? 'file-loader--dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf"
        onChange={handleChange}
        className="file-loader__input"
      />
      <div className="file-loader__content">
        <div className="file-loader__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4M8 8l4-4 4 4" />
            <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
          </svg>
        </div>
        <h2 className="file-loader__title">Arrastra tu e-book aquí</h2>
        <p className="file-loader__subtitle">o haz clic para seleccionar un archivo</p>
        <p className="file-loader__formats">Formatos soportados: EPUB, PDF</p>
      </div>
    </div>
  );
}
