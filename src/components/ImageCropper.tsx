import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ file, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CANVAS_SIZE = 300;

  // Load image from file
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      // Fit image so shorter side fills the canvas
      const minDim = Math.min(image.width, image.height);
      setScale(CANVAS_SIZE / minDim);
      setOffset({
        x: (CANVAS_SIZE - image.width * (CANVAS_SIZE / minDim)) / 2,
        y: (CANVAS_SIZE - image.height * (CANVAS_SIZE / minDim)) / 2,
      });
    };
    image.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(image.src);
  }, [file]);

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#0f1520';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
  }, [img, scale, offset]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse/Touch handlers for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setDragging(false);

  // Zoom
  const zoom = (dir: number) => {
    setScale(prev => {
      const next = prev + dir * 0.1;
      return Math.max(0.1, Math.min(5, next));
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1 : -1);
  };

  // Export cropped image
  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create output canvas at higher resolution
    const outputSize = 512;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const ctx = outCanvas.getContext('2d');
    if (!ctx || !img) return;

    // Scale from preview to output
    const ratio = outputSize / CANVAS_SIZE;
    ctx.drawImage(img, offset.x * ratio, offset.y * ratio, img.width * scale * ratio, img.height * scale * ratio);

    outCanvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      onCrop(croppedFile);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="glass rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">Crop Image (1:1)</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
        </div>

        <p className="text-xs text-gray-500">Drag to reposition • scroll to zoom</p>

        {/* Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl border-2 border-white/10 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => zoom(-1)} className="p-2 rounded-lg glass text-gray-400 hover:text-white transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 w-14 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(1)} className="p-2 rounded-lg glass text-gray-400 hover:text-white transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          <button onClick={handleCrop}
            className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow">
            <Check className="-ml-0.5 mr-1.5 h-4 w-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};
