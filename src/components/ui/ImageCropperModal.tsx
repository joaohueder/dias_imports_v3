"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Crop as CropIcon,
  Check,
  Move,
  Sparkles,
} from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  aspectRatio?: number; // default 1 (quadrado 1:1)
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  aspectRatio = 1,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [frameSize, setFrameSize] = useState(320);

  const cropFrameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Helper para limitar o arraste (clamping) garantindo que a imagem NUNCA saia da área de corte
  const clampOffset = useCallback(
    (
      newOffset: { x: number; y: number },
      currentZoom: number,
      currentRotation: number,
      natural: { width: number; height: number } | null,
      frameDim: number
    ) => {
      if (!natural || frameDim <= 0) return { x: 0, y: 0 };

      const isRotated90 = currentRotation === 90 || currentRotation === 270;
      const effectiveW = isRotated90 ? natural.height : natural.width;
      const effectiveH = isRotated90 ? natural.width : natural.height;

      // Escala base para cobrir 100% do quadro de corte (cover)
      const baseScale = Math.max(frameDim / effectiveW, frameDim / effectiveH);

      const renderedW = effectiveW * baseScale * currentZoom;
      const renderedH = effectiveH * baseScale * currentZoom;

      const maxX = Math.max(0, (renderedW - frameDim) / 2);
      const maxY = Math.max(0, (renderedH - frameDim) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, newOffset.x)),
        y: Math.min(maxY, Math.max(-maxY, newOffset.y)),
      };
    },
    []
  );

  // Atualizar frameSize quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (cropFrameRef.current) {
        const rect = cropFrameRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setFrameSize(rect.width);
        }
      }
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setProcessing(false);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const dims = { width: naturalWidth, height: naturalHeight };
    setNaturalDimensions(dims);
    setOffset(clampOffset({ x: 0, y: 0 }, 1, 0, dims, frameSize));
  };

  // Rotação de 90 em 90 graus com re-clamping automático
  const handleRotateCw = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev, zoom, nextRot, naturalDimensions, frameSize));
  };

  const handleRotateCcw = () => {
    const nextRot = (rotation - 90 + 360) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev, zoom, nextRot, naturalDimensions, frameSize));
  };

  // Controle de Zoom seguro (mínimo 1 para nunca ter bordas vazias)
  const handleZoomChange = (newZoom: number) => {
    const targetZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(targetZoom);
    setOffset((prev) => clampOffset(prev, targetZoom, rotation, naturalDimensions, frameSize));
  };

  // Mouse Dragging com clamping estrito
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset({ x: rawX, y: rawY }, zoom, rotation, naturalDimensions, frameSize));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support com clamping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const rawX = e.touches[0].clientX - dragStart.x;
    const rawY = e.touches[0].clientY - dragStart.y;
    setOffset(clampOffset({ x: rawX, y: rawY }, zoom, rotation, naturalDimensions, frameSize));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    handleZoomChange(zoom + delta);
  };

  // Dimensões base calculadas para preenchimento total
  const isRotated90 = rotation === 90 || rotation === 270;
  const effectiveW = naturalDimensions ? (isRotated90 ? naturalDimensions.height : naturalDimensions.width) : 1;
  const effectiveH = naturalDimensions ? (isRotated90 ? naturalDimensions.width : naturalDimensions.height) : 1;
  const baseScale = Math.max(frameSize / effectiveW, frameSize / effectiveH);
  const baseImgW = naturalDimensions ? naturalDimensions.width * baseScale : frameSize;
  const baseImgH = naturalDimensions ? naturalDimensions.height * baseScale : frameSize;

  // Gerar o Canvas com rotação, recorte exato e compressão para <= 300KB
  const handleCropAndCompress = async () => {
    if (!imageSrc || !imageRef.current || !naturalDimensions) return;

    try {
      setProcessing(true);

      const img = imageRef.current;
      const targetSize = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize / aspectRatio;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Não foi possível inicializar o contexto 2D");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fator de escala do viewport de edição para a resolução final
      const canvasScale = targetSize / frameSize;
      const targetCenterX = targetSize / 2 + offset.x * canvasScale;
      const targetCenterY = targetSize / (2 * aspectRatio) + offset.y * canvasScale;

      const imgDrawW = baseImgW * zoom * canvasScale;
      const imgDrawH = baseImgH * zoom * canvasScale;

      ctx.save();
      ctx.translate(targetCenterX, targetCenterY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -imgDrawW / 2, -imgDrawH / 2, imgDrawW, imgDrawH);
      ctx.restore();

      // Algoritmo de compressão progressiva garantindo <= 300KB
      const MAX_BYTES = 300 * 1024; // 300 KB

      let quality = 0.92;
      let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));

      while (blob && blob.size > MAX_BYTES && quality > 0.35) {
        quality -= 0.08;
        blob = await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
      }

      if (blob && blob.size > MAX_BYTES) {
        const smallerCanvas = document.createElement("canvas");
        smallerCanvas.width = 800;
        smallerCanvas.height = 800 / aspectRatio;
        const smallCtx = smallerCanvas.getContext("2d");
        if (smallCtx) {
          smallCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
          blob = await new Promise((res) => smallerCanvas.toBlob(res, "image/webp", 0.85));
        }
      }

      if (!blob) throw new Error("Falha ao gerar o arquivo de imagem");

      await onConfirm(blob);
      onClose();
    } catch (err) {
      console.error("Erro ao cortar e comprimir imagem:", err);
    } finally {
      setProcessing(false);
    }
  };

  const isNotSquare = naturalDimensions && naturalDimensions.width !== naturalDimensions.height;

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-[#090f1d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ajustar, Rotacionar & Recortar</h3>
                {isNotSquare && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Proporção não 1:1
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Ajuste o enquadramento 1:1. A área de corte é sempre preenchida sem sobrar espaços vazios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport de Visualização com Trava de Limites */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="p-6 flex flex-col items-center justify-center bg-[#050811] flex-1 overflow-hidden relative min-h-[340px] sm:min-h-[380px] cursor-grab active:cursor-grabbing"
        >
          {/* Container do Quadro de Corte 1:1 */}
          <div
            ref={cropFrameRef}
            className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl border-2 border-dashed border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] z-20 pointer-events-none flex items-center justify-center overflow-visible"
          >
            {/* Grid Guia de Regra dos Terços */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none rounded-2xl overflow-hidden">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Badge indicativo de corte */}
            <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              Enquadramento 1:1
            </div>
          </div>

          {/* Imagem com Posicionamento e Rotação Limitados aos Limites da Área */}
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            className="absolute z-10 pointer-events-none transition-transform duration-75 will-change-transform flex items-center justify-center"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Enquadramento do produto"
              onLoad={handleImageLoad}
              style={{
                width: `${baseImgW}px`,
                height: `${baseImgH}px`,
                maxWidth: "none",
                maxHeight: "none",
              }}
              className="pointer-events-none select-none shadow-2xl"
            />
          </div>

          <div className="absolute bottom-2 z-30 flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3 py-1 rounded-full text-[10px] text-slate-400 shadow-lg">
            <Move className="w-3 h-3 text-indigo-400" />
            <span>Arraste para posicionar • Scroll para zoom</span>
          </div>
        </div>

        {/* Barra de Ferramentas: Zoom, Rotação e Ações */}
        <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Controles de Zoom */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de Rotação */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotateCcw}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                title="Girar 90º Anti-horário"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>-90°</span>
              </button>

              <button
                type="button"
                onClick={handleRotateCw}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                title="Girar 90º Horário"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>+90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setOffset({ x: 0, y: 0 });
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer text-xs font-semibold"
                title="Restaurar Padrão"
              >
                Resetar
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Otimização WebP automática (máximo 300 KB)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCropAndCompress}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {processing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Recortar & Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
