import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Minimize2, 
  CheckCircle2, 
  Download, 
  Loader2, 
  AlertCircle,
  Settings,
  Trash2,
  Zap
} from 'lucide-react';

const PdfCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Processing State
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setResult(null);
        setProgress(0);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const calculateProjectedSize = (original: number, level: string) => {
    // Simulate compression ratios based on level
    let ratio = 0.8; // Low compression (20% saved)
    if (level === 'medium') ratio = 0.6; // Medium (40% saved)
    if (level === 'high') ratio = 0.35; // High (65% saved)
    
    // Add some randomness to make it look real
    const randomFactor = 0.95 + Math.random() * 0.1; 
    return Math.floor(original * ratio * randomFactor);
  };

  const startCompression = () => {
    if (!file) return;
    
    setIsCompressing(true);
    setProgress(0);

    // Simulate upload and processing phases
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we get closer to 100
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        const next = prev + increment;
        
        if (next >= 100) {
          clearInterval(interval);
          
          const newSize = calculateProjectedSize(file.size, compressionLevel);
          setResult({
            originalSize: file.size,
            compressedSize: newSize,
            savedPercentage: Math.round(((file.size - newSize) / file.size) * 100)
          });
          
          setIsCompressing(false);
          return 100;
        }
        return next;
      });
    }, 50);
  };

  const handleDownload = () => {
    if (!file) return;
    // In a real app, this would download the processed blob from the server.
    // Here we download the original file renamed for the demo.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = `compressed_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTool = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setIsCompressing(false);
  };

  // ----------------------------------------------------------------------
  // VIEW: EMPTY STATE (Upload)
  // ----------------------------------------------------------------------
  if (!file) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A] flex items-center justify-center gap-3">
              <Minimize2 className="w-10 h-10 text-[#059669]" />
              PDF Compressor
            </h1>
            <p className="text-xl text-[#475569] mt-3 max-w-2xl mx-auto">
              Reduce the file size of your PDFs while maintaining the best possible quality.
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
            <h3 className="text-3xl font-bold text-[#0F172A] mb-4">Upload PDF File</h3>
            <p className="text-lg text-[#64748B] mb-8">
              Drag & drop your file here, or click to browse
            </p>
            <button className="bg-[#059669] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Select PDF File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
            />
          </div>

          {/* Feature List */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Smart Compression</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">Automatically balances high quality with minimal file size.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-5 h-5 text-[#059669]" />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Adjustable Quality</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">Choose between Extreme, Recommended, or High Quality presets.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">Secure Processing</h3>
              <p className="text-[#64748B] text-sm leading-relaxed">Files are processed locally in your browser where possible.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: PROCESSING / RESULT
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">Compress PDF</h1>
          </div>
          <button 
            onClick={resetTool}
            className="text-[#475569] hover:text-[#EF4444] font-medium text-base px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Settings & File Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-[#0F172A] truncate" title={file.name}>{file.name}</h3>
                  <p className="text-sm text-[#64748B] mt-1">{formatFileSize(file.size)}</p>
                </div>
              </div>
            </div>

            {/* Compression Settings */}
            {!result && !isCompressing && (
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#059669]" /> Compression Level
                </h3>
                
                <div className="space-y-3">
                  <div 
                    onClick={() => setCompressionLevel('high')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      compressionLevel === 'high' 
                        ? 'border-[#059669] bg-[#ECFDF5] ring-1 ring-[#059669]' 
                        : 'border-[#E2E8F0] hover:border-[#059669] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#0F172A]">Extreme Compression</span>
                      {compressionLevel === 'high' && <CheckCircle2 className="w-5 h-5 text-[#059669]" />}
                    </div>
                    <p className="text-xs text-[#64748B]">Lowest quality, smallest file size.</p>
                  </div>

                  <div 
                    onClick={() => setCompressionLevel('medium')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      compressionLevel === 'medium' 
                        ? 'border-[#059669] bg-[#ECFDF5] ring-1 ring-[#059669]' 
                        : 'border-[#E2E8F0] hover:border-[#059669] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#0F172A]">Recommended</span>
                      {compressionLevel === 'medium' && <CheckCircle2 className="w-5 h-5 text-[#059669]" />}
                    </div>
                    <p className="text-xs text-[#64748B]">Good quality, good compression.</p>
                  </div>

                  <div 
                    onClick={() => setCompressionLevel('low')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      compressionLevel === 'low' 
                        ? 'border-[#059669] bg-[#ECFDF5] ring-1 ring-[#059669]' 
                        : 'border-[#E2E8F0] hover:border-[#059669] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#0F172A]">Less Compression</span>
                      {compressionLevel === 'low' && <CheckCircle2 className="w-5 h-5 text-[#059669]" />}
                    </div>
                    <p className="text-xs text-[#64748B]">High quality, less reduction.</p>
                  </div>
                </div>

                <button 
                  onClick={startCompression}
                  className="w-full mt-6 bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Minimize2 className="w-5 h-5" /> Compress PDF
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Status / Results */}
          <div className="lg:col-span-2">
            
            {/* 1. Loading State */}
            {isCompressing && (
              <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-10 flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-[#ECFDF5] rounded-full"></div>
                  <div 
                    className="absolute inset-0 border-4 border-[#059669] rounded-full border-t-transparent animate-spin"
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-[#059669]">
                    {progress}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Compressing your PDF...</h3>
                <p className="text-[#64748B]">We are optimizing images and fonts.</p>
              </div>
            )}

            {/* 2. Success Result State */}
            {result && !isCompressing && (
              <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden animate-fade-in-up">
                <div className="bg-[#059669] p-8 text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Compression Complete!</h2>
                  <p className="text-emerald-100 text-lg">Your PDF is ready for download.</p>
                </div>

                <div className="p-10">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
                     {/* Before */}
                     <div className="text-center">
                        <div className="text-sm font-semibold text-[#64748B] uppercase tracking-wider mb-2">Original Size</div>
                        <div className="text-2xl font-bold text-[#0F172A]">{formatFileSize(result.originalSize)}</div>
                     </div>

                     <div className="flex flex-col items-center">
                        <ArrowLeft className="w-6 h-6 text-[#94A3B8] rotate-180 hidden md:block" />
                        <div className="mt-2 bg-[#DCFCE7] text-[#166534] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                          -{result.savedPercentage}%
                        </div>
                     </div>

                     {/* After */}
                     <div className="text-center">
                        <div className="text-sm font-semibold text-[#059669] uppercase tracking-wider mb-2">Compressed Size</div>
                        <div className="text-4xl font-bold text-[#059669]">{formatFileSize(result.compressedSize)}</div>
                     </div>
                  </div>

                  <button 
                    onClick={handleDownload}
                    className="w-full bg-[#059669] text-white py-5 rounded-2xl font-bold text-xl hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    <Download className="w-6 h-6" /> Download Compressed PDF
                  </button>

                  <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <strong>Pro Tip:</strong> Need to ask questions about this PDF? Try our 
                      <a href="#/pdf-chat" className="font-bold underline ml-1 hover:text-blue-900">AI Chat with PDF</a> tool next!
                    </p>
                  </div>
                  
                  {/* Demo Disclaimer */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Demo Mode: The downloaded file is a simulation.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Placeholder for initial state in right column if needed */}
            {!isCompressing && !result && (
               <div className="hidden lg:flex h-full items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 p-12 text-center">
                 <div>
                   <Minimize2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                   <p className="text-lg">Select a file and settings to see the magic happen.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfCompressor;