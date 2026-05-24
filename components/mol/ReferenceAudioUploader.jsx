'use client';

import { useRef, useState } from 'react';

const LABELS = {
  en: {
    title: 'Reference Audio',
    subtitle: 'Upload an audio file to use as reference',
    dragHint: 'Drag and drop your audio file here or click to select',
    uploading: 'Uploading...',
    uploaded: 'Uploaded: ',
    error: 'Upload failed',
  },
  es: {
    title: 'Audio de Referencia',
    subtitle: 'Sube un archivo de audio como referencia',
    dragHint: 'Arrastra y suelta tu archivo de audio aquí o haz clic para seleccionar',
    uploading: 'Cargando...',
    uploaded: 'Cargado: ',
    error: 'La carga falló',
  },
};

export default function ReferenceAudioUploader({ onUpload, locale = 'en' }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState(null);

  const t = LABELS[locale];

  const handleFile = async (file) => {
    if (!file.type.startsWith('audio/')) {
      setError(t.error);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploaded(file.name);
      onUpload(data.assetId);
    } catch (err) {
      setError(t.error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-500', 'bg-purple-900/20');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-900/20');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-900/20');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-1">{t.title}</h2>
      <p className="text-sm text-purple-200 mb-4">{t.subtitle}</p>

      <div
        ref={inputRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.querySelector('input')?.click()}
        className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer transition hover:border-purple-500/60 hover:bg-purple-900/10"
      >
        <input
          type="file"
          accept="audio/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {isUploading ? (
          <div className="text-purple-300">{t.uploading}</div>
        ) : uploaded ? (
          <div className="text-green-400">
            ✓ {t.uploaded}
            <span className="block text-sm">{uploaded}</span>
          </div>
        ) : (
          <div className="text-purple-300">{t.dragHint}</div>
        )}
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
}
