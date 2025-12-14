import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Upload, RefreshCw, Copy, Check, 
  Palette, Zap, AlertTriangle, Eye, Sun, Moon,
  Wand2, Layout, Sliders, MousePointer2, Grid,
  Droplet, Maximize2, Layers, Crosshair, Trash2
} from 'lucide-react';

// --- COLOR UTILITIES (No external deps) ---

type RGB = { r: number, g: number, b: number };
type HSL = { h: number, s: number, l: number };

const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = ({ r, g, b }: RGB): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const getLuminance = ({ r, g, b }: RGB) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrast = (rgb1: RGB, rgb2: RGB) => {
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

// --- COMPONENT ---

type ExtractionMode = 'default' | 'vibrant' | 'muted' | 'pastel' | 'dark' | 'light';

// Magnifier Component
const Magnifier = ({ 
  x, 
  y, 
  color, 
  imageSrc, 
  containerRect 
}: { 
  x: number, 
  y: number, 
  color: string, 
  imageSrc: string, 
  containerRect: DOMRect 
}) => {
  const ZOOM_LEVEL = 3;
  const LOUPE_SIZE = 140; // Larger for better visibility
  const HALF_LOUPE = LOUPE_SIZE / 2;

  // Calculate background position to show the zoomed area matching the cursor
  const bgX = (x * ZOOM_LEVEL) - HALF_LOUPE;
  const bgY = (y * ZOOM_LEVEL) - HALF_LOUPE;

  return (
    <div 
      className="absolute pointer-events-none z-[40] flex flex-col items-center gap-2"
      style={{ 
        left: x, 
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Loupe Circle */}
      <div 
        className="rounded-full border-[6px] border-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden relative bg-gray-100 ring-1 ring-black/5"
        style={{ 
          width: LOUPE_SIZE, 
          height: LOUPE_SIZE 
        }}
      >
        {/* Zoomed Image Layer */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundRepeat: 'no-repeat',
            // Scale background to match zoom level relative to container
            backgroundSize: `${containerRect.width * ZOOM_LEVEL}px ${containerRect.height * ZOOM_LEVEL}px`,
            backgroundPosition: `-${bgX}px -${bgY}px`
          }}
        />
        
        {/* Crosshair / Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Outer ring for visibility on all colors */}
            <div className="w-6 h-6 rounded-full border border-white/80 shadow-sm flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                 {/* The actual pixel color */}
                 <div className="w-3 h-3 rounded-full border border-black/20 shadow-inner" style={{ backgroundColor: color }}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ColorIntelligence: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>(['#0F172A', '#334155', '#475569', '#94A3B8', '#F8FAFC']);
  const [activeColor, setActiveColor] = useState<string>(palette[0]);
  const [contrastScore, setContrastScore] = useState<{ score: number, aa: boolean, aaa: boolean }>({ score: 0, aa: false, aaa: false });
  const [mode, setMode] = useState<'extract' | 'generate'>('extract');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // NEW STATES FOR ADVANCED EXTRACTION
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('default');
  const [sensitivity, setSensitivity] = useState<number>(50); // 1-100
  const [allDetectedColors, setAllDetectedColors] = useState<string[]>([]);
  
  // Picker States
  const [pickedPixel, setPickedPixel] = useState<{x: number, y: number, color: string} | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{x: number, y: number, color: string} | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  // Store raw pixel data to re-cluster without re-reading canvas
  const rawDataRef = useRef<{r: number, g: number, b: number, count: number}[]>([]);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null); // Small for clustering
  const pickerCanvasRef = useRef<HTMLCanvasElement>(null); // Full res for picking
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- PASTE SUPPORT ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        if (e.clipboardData && e.clipboardData.items) {
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        setIsProcessing(true);
                        const url = URL.createObjectURL(file);
                        
                        // Reset states
                        setImage(url);
                        setPickedPixel(null);
                        setHoverPixel(null);
                        
                        const img = new Image();
                        img.onload = () => processImage(img);
                        img.src = url;
                    }
                }
            }
        }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Analyze contrast
  useEffect(() => {
    const bg = previewMode === 'light' ? { r: 255, g: 255, b: 255 } : { r: 15, g: 23, b: 42 };
    const fg = hexToRgb(activeColor);
    const score = getContrast(fg, bg);
    setContrastScore({
      score: parseFloat(score.toFixed(2)),
      aa: score >= 4.5,
      aaa: score >= 7
    });
  }, [activeColor, previewMode]);

  // Re-run clustering when mode or sensitivity changes
  useEffect(() => {
    if (rawDataRef.current.length > 0) {
      generatePaletteFromRawData();
    }
  }, [extractionMode, sensitivity]);

  const processImage = (img: HTMLImageElement) => {
    // 1. Setup Analysis Canvas (Small)
    const analysisCanvas = analysisCanvasRef.current;
    if (analysisCanvas) {
        const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
        const scale = 200 / img.width;
        analysisCanvas.width = 200;
        analysisCanvas.height = img.height * scale;
        if (ctx) {
            ctx.drawImage(img, 0, 0, analysisCanvas.width, analysisCanvas.height);
            // Run Clustering
            const imageData = ctx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height).data;
            runClustering(imageData, analysisCanvas.width * analysisCanvas.height);
        }
    }

    // 2. Setup Picker Canvas (High Res)
    const pickerCanvas = pickerCanvasRef.current;
    if (pickerCanvas) {
        // Cap max size to prevent memory issues, but keep it detailed
        const MAX_PICKER_SIZE = 1200;
        let pW = img.width;
        let pH = img.height;
        if (pW > MAX_PICKER_SIZE) {
            pH = pH * (MAX_PICKER_SIZE / pW);
            pW = MAX_PICKER_SIZE;
        }
        pickerCanvas.width = pW;
        pickerCanvas.height = pH;
        const pCtx = pickerCanvas.getContext('2d', { willReadFrequently: true });
        if(pCtx) pCtx.drawImage(img, 0, 0, pW, pH);
    }

    setIsProcessing(false);
  };

  const runClustering = (imageData: Uint8ClampedArray, pixelCount: number) => {
    // Frequency Map
    const colorMap = new Map<string, number>();
    for (let i = 0; i < pixelCount; i += 4 * 2) { // Sample every 2nd pixel
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (a < 128) continue;
        const key = `${r},${g},${b}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    const raw: {r: number, g: number, b: number, count: number}[] = [];
    colorMap.forEach((count, key) => {
        if (count > 2) {
            const [r, g, b] = key.split(',').map(Number);
            raw.push({ r, g, b, count });
        }
    });

    rawDataRef.current = raw;
    generatePaletteFromRawData();
  }

  const generatePaletteFromRawData = () => {
     const raw = rawDataRef.current;
     if (raw.length === 0) return;

     // 1. CLUSTERING
     const threshold = 100 - (sensitivity * 0.9); 
     const clusters: {r: number, g: number, b: number, count: number}[] = [];
     const sortedRaw = [...raw].sort((a, b) => b.count - a.count);

     for (const p of sortedRaw) {
         let merged = false;
         for (const c of clusters) {
             const dist = Math.sqrt(Math.pow(c.r - p.r, 2) + Math.pow(c.g - p.g, 2) + Math.pow(c.b - p.b, 2));
             if (dist < threshold) {
                 c.r = (c.r * c.count + p.r * p.count) / (c.count + p.count);
                 c.g = (c.g * c.count + p.g * p.count) / (c.count + p.count);
                 c.b = (c.b * c.count + p.b * p.count) / (c.count + p.count);
                 c.count += p.count;
                 merged = true;
                 break;
             }
         }
         if (!merged) clusters.push({ ...p });
     }

     // 2. SCORING
     const scoredClusters = clusters.map(c => {
         const hsl = rgbToHsl(c);
         let score = c.count; 
         if (extractionMode === 'vibrant') score = score * (hsl.s / 100) * (1 - Math.abs(hsl.l - 50) / 100);
         else if (extractionMode === 'muted') score = score * (1 - hsl.s / 100);
         else if (extractionMode === 'pastel') { if (hsl.l > 70 && hsl.s > 20) score *= 2; else score *= 0.1; }
         else if (extractionMode === 'dark') score = score * (1 - hsl.l / 100);
         else if (extractionMode === 'light') score = score * (hsl.l / 100);
         return { ...c, score };
     });
     scoredClusters.sort((a, b) => b.score - a.score);

     // 3. OUTPUT
     const finalHex = scoredClusters.slice(0, 5).map(c => rgbToHex({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) }));
     while (finalHex.length < 5) finalHex.push('#FFFFFF');
     const allHex = clusters.sort((a, b) => b.count - a.count).slice(0, 48).map(c => rgbToHex({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) }));

     setPalette(finalHex);
     setAllDetectedColors(allHex);
     if (!pickedPixel) setActiveColor(finalHex[2]); 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImage(url);
      setPickedPixel(null);
      setHoverPixel(null);
      
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = url;
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setImage(null);
      setPickedPixel(null);
      setHoverPixel(null);
      setAllDetectedColors([]);
      setPalette(['#0F172A', '#334155', '#475569', '#94A3B8', '#F8FAFC']);
  };

  // ---- PICKER LOGIC ----

  const getColorAtPosition = (clientX: number, clientY: number): string | null => {
    if (!pickerCanvasRef.current || !containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;

    // Map display coordinates to picker canvas coordinates
    const canvas = pickerCanvasRef.current;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const targetX = Math.floor(x * scaleX);
    const targetY = Math.floor(y * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const pixel = ctx.getImageData(targetX, targetY, 1, 1).data;
    return rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const color = getColorAtPosition(e.clientX, e.clientY);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (color) {
        setHoverPixel({ x, y, color });
        setContainerRect(rect);
      } else {
        setHoverPixel(null);
      }
  };

  const handleMouseLeave = () => {
    setHoverPixel(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverPixel) {
        setPickedPixel(hoverPixel);
        setActiveColor(hoverPixel.color);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  // UI Components
  const PaletteSwatch = ({ color, index }: { color: string, index: number }) => {
    const isDark = getLuminance(hexToRgb(color)) < 0.5;
    return (
      <div 
        className={`group relative h-24 md:h-32 w-full rounded-2xl flex flex-col justify-end p-3 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 ${activeColor === color ? 'ring-2 ring-offset-2 ring-[#059669] scale-[1.02]' : ''}`}
        style={{ backgroundColor: color }}
        onClick={() => setActiveColor(color)}
      >
        <div className={`opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 backdrop-blur-md transition-opacity`} onClick={(e) => { e.stopPropagation(); copyToClipboard(color); }}>
          <Copy className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {index === 0 ? 'Light' : index === 4 ? 'Dark' : index === 2 ? 'Primary' : 'Accent'}
            </span>
            <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{color}</span>
          </div>
        </div>
      </div>
    );
  };

  // Simulated Website Preview
  const ThemePreview = () => {
    const bg = previewMode === 'light' ? palette[0] : palette[4];
    const surface = previewMode === 'light' ? '#FFFFFF' : hexToRgb(palette[4]).r > 20 ? palette[4] : '#1E293B';
    const textMain = previewMode === 'light' ? palette[4] : palette[0];
    const textMuted = previewMode === 'light' ? palette[3] : palette[1];
    const accent = palette[2]; 
    const accentFg = getLuminance(hexToRgb(accent)) > 0.6 ? '#0F172A' : '#FFFFFF';

    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl" style={{ backgroundColor: bg }}>
        {/* Fake Browser Header */}
        <div className="bg-black/5 px-4 py-3 flex items-center gap-2 border-b border-black/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="ml-4 bg-white/40 h-5 w-40 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: accent }}></div>
            <div className="flex gap-4 text-xs font-bold" style={{ color: textMuted }}>
              <span>Home</span>
              <span>Features</span>
              <span>Pricing</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="text-2xl font-bold leading-tight" style={{ color: textMain }}>
              Generated Theme Preview
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: textMuted }}>
              This simulates how your generated palette applies to UI elements automatically. 
              We calculate contrast and hierarchy for you.
            </p>
          </div>

          <div className="flex gap-3">
             <button 
              className="px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: accent, color: accentFg }}
             >
               Get Started
             </button>
             <button 
              className="px-5 py-2.5 rounded-lg text-sm font-bold border"
              style={{ borderColor: textMuted, color: textMain }}
             >
               Learn More
             </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
             <div className="p-3 rounded-xl" style={{ backgroundColor: surface }}>
                <div className="w-8 h-8 rounded-full mb-2 opacity-20" style={{ backgroundColor: accent }}></div>
                <div className="h-2 w-16 rounded-full mb-1.5 opacity-40" style={{ backgroundColor: textMain }}></div>
             </div>
             <div className="p-3 rounded-xl" style={{ backgroundColor: surface }}>
                <div className="w-8 h-8 rounded-full mb-2 opacity-20" style={{ backgroundColor: accent }}></div>
                <div className="h-2 w-16 rounded-full mb-1.5 opacity-40" style={{ backgroundColor: textMain }}></div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <canvas ref={analysisCanvasRef} className="hidden" />
        <canvas ref={pickerCanvasRef} className="hidden" />
        
        {/* Toast Feedback */}
        {copyFeedback && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-2xl z-[100] flex items-center gap-2 animate-fade-in-up">
                <Check className="w-4 h-4 text-emerald-400" /> Copied {copyFeedback}
            </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] flex items-center gap-3">
              <Palette className="w-10 h-10 text-[#059669]" />
              Color Intelligence
            </h1>
            <p className="text-lg text-[#64748B] mt-2 max-w-xl">
              Extract dominant colors from images, analyze brand emotion, and generate accessible design systems instantly.
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setMode('extract')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'extract' ? 'bg-[#0F172A] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Upload className="w-4 h-4" /> From Image
            </button>
            <button 
              onClick={() => setMode('generate')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === 'generate' ? 'bg-[#0F172A] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Wand2 className="w-4 h-4" /> Generator
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input & Palette */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. UPLOAD AREA WITH PICKER */}
            <div className="relative">
                <div 
                  className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col group"
                >
                {image ? (
                    <div className="flex flex-col relative rounded-3xl">
                        {/* Image Container with Top Radius and Overflow Hidden to clip magnifier */}
                        <div 
                            ref={containerRef}
                            className="relative cursor-crosshair group/image select-none bg-gray-50 rounded-t-3xl overflow-hidden" 
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onClick={handleClick}
                        >
                            <img ref={imageRef} src={image} alt="Analysis Target" className="w-full max-h-[500px] object-contain block mx-auto rounded-t-3xl" draggable={false} />
                            
                            {/* Hover Overlay Hint */}
                            {!hoverPixel && !pickedPixel && (
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 pointer-events-none opacity-80 group-hover/image:opacity-0 transition-opacity z-10">
                                    <MousePointer2 className="w-3 h-3" /> Click to pick color
                                </div>
                            )}

                             {/* Selected Point Marker (On Image) */}
                            {pickedPixel && (
                                <div 
                                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10 bg-transparent"
                                    style={{ 
                                        left: pickedPixel.x, 
                                        top: pickedPixel.y,
                                    }}
                                >
                                    <div className="w-full h-full rounded-full border border-black/30"></div>
                                </div>
                            )}

                            {/* MAGNIFIER LOUPE (Now inside overflow-hidden to prevent bleeding) */}
                            {hoverPixel && containerRect && (
                                <Magnifier 
                                    x={hoverPixel.x} 
                                    y={hoverPixel.y} 
                                    color={hoverPixel.color} 
                                    imageSrc={image} 
                                    containerRect={containerRect}
                                />
                            )}

                            {/* Floating Copy Bar (When Picked) - Positioned Absolutely */}
                            {pickedPixel && (
                                <div className="absolute left-1/2 bottom-[40px] -translate-x-1/2 z-50 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1.5 pr-2 gap-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div 
                                            className="w-8 h-8 rounded-full border border-gray-100 shadow-inner ring-1 ring-black/5" 
                                            style={{ backgroundColor: pickedPixel.color }} 
                                        />
                                        <span className="font-mono font-bold text-[#0F172A] text-sm tracking-wide">
                                            {pickedPixel.color}
                                        </span>
                                        <div className="w-px h-4 bg-gray-200"></div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(pickedPixel.color); }}
                                            className="text-xs font-bold text-gray-600 hover:text-[#059669] hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Floating Controls Overlay */}
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button 
                                    onClick={handleRemoveImage}
                                    className="bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-500 px-3 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-sm backdrop-blur-sm"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    className="bg-white/90 hover:bg-white text-gray-700 hover:text-[#059669] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-sm backdrop-blur-sm"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Replace
                                </button>
                            </div>
                        </div>

                        {/* 2. EXTRACTION SETTINGS (Attached Bottom) */}
                        <div className="border-t border-gray-100 p-6 bg-white rounded-b-3xl relative z-10">
                            <h4 className="text-xs font-bold text-[#64748B] uppercase mb-4 flex items-center gap-2">
                                <Sliders className="w-4 h-4" /> Extraction Settings
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-[#0F172A]">Mode</label>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['default', 'vibrant', 'muted', 'pastel', 'dark', 'light'].map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setExtractionMode(m as ExtractionMode)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all ${
                                                    extractionMode === m 
                                                    ? 'bg-[#0F172A] text-white border-[#0F172A]' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-[#0F172A]">Clustering Sensitivity</label>
                                        <span className="text-xs font-bold text-[#059669]">{sensitivity}%</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="100" 
                                        value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Lower = fewer groups (merged). Higher = more distinct colors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="py-16 px-8 cursor-pointer rounded-3xl hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-[#059669]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A] mb-2">Upload Source Image</h3>
                        <p className="text-[#64748B] mb-1">Drag & drop to extract advanced palette</p>
                        <p className="text-xs text-gray-400 font-medium">or Paste (Ctrl+V) from clipboard</p>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                </div>
            </div>

            {/* 3. DETECTED COLORS GRID */}
            {allDetectedColors.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                            <Grid className="w-4 h-4 text-[#059669]" /> All Detected Colors
                        </h4>
                        <span className="text-xs text-gray-400">{allDetectedColors.length} found</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {allDetectedColors.map((color, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveColor(color)}
                                className="w-6 h-6 rounded-md hover:scale-125 transition-transform shadow-sm border border-black/5"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 4. MAIN PALETTE */}
            <div>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-[#0F172A] text-lg flex items-center gap-2">
                   <Layers className="w-5 h-5 text-[#059669]" /> Generated Palette
                 </h3>
                 <div className="flex gap-2">
                   <button className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1.5 rounded-lg hover:bg-[#D1FAE5]">
                     Copy All
                   </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-5 gap-3">
                {palette.map((color, idx) => (
                  <PaletteSwatch key={idx} color={color} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Analysis & Preview */}
          <div className="lg:col-span-5 space-y-6">
             
             {/* 1. THEME PREVIEW */}
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#0F172A] flex items-center gap-2">
                    <Layout className="w-5 h-5 text-[#059669]" /> Live UI Preview
                  </h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setPreviewMode('light')}
                      className={`p-1.5 rounded-md transition-all ${previewMode === 'light' ? 'bg-white shadow text-[#059669]' : 'text-gray-400'}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setPreviewMode('dark')}
                      className={`p-1.5 rounded-md transition-all ${previewMode === 'dark' ? 'bg-white shadow text-[#059669]' : 'text-gray-400'}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ThemePreview />
             </div>

             {/* 2. ACCESSIBILITY CHECK */}
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-bold text-[#0F172A] flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#059669]" /> Accessibility Check
                  </h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#0F172A]">{contrastScore.score}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Contrast Ratio</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                     <span className="text-sm font-semibold text-gray-600">WCAG AA (Normal)</span>
                     {contrastScore.aa ? (
                       <span className="flex items-center gap-1 text-[#059669] font-bold text-sm"><Check className="w-4 h-4" /> Pass</span>
                     ) : (
                       <span className="flex items-center gap-1 text-red-500 font-bold text-sm"><AlertTriangle className="w-4 h-4" /> Fail</span>
                     )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                     <span className="text-sm font-semibold text-gray-600">WCAG AAA (Enhanced)</span>
                     {contrastScore.aaa ? (
                       <span className="flex items-center gap-1 text-[#059669] font-bold text-sm"><Check className="w-4 h-4" /> Pass</span>
                     ) : (
                       <span className="flex items-center gap-1 text-amber-500 font-bold text-sm"><AlertTriangle className="w-4 h-4" /> Fail</span>
                     )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">Preview Context</div>
                    <div 
                      className="p-4 rounded-xl text-center font-bold text-lg transition-colors border border-gray-200"
                      style={{ 
                        backgroundColor: previewMode === 'light' ? '#FFFFFF' : '#0F172A',
                        color: activeColor
                      }}
                    >
                       Quick Brown Fox Jumps
                    </div>
                  </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorIntelligence;