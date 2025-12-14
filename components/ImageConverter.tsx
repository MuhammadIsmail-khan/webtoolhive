import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  RefreshCcw, 
  Download, 
  Image as ImageIcon, 
  FileImage, 
  Settings2, 
  CheckCircle2, 
  AlertCircle,
  FileBox
} from 'lucide-react';

const ImageConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Settings
  // Added: image/gif, image/avif, image/x-icon
  type SupportedFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp' | 'image/gif' | 'image/avif' | 'image/x-icon';
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('image/png');
  const [quality, setQuality] = useState<number>(90);
  
  // Processing
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Reset conversion when file changes
      setConvertedUrl(null);
      setConvertedSize(0);
      
      // Smart default target
      if (file.type === 'image/png') setTargetFormat('image/jpeg');
      else if (file.type === 'image/jpeg') setTargetFormat('image/png');
      else setTargetFormat('image/png');

      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
      } else {
        alert('Please upload an image file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Helper to generate ICO file binary (Vista+ PNG container format)
  const generateIcoBlob = (canvas: HTMLCanvasElement): Blob => {
    const pngDataUrl = canvas.toDataURL('image/png');
    const byteString = atob(pngDataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const imageSize = ia.length;
    const width = canvas.width > 255 ? 0 : canvas.width;
    const height = canvas.height > 255 ? 0 : canvas.height;
    
    // ICO Header (6 bytes) + Directory Entry (16 bytes)
    const header = new Uint8Array(22);
    const view = new DataView(header.buffer);

    // Header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, 1, true); // Count (1 image)

    // Directory
    view.setUint8(6, width);     // Width
    view.setUint8(7, height);    // Height
    view.setUint8(8, 0);         // Colors (0 = no palette)
    view.setUint8(9, 0);         // Reserved
    view.setUint16(10, 1, true); // Planes
    view.setUint16(12, 32, true);// BPP
    view.setUint32(14, imageSize, true); // Size of image data
    view.setUint32(18, 22, true);        // Offset of image data

    return new Blob([header, ia], { type: 'image/x-icon' });
  };

  const handleConvert = async () => {
    if (!file || !previewUrl) return;

    setIsConverting(true);
    
    setTimeout(() => {
        const img = new Image();
        img.onload = () => {
            // For ICO, we typically want a square aspect ratio and smaller size
            let width = img.width;
            let height = img.height;
            
            if (targetFormat === 'image/x-icon') {
                // Resize logic for ICO: max 256x256, keep aspect ratio by fitting in square?
                // Let's force fit into max 256x256 while maintaining aspect ratio, centered
                const maxDim = 256;
                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // Background fill logic
                if (targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') {
                    // No transparency support
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0, width, height);
                
                let resultDataUrl: string;
                let resultSize: number;

                if (targetFormat === 'image/x-icon') {
                    const blob = generateIcoBlob(canvas);
                    resultDataUrl = URL.createObjectURL(blob);
                    resultSize = blob.size;
                } else {
                    // Standard formats
                    resultDataUrl = canvas.toDataURL(targetFormat, quality / 100);
                    // Estimate size from base64
                    const base64str = resultDataUrl.split(',')[1];
                    const decoded = atob(base64str);
                    resultSize = decoded.length;
                }
                
                setConvertedUrl(resultDataUrl);
                setConvertedSize(resultSize);
                setIsConverting(false);
            }
        };
        img.src = previewUrl;
    }, 500);
  };

  const handleDownload = () => {
    if (!convertedUrl) return;
    const extension = targetFormat === 'image/x-icon' ? 'ico' : targetFormat.split('/')[1];
    const link = document.createElement('a');
    link.href = convertedUrl;
    // Remove original extension and append new one
    const originalName = file?.name.substring(0, file.name.lastIndexOf('.')) || 'converted-image';
    link.download = `${originalName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatLabel = (fmt: string) => {
      switch(fmt) {
          case 'image/jpeg': return 'JPG';
          case 'image/png': return 'PNG';
          case 'image/webp': return 'WEBP';
          case 'image/bmp': return 'BMP';
          case 'image/gif': return 'GIF';
          case 'image/avif': return 'AVIF';
          case 'image/x-icon': return 'ICO';
          default: return fmt.split('/')[1].toUpperCase();
      }
  };

  // ----------------------------------------------------------------------
  // VIEW: EMPTY STATE (Upload)
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
              <RefreshCcw className="w-10 h-10 text-[#059669]" />
              Image Converter
            </h1>
            <p className="text-xl text-[#475569] mt-3 max-w-2xl">
              Convert images between JPG, PNG, WEBP, GIF, ICO, and AVIF instantly within your browser.
            </p>
          </div>

          <div 
            className={`
              bg-white border-2 border-dashed rounded-3xl p-16 md:p-24 text-center cursor-pointer shadow-sm group transition-all
              ${isDragging ? 'border-[#059669] bg-[#ECFDF5]/50 scale-[1.02]' : 'border-[#CBD5E1] hover:border-[#059669] hover:shadow-md'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-24 h-24 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-12 h-12 text-[#059669]" />
            </div>
            <h3 className="text-3xl font-bold text-[#0F172A] mb-4">Upload Image</h3>
            <p className="text-lg text-[#64748B] mb-8">
              Drag & drop (JPG, PNG, WEBP, GIF, BMP, AVIF)
            </p>
            <button className="bg-[#059669] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Select Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
             {['JPG', 'PNG', 'WEBP', 'GIF', 'ICO', 'AVIF', 'BMP'].map(fmt => (
                <div key={fmt} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center font-bold text-gray-500">
                    {fmt}
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: CONVERTER INTERFACE
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">Convert Image</h1>
          </div>
          <button 
            onClick={() => setFile(null)}
            className="text-[#475569] hover:text-[#EF4444] font-medium text-base px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remove Image
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Input & Settings */}
            <div className="lg:col-span-1 space-y-6">
                {/* Input File Info */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                             {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-[#0F172A] truncate w-full" title={file.name}>{file.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                                    {file.type.split('/')[1] || 'UNK'}
                                </span>
                                <span className="text-sm text-[#64748B]">{formatFileSize(file.size)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Settings */}
                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                    <h3 className="font-bold text-[#0F172A] mb-5 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-[#059669]" /> Conversion Settings
                    </h3>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-[#64748B] mb-2 uppercase tracking-wide">Target Format</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/x-icon'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setTargetFormat(fmt as any)}
                                        className={`py-3 px-1 rounded-xl text-xs font-bold border transition-all ${
                                            targetFormat === fmt 
                                            ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]' 
                                            : 'border-[#E2E8F0] text-gray-600 hover:border-[#059669] hover:bg-gray-50'
                                        }`}
                                    >
                                        {getFormatLabel(fmt)}
                                    </button>
                                ))}
                            </div>
                            {targetFormat === 'image/x-icon' && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Auto-resized to 256x256 max
                                </p>
                            )}
                        </div>

                        {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">Quality</label>
                                    <span className="text-[#059669] font-bold">{quality}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={quality} 
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                                />
                            </div>
                        )}

                        <button 
                            onClick={handleConvert}
                            disabled={isConverting}
                            className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isConverting ? (
                                <>
                                    <RefreshCcw className="w-5 h-5 animate-spin" /> Converting...
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="w-5 h-5" /> Convert Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Preview & Result */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8 min-h-[500px] flex flex-col">
                    
                    {!convertedUrl ? (
                         // Preview State
                         <div className="flex-grow flex flex-col items-center justify-center text-center opacity-50">
                             <FileBox className="w-24 h-24 text-gray-300 mb-4" />
                             <h3 className="text-xl font-bold text-gray-400">Ready to Convert</h3>
                             <p className="text-gray-400">Select {getFormatLabel(targetFormat)} and click Convert Now</p>
                         </div>
                    ) : (
                        // Result State
                        <div className="animate-fade-in flex-grow flex flex-col">
                            <div className="flex items-center justify-between mb-6 bg-green-50 p-4 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#059669] p-2 rounded-full text-white">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#065F46]">Conversion Successful</h3>
                                        <p className="text-sm text-[#064E3B]">
                                            Converted to {getFormatLabel(targetFormat)} • {formatFileSize(convertedSize)}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDownload}
                                    className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>

                            <div className="flex-grow bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center p-8 overflow-hidden relative">
                                <img 
                                    src={convertedUrl} 
                                    alt="Converted Result" 
                                    className="max-w-full max-h-[400px] object-contain shadow-2xl rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                </div>
                
                {/* Info Box */}
                <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        <strong>Privacy Note:</strong> Your images are processed entirely within your browser. They are never uploaded to any server, ensuring 100% privacy.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;