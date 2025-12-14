import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Crop, 
  Move,
  ZoomIn,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Highlighter,
  ScanLine,
  Grid,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Smartphone,
  Monitor,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Settings2,
  IdCard,
  FileText,
  Eye,
  CornerUpLeft,
  Check
} from 'lucide-react';

type Point = { x: number; y: number };

const ASPECT_RATIOS = [
  { id: 'original', label: 'Original', value: 0, icon: ImageIcon },
  { id: 'square', label: 'Square (1:1)', value: 1, icon: Square },
  { id: 'passport_eu', label: 'Passport (3.5x4.5)', value: 3.5/4.5, icon: IdCard },
  { id: 'passport_us', label: 'Passport (2x2")', value: 1, icon: IdCard },
  { id: '4_3', label: 'Standard (4:3)', value: 4/3, icon: RectangleHorizontal },
  { id: 'landscape', label: 'YouTube (16:9)', value: 16/9, icon: RectangleHorizontal },
  { id: 'portrait', label: 'Portrait (4:5)', value: 4/5, icon: RectangleVertical },
  { id: 'story', label: 'Story (9:16)', value: 9/16, icon: Smartphone },
  { id: 'a4', label: 'A4 Document', value: 1/1.414, icon: FileText },
  { id: 'twitter', label: 'Twitter Header', value: 3, icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn Cover', value: 4, icon: Linkedin },
];

const ImageCropper: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'standard' | 'magic'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ----------------------------------------------------
  // STANDARD CROP STATE
  // ----------------------------------------------------
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [activeRatioId, setActiveRatioId] = useState<string>('original');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [flip, setFlip] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  
  // Layout State for calculating container size
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState<{ width: number, height: number } | null>(null);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [exportQuality, setExportQuality] = useState<number>(95);
  const [qualityMode, setQualityMode] = useState<'web' | 'original'>('original');

  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStartPan, setDragStartPan] = useState<Point>({ x: 0, y: 0 });

  // ----------------------------------------------------
  // MAGIC CROP STATE
  // ----------------------------------------------------
  const [points, setPoints] = useState<Point[]>([
    { x: 0.2, y: 0.2 }, // TL
    { x: 0.8, y: 0.2 }, // TR
    { x: 0.8, y: 0.8 }, // BR
    { x: 0.2, y: 0.8 }  // BL
  ]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  
  // Magic Mode Preview State
  const [magicStep, setMagicStep] = useState<'edit' | 'preview'>('edit');
  const [magicPreviewSrc, setMagicPreviewSrc] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const magicContainerRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      
      // Load image to get initial dimensions
      const img = new Image();
      img.onload = () => {
        const ar = img.width / img.height;
        setOriginalAspectRatio(ar);
        setAspectRatio(ar);
        setActiveRatioId('original');
        setImageSrc(url);
      };
      img.src = url;
      
      // Reset States
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setFlip({ x: false, y: false });
      
      setPoints([
        { x: 0.2, y: 0.2 }, 
        { x: 0.8, y: 0.2 }, 
        { x: 0.8, y: 0.8 }, 
        { x: 0.2, y: 0.8 }
      ]);

      setMagicStep('edit');
      setMagicPreviewSrc(null);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Recalculate box size when aspect ratio changes or window resizes
  const updateBoxSize = useCallback(() => {
    if (!wrapperRef.current) return;
    const { width: wrapperWidth, height: wrapperHeight } = wrapperRef.current.getBoundingClientRect();
    
    // Add safety margin
    const padding = 32; 
    const availW = wrapperWidth - padding;
    const availH = wrapperHeight - padding;

    if (availW <= 0 || availH <= 0) return;

    let newW = availW;
    let newH = newW / aspectRatio;

    if (newH > availH) {
      newH = availH;
      newW = newH * aspectRatio;
    }

    setBoxSize({ width: newW, height: newH });
  }, [aspectRatio]);

  useEffect(() => {
    updateBoxSize();
    window.addEventListener('resize', updateBoxSize);
    return () => window.removeEventListener('resize', updateBoxSize);
  }, [updateBoxSize, file]); // Re-run when file changes too

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ----------------------------------------------------
  // STANDARD CROP LOGIC
  // ----------------------------------------------------
  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (activeMode !== 'standard') return;
    e.preventDefault();
    setIsDraggingPan(true);
    setDragStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (!isDraggingPan || activeMode !== 'standard') return;
    setPan({
      x: e.clientX - dragStartPan.x,
      y: e.clientY - dragStartPan.y
    });
  };

  const handleMouseUpPan = () => {
    setIsDraggingPan(false);
  };

  const rotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);
  const flipHorizontal = () => setFlip(prev => ({ ...prev, x: !prev.x }));
  const flipVertical = () => setFlip(prev => ({ ...prev, y: !prev.y }));

  // ----------------------------------------------------
  // MAGIC CROP LOGIC (Perspective Warp)
  // ----------------------------------------------------
  const handlePointDragStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setActivePointIndex(index);
  };

  const handlePointDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (activePointIndex === null || !magicContainerRef.current) return;

    const rect = magicContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;

    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[activePointIndex] = { x, y };
      return newPoints;
    });
  }, [activePointIndex]);

  const handlePointDragEnd = useCallback(() => {
    setActivePointIndex(null);
  }, []);

  useEffect(() => {
    if (activePointIndex !== null) {
      window.addEventListener('mousemove', handlePointDragMove);
      window.addEventListener('mouseup', handlePointDragEnd);
      window.addEventListener('touchmove', handlePointDragMove);
      window.addEventListener('touchend', handlePointDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointDragMove);
      window.removeEventListener('mouseup', handlePointDragEnd);
      window.removeEventListener('touchmove', handlePointDragMove);
      window.removeEventListener('touchend', handlePointDragEnd);
    };
  }, [activePointIndex, handlePointDragMove, handlePointDragEnd]);

  // ----------------------------------------------------
  // DOWNLOAD LOGIC
  // ----------------------------------------------------
  const getPerspectiveTransform = (src: Point[], dst: Point[]) => {
    const a = [], b = [];
    for (let i = 0; i < 4; ++i) {
      a.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
      a.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
      b.push(dst[i].x);
      b.push(dst[i].y);
    }
    const solve = (A: number[][], B: number[]) => {
        const n = B.length;
        for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(A[i][i]), maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
            }
            for (let k = i; k < n; k++) { let tmp = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = tmp; }
            let tmp = B[maxRow]; B[maxRow] = B[i]; B[i] = tmp;
            for (let k = i + 1; k < n; k++) {
                const c = -A[k][i] / A[i][i];
                for (let j = i; j < n; j++) { if (i === j) A[k][j] = 0; else A[k][j] += c * A[i][j]; }
                B[k] += c * B[i];
            }
        }
        const x = new Array(n).fill(0);
        for (let i = n - 1; i > -1; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
            x[i] = (B[i] - sum) / A[i][i];
        }
        return x;
    }
    const h = solve(a, b);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  };

  const handleDownload = async () => {
    if (!imageRef.current && !magicPreviewSrc) return;
    setIsProcessing(true);
    setTimeout(() => {
        if (activeMode === 'standard') {
            downloadStandardCrop();
        } else {
            downloadMagicCrop();
        }
        setIsProcessing(false);
    }, 100);
  };

  const downloadStandardCrop = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    
    // 1. Create a "Virtual Image" canvas that includes rotation/flips
    const tempCanvas = document.createElement('canvas');
    const rad = (rotation * Math.PI) / 180;
    
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const newWidth = width * cos + height * sin;
    const newHeight = width * sin + height * cos;

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.translate(newWidth / 2, newHeight / 2);
    tCtx.rotate(rad);
    tCtx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
    tCtx.drawImage(img, -width / 2, -height / 2);

    // 2. Crop logic
    const imgRect = img.getBoundingClientRect(); 
    const containerRect = containerRef.current!.getBoundingClientRect();
    
    let outputWidth;
    if (qualityMode === 'web') {
      outputWidth = 1080;
    } else {
      const resolutionRatio = tempCanvas.width / imgRect.width; 
      outputWidth = containerRect.width * resolutionRatio;
      if (outputWidth > 8000) outputWidth = 8000;
    }
    
    const outputHeight = outputWidth / aspectRatio;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.round(outputWidth);
    finalCanvas.height = Math.round(outputHeight);
    
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    const scaleToCanvas = finalCanvas.width / containerRect.width;
    const relX = imgRect.left - containerRect.left;
    const relY = imgRect.top - containerRect.top;
    
    ctx.save();
    ctx.translate(relX * scaleToCanvas, relY * scaleToCanvas);
    const drawWidth = imgRect.width * scaleToCanvas;
    const drawHeight = imgRect.height * scaleToCanvas;
    ctx.drawImage(tempCanvas, 0, 0, drawWidth, drawHeight);
    ctx.restore();

    triggerDownload(finalCanvas, 'standard');
  };

  const getMagicCanvas = (): HTMLCanvasElement | null => {
    if (!imageRef.current) return null;
    const img = imageRef.current;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    
    const srcPoints = points.map(p => ({
        x: p.x * w,
        y: p.y * h
    }));

    const widthTop = Math.hypot(srcPoints[1].x - srcPoints[0].x, srcPoints[1].y - srcPoints[0].y);
    const widthBottom = Math.hypot(srcPoints[2].x - srcPoints[3].x, srcPoints[2].y - srcPoints[3].y);
    const heightLeft = Math.hypot(srcPoints[3].x - srcPoints[0].x, srcPoints[3].y - srcPoints[0].y);
    const heightRight = Math.hypot(srcPoints[2].x - srcPoints[1].x, srcPoints[2].y - srcPoints[1].y);

    const destWidth = Math.max(widthTop, widthBottom);
    const destHeight = Math.max(heightLeft, heightRight);

    const canvas = document.createElement('canvas');
    if (qualityMode === 'web') {
        const scale = 1080 / destWidth;
        canvas.width = 1080;
        canvas.height = destHeight * scale;
    } else {
        canvas.width = destWidth;
        canvas.height = destHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if(!tempCtx) return null;
    tempCtx.drawImage(img, 0, 0);
    const srcData = tempCtx.getImageData(0, 0, w, h);
    const destData = ctx.createImageData(canvas.width, canvas.height);

    const dstPoints = [
        {x: 0, y: 0},
        {x: canvas.width, y: 0},
        {x: canvas.width, y: canvas.height},
        {x: 0, y: canvas.height}
    ];

    const H = getPerspectiveTransform(dstPoints, srcPoints);
    const srcPixels = srcData.data;
    const dstPixels = destData.data;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const den = H[6]*x + H[7]*y + 1;
            const srcX = (H[0]*x + H[1]*y + H[2]) / den;
            const srcY = (H[3]*x + H[4]*y + H[5]) / den;

            if (srcX >= 0 && srcX < w - 1 && srcY >= 0 && srcY < h - 1) {
                const x0 = Math.floor(srcX);
                const x1 = x0 + 1;
                const y0 = Math.floor(srcY);
                const y1 = y0 + 1;
                const u = srcX - x0;
                const v = srcY - y0;
                const idxDst = (y * canvas.width + x) * 4;
                const idx = (x: number, y: number) => (y * w + x) * 4;
                const i00 = idx(x0, y0);
                const i10 = idx(x1, y0);
                const i01 = idx(x0, y1);
                const i11 = idx(x1, y1);
                for (let c = 0; c < 3; c++) {
                   const val = (1-u)*(1-v)*srcPixels[i00+c] + u*(1-v)*srcPixels[i10+c] + (1-u)*v*srcPixels[i01+c] + u*v*srcPixels[i11+c];
                   dstPixels[idxDst + c] = val;
                }
                dstPixels[idxDst + 3] = 255;
            }
        }
    }
    ctx.putImageData(destData, 0, 0);
    return canvas;
  };

  const downloadMagicCrop = () => {
    // Use preview src if available to avoid re-calculation if user is satisfied
    // However, recalculating ensures fresh settings are applied (like format)
    const canvas = getMagicCanvas();
    if(canvas) triggerDownload(canvas, 'magic');
  };

  const handleMagicPreview = () => {
      setIsProcessing(true);
      setTimeout(() => {
          const canvas = getMagicCanvas();
          if(canvas) {
              setMagicPreviewSrc(canvas.toDataURL());
              setMagicStep('preview');
          }
          setIsProcessing(false);
      }, 50);
  };

  const triggerDownload = (canvas: HTMLCanvasElement, prefix: string) => {
    const ext = exportFormat.split('/')[1];
    const dataUrl = canvas.toDataURL(exportFormat, exportQuality / 100);
    const link = document.createElement('a');
    link.download = `cropped-${prefix}.${ext}`;
    link.href = dataUrl;
    link.click();
  };

  // ----------------------------------------------------------------------
  // VIEW: EMPTY STATE
  // ----------------------------------------------------------------------
  if (!file) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] flex items-center gap-3">
              <Crop className="w-10 h-10 text-[#059669]" />
              Image Cropper & Scanner
            </h1>
            <p className="text-xl text-[#475569] mt-3 max-w-2xl">
              Crop images or use Magic Scan to fix perspective distortion instantly.
            </p>
          </div>
          <div 
            className="bg-white border-2 border-dashed border-[#CBD5E1] rounded-3xl p-16 md:p-24 text-center hover:border-[#059669] transition-colors cursor-pointer shadow-sm hover:shadow-md group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-[#059669]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-3">Upload Image</h3>
            <p className="text-lg text-[#64748B] mb-8">Drag and drop or click to browse files</p>
            <button className="bg-[#059669] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#047857] transition-colors shadow-lg">
              Select Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: EDITOR
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Edit Image</h1>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => setFile(null)}
                className="text-[#475569] hover:text-[#EF4444] font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
             >
                Reset
             </button>
             <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="bg-[#059669] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#047857] transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
             >
                {isProcessing ? 'Processing...' : <><Download className="w-4 h-4" /> Download Result</>}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
          
          {/* EDITOR CANVAS (Main Area) */}
          <div className="lg:col-span-8 bg-[#1E293B] rounded-3xl p-6 relative shadow-inner overflow-hidden flex flex-col">
             
             {/* Mode Tabs */}
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md p-1 rounded-full flex z-30 border border-white/10">
                <button
                  onClick={() => { setActiveMode('standard'); setMagicStep('edit'); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                    activeMode === 'standard' ? 'bg-[#059669] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-3 h-3" /> Standard
                </button>
                <button
                  onClick={() => setActiveMode('magic')}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                    activeMode === 'magic' ? 'bg-[#059669] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <ScanLine className="w-3 h-3" /> Magic Scan
                </button>
             </div>

             {/* Canvas Content */}
             <div 
               ref={wrapperRef}
               className="flex-grow flex items-center justify-center relative overflow-hidden select-none"
             >
                {activeMode === 'standard' && (
                    <div 
                    ref={containerRef}
                    className="relative overflow-hidden shadow-2xl border-2 border-white/20 bg-black/50 cursor-move"
                    style={{
                        width: boxSize ? boxSize.width : 'auto',
                        height: boxSize ? boxSize.height : 'auto',
                        aspectRatio: `${aspectRatio}`,
                    }}
                    onMouseDown={handleMouseDownPan}
                    onMouseMove={handleMouseMovePan}
                    onMouseUp={handleMouseUpPan}
                    onMouseLeave={handleMouseUpPan}
                    >
                    {imageSrc && (
                        <img 
                        ref={imageRef}
                        src={imageSrc}
                        alt="Crop target"
                        className="origin-center pointer-events-none"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flip.x ? -1 : 1}) scaleY(${flip.y ? -1 : 1})`,
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            translate: '-50% -50%',
                            transition: isDraggingPan ? 'none' : 'transform 0.2s ease-out',
                            maxWidth: '100%',
                            maxHeight: '100%'
                        }}
                        draggable={false}
                        />
                    )}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-50">
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div></div>
                    </div>
                    </div >
                )}

                {activeMode === 'magic' && (
                    <>
                    {/* EDIT MODE: Show source image with points */}
                    <div 
                        ref={magicContainerRef}
                        className={`relative shadow-2xl ${magicStep === 'preview' ? 'hidden' : 'block'}`}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {imageSrc && (
                            <>
                                <img 
                                    src={imageSrc}
                                    alt="Magic target blur"
                                    className="max-h-full max-w-full object-contain pointer-events-none block"
                                    style={{ filter: 'blur(5px) brightness(0.5)', maxWidth: '100%', maxHeight: '100%' }} 
                                    draggable={false}
                                />
                                <img 
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt="Magic target"
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                    style={{ clipPath: `polygon(${points.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ')})` }}
                                    draggable={false}
                                />
                            </>
                        )}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <path 
                                d={`M ${points[0].x * 100}% ${points[0].y * 100}% L ${points[1].x * 100}% ${points[1].y * 100}% L ${points[2].x * 100}% ${points[2].y * 100}% L ${points[3].x * 100}% ${points[3].y * 100}% Z`}
                                fill="transparent" stroke="#059669" strokeWidth="2" strokeDasharray="4"
                            />
                        </svg>
                        {points.map((p, i) => (
                            <div
                                key={i}
                                className="absolute w-6 h-6 bg-[#059669] border-2 border-white rounded-full shadow-lg cursor-move z-20 hover:scale-125 transition-transform"
                                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: 'translate(-50%, -50%)' }}
                                onMouseDown={(e) => handlePointDragStart(i, e)}
                                onTouchStart={(e) => handlePointDragStart(i, e)}
                            />
                        ))}
                    </div>

                    {/* PREVIEW MODE: Show flattened result */}
                    {magicStep === 'preview' && magicPreviewSrc && (
                        <div className="relative shadow-2xl max-w-full max-h-full">
                            <img 
                                src={magicPreviewSrc}
                                alt="Flattened Preview"
                                className="max-w-full max-h-full object-contain"
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Preview
                            </div>
                        </div>
                    )}
                    </>
                )}
             </div>

             {/* Bottom Toolbar for Standard Mode */}
             {activeMode === 'standard' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 z-20">
                    <button onClick={rotateLeft} className="p-2 hover:bg-white/20 rounded-lg text-white tooltip-trigger" title="Rotate Left">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button onClick={rotateRight} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Rotate Right">
                        <RotateCw className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={flipHorizontal} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Flip Horizontal">
                        <FlipHorizontal className="w-5 h-5" />
                    </button>
                    <button onClick={flipVertical} className="p-2 hover:bg-white/20 rounded-lg text-white" title="Flip Vertical">
                        <FlipVertical className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <div className="flex items-center gap-2 px-2">
                        <ZoomIn className="w-4 h-4 text-gray-300" />
                        <input 
                            type="range" min="1" max="3" step="0.05" 
                            value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                        />
                    </div>
                </div>
             )}
          </div>

          {/* SIDEBAR CONTROLS */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-140px)]">
             
             {/* Presets Grid */}
             {activeMode === 'standard' ? (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]">
                    <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wide">Crop Presets</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button 
                                key={ratio.id}
                                onClick={() => { 
                                  const newRatio = ratio.id === 'original' ? originalAspectRatio : ratio.value;
                                  setAspectRatio(newRatio); 
                                  setActiveRatioId(ratio.id); 
                                }} 
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left group ${
                                    activeRatioId === ratio.id 
                                    ? 'border-[#059669] bg-[#ECFDF5] text-[#059669] ring-1 ring-[#059669]' 
                                    : 'border-gray-100 text-gray-600 hover:border-[#059669] hover:bg-gray-50'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${activeRatioId === ratio.id ? 'bg-[#059669]/10' : 'bg-gray-100 group-hover:bg-white'}`}>
                                    <ratio.icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-semibold">{ratio.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
             ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E7EB]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-[#0F172A] flex items-center gap-2">
                            <ScanLine className="w-5 h-5 text-[#059669]" /> Magic Scan Mode
                        </h3>
                    </div>
                    
                    {magicStep === 'edit' ? (
                        <>
                            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                                Drag the 4 corner points on the image to define the document boundaries. We will automatically correct the perspective and flatten the image.
                            </p>
                            <button 
                                onClick={handleMagicPreview}
                                className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                                <Eye className="w-4 h-4" /> Preview Flatten
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                                Here is the flattened result. You can download it or go back to adjust the corner points.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setMagicStep('edit')}
                                    className="w-full bg-white border border-[#E5E7EB] text-[#0F172A] py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <CornerUpLeft className="w-4 h-4" /> Back to Edit
                                </button>
                                <button 
                                    onClick={downloadMagicCrop}
                                    className="w-full bg-[#059669] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#047857] transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </>
                    )}
                </div>
             )}

             {/* Export Settings */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB]">
                <h3 className="font-bold text-[#0F172A] mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Export Settings
                </h3>
                
                {/* Format Selector */}
                <div className="mb-5">
                    <label className="text-xs font-semibold text-[#64748B] mb-2 block">File Format</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['image/jpeg', 'image/png', 'image/webp'].map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt as any)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                                    exportFormat === fmt ? 'bg-white text-[#0F172A] shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                {fmt.split('/')[1]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quality Slider */}
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-[#64748B]">Quality</label>
                        <span className="text-xs font-bold text-[#059669]">{exportQuality}%</span>
                    </div>
                    <input 
                        type="range" min="10" max="100" 
                        value={exportQuality} onChange={(e) => setExportQuality(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                </div>

                {/* Resolution Mode */}
                <div>
                    <label className="text-xs font-semibold text-[#64748B] mb-2 block">Resolution Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => setQualityMode('original')}
                         className={`p-3 rounded-xl border text-left transition-all ${
                           qualityMode === 'original' 
                             ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]' 
                             : 'border-gray-200 text-gray-500 hover:border-[#059669]'
                         }`}
                       >
                         <div className="font-bold text-xs mb-0.5">Max Quality</div>
                         <div className="text-[10px] opacity-70">Original Size</div>
                       </button>
                       <button
                         onClick={() => setQualityMode('web')}
                         className={`p-3 rounded-xl border text-left transition-all ${
                           qualityMode === 'web' 
                             ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]' 
                             : 'border-gray-200 text-gray-500 hover:border-[#059669]'
                         }`}
                       >
                         <div className="font-bold text-xs mb-0.5">Web Optimized</div>
                         <div className="text-[10px] opacity-70">1080p Width</div>
                       </button>
                    </div>
                </div>
             </div>

             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Tip:</strong> Double click on the crop box in Standard mode to re-center the image.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;