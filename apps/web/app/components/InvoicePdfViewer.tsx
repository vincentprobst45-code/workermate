'use client';

import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type InvoicePdfViewerProps = {
  src: string;
  title: string;
};

export default function InvoicePdfViewer({ src, title }: InvoicePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPageNumber(1);
    setPdf(null);

    const loadingTask = getDocument({ url: src });
    void loadingTask.promise.then((loadedPdf) => {
      if (cancelled) {
        return;
      }
      setPdf(loadedPdf);
      setPageCount(loadedPdf.numPages);
    }).catch(() => {
      if (!cancelled) setError('Impossible de charger l’aperçu PDF.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [src]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !stageRef.current) return;
    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy['render']> | undefined;

    void pdf.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current || !stageRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(240, stageRef.current.clientWidth - 24);
      const fitScale = availableWidth / baseViewport.width;
      const viewport = page.getViewport({ scale: fitScale * scale });
      const outputScale = window.devicePixelRatio || 1;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({ canvas: canvas, canvasContext: context, viewport, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined });
      return renderTask.promise;
    }).catch(() => {
      if (!cancelled) setError('Impossible de rendre la page PDF.');
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div ref={stageRef} className="relative flex min-h-[28rem] flex-1 items-start justify-center overflow-auto p-3">
        {loading && <p className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-slate-500">Génération de l’aperçu...</p>}
        {error && <p className="absolute inset-0 z-10 flex items-center justify-center bg-white p-5 text-center text-sm text-red-700">{error}</p>}
        <canvas ref={canvasRef} aria-label={title} className="block max-w-full bg-white shadow-sm" />
        <button type="button" onClick={() => setShowControls((current) => !current)} className="absolute right-4 top-4 rounded-md border border-slate-300 bg-white/95 p-2 text-slate-700 shadow-sm hover:bg-white" aria-label={showControls ? 'Masquer les contrôles' : 'Afficher les contrôles'} title={showControls ? 'Masquer les contrôles' : 'Afficher les contrôles'}>
          {showControls ? <Minimize2 size={16} /> : <SlidersHorizontal size={16} />}
        </button>
      </div>
      {showControls && <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((current) => Math.max(1, current - 1))} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Page précédente"><ChevronLeft size={17} /></button>
        <span className="min-w-20 text-center text-xs">Page {pageNumber} / {pageCount || '-'}</span>
        <button type="button" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Page suivante"><ChevronRight size={17} /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" disabled={scale <= 0.8} onClick={() => setScale((current) => Math.max(0.8, Number((current - 0.1).toFixed(1))))} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Réduire le zoom"><Minus size={16} /></button>
        <span className="min-w-12 text-center text-xs">{Math.round(scale * 100)}%</span>
        <button type="button" disabled={scale >= 1.8} onClick={() => setScale((current) => Math.min(1.8, Number((current + 0.1).toFixed(1))))} className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40" aria-label="Augmenter le zoom"><Plus size={16} /></button>
        <a href={src} target="_blank" rel="noreferrer" className="ml-1 rounded p-1.5 hover:bg-slate-100" aria-label="Ouvrir le PDF en grand" title="Ouvrir le PDF en grand"><Maximize2 size={16} /></a>
      </div>}
    </div>
  );
}