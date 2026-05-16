'use client';
/**
 * FileUploader — drag-and-drop media upload to backend.
 * No provider secrets involved — uploads go to our API.
 * Design: Taste-Skill asymmetric, Bento motion.
 */

import { useState, useCallback } from 'react';
import { uploadAsset } from '@/lib/apiClient';

/**
 * @param {{ projectId: string, accept?: string, label?: string, onUploaded?: (asset) => void }} props
 */
export default function FileUploader({ projectId, accept = 'audio/*,video/*,image/*', label = 'Drop or click to upload', onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [lastAsset, setLastAsset] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!projectId) { setError('No project selected'); return; }
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const asset = await uploadAsset(projectId, file);
      setLastAsset(asset);
      setProgress(1);
      onUploaded?.(asset);
    } catch (e) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [projectId, onUploaded]);

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = e => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <label
      className={[
        'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3',
        'rounded-2xl border-2 border-dashed transition-all duration-300',
        dragging
          ? 'border-violet-400 bg-violet-950/20 scale-[1.01]'
          : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60',
      ].join(' ')}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input type="file" accept={accept} className="sr-only" onChange={onInputChange} />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-sm text-zinc-400">Uploading…</span>
        </div>
      ) : lastAsset ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">✓</span>
          <span className="text-sm text-emerald-400 font-medium">{lastAsset.originalFilename}</span>
          <span className="text-xs text-zinc-500">{lastAsset.kind} · {lastAsset.id.slice(0, 16)}…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <span className="text-3xl opacity-40">↑</span>
          <span className="text-sm text-zinc-400">{label}</span>
          <span className="text-xs text-zinc-600">{accept.replace(/,/g, ' · ')}</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-red-950/60 border border-red-900/40 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </label>
  );
}
