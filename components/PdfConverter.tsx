import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Settings2,
  Trash2,
  FileBox,
  Layers,
  Archive,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for PDF.js import structure in browser environments (esm.sh)
// The library might be exported as 'default' or directly
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF.js worker
// Using cdnjs for the worker ensures it is loaded as a classic script, preventing "importScripts" errors
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

const PdfConverter: React.FC = () => {
  const [mode, setMode] = useState<'to_pdf' | 'from_pdf'>('to_pdf');
  
  // --------------------------------------------------------------------------
  // STATE: IMAGES TO PDF
  // --------------------------------------------------------------------------
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'fit'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --------------------------------------------------------------------------
  // STATE: PDF TO IMAGES
  // --------------------------------------------------------------------------
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]); // Data URLs of rendered pages
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [outputImageFormat, setOutputImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // HANDLERS: COMMON
  // --------------------------------------------------------------------------
  const reset = () => {
    setSelectedImages([]);
    setPdfFile(null);
    setPdfPages([]);
    setIsGeneratingPdf(false);
    setIsRenderingPdf(false);
    setIsZipping(false);
  };

  const handleModeChange = (newMode: 'to_pdf' | 'from_pdf') => {
    setMode(newMode);
    reset();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (mode === 'to_pdf') {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...files]);
    } else {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        renderPdfToImages(file);
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  // --------------------------------------------------------------------------
  // LOGIC: IMAGES TO PDF
  // --------------------------------------------------------------------------
  const convertImagesToPdf = async () => {
    if (selectedImages.length === 0) return;
    setIsGeneratingPdf(true);

    // Small timeout to allow UI to update
    setTimeout(async () => {
        try {
            const doc = new jsPDF({
                orientation: pdfOrientation,
                unit: 'mm',
                format: pdfPageSize === 'fit' ? 'a4' : pdfPageSize
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            for (let i = 0; i < selectedImages.length; i++) {
                if (i > 0) doc.addPage();
                
                const imgFile = selectedImages[i];
                const imgData = await readFileAsDataURL(imgFile);
                const imgProps = await getImageProperties(imgData);

                let renderWidth = pageWidth;
                let renderHeight = (imgProps.height * pageWidth) / imgProps.width;

                // If "Fit to Page" isn't strictly requested, or if image is too tall, scale to fit height
                if (renderHeight > pageHeight) {
                    renderHeight = pageHeight;
                    renderWidth = (imgProps.width * pageHeight) / imgProps.height;
                }

                const x = (pageWidth - renderWidth) / 2;
                const y = (pageHeight - renderHeight) / 2;

                doc.addImage(imgData, imgFile.type.split('/')[1].toUpperCase(), x, y, renderWidth, renderHeight);
            }

            doc.save('converted-images.pdf');
        } catch (error) {
            console.error(error);
            alert('Failed to create PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    }, 500);
  };

  const getImageProperties = (url: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = url;
      });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const removeImage = (index: number) => {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // --------------------------------------------------------------------------
  // LOGIC: PDF TO IMAGES
  // --------------------------------------------------------------------------
  const renderPdfToImages = async (file: File) => {
      setIsRenderingPdf(true);
      setPdfPages([]);

      try {
          const arrayBuffer = await file.arrayBuffer();
          // Use the 'pdfjs' variable which handles the default export issue
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const totalPages = pdf.numPages;
          const renderedPages: string[] = [];

          for (let i = 1; i <= totalPages; i++) {
              const page = await pdf.getPage(i);
              const scale = 2; // High resolution
              const viewport = page.getViewport({ scale });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                  await page.render({ canvasContext: context, viewport }).promise;
                  renderedPages.push(canvas.toDataURL(outputImageFormat));
              }
          }
          setPdfPages(renderedPages);
      } catch (error) {
          console.error(error);
          alert('Failed to parse PDF. It might be password protected or corrupted.');
      } finally {
          setIsRenderingPdf(false);
      }
  };

  // Re-render if format changes
  useEffect(() => {
      if (pdfFile && !isRenderingPdf && pdfPages.length > 0) {
          // If format changes, we ideally re-render. 
          // For simplicity in this demo, we re-trigger renderPdfToImages.
          renderPdfToImages(pdfFile);
      }
  }, [outputImageFormat]);

  const downloadAllAsZip = async () => {
      if (pdfPages.length === 0) return;
      setIsZipping(true);
      
      try {
        const zip = new JSZip();
        const ext = outputImageFormat.split('/')[1];

        pdfPages.forEach((dataUrl, index) => {
            const base64 = dataUrl.split(',')[1];
            zip.file(`page-${index + 1}.${ext}`, base64, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${pdfFile?.name.replace('.pdf', '')}-images.zip`;
        link.click();
      } catch (error) {
          console.error(error);
          alert('Failed to create ZIP');
      } finally {
          setIsZipping(false);
      }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">PDF Converter</h1>
          </div>
          <button 
            onClick={reset}
            className="text-[#475569] hover:text-[#EF4444] font-medium text-base px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset All
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
            <button
                onClick={() => handleModeChange('to_pdf')}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${
                    mode === 'to_pdf' 
                    ? 'border-[#059669] bg-[#ECFDF5] text-[#059669] shadow-md' 
                    : 'border-white bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600'
                }`}
            >
                <div className={`p-3 rounded-full ${mode === 'to_pdf' ? 'bg-[#059669] text-white' : 'bg-gray-100'}`}>
                    <Layers className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-lg block">Images to PDF</span>
                    <span className="text-xs opacity-70 mt-1 block">JPG, PNG, WEBP → PDF</span>
                </div>
            </button>
            <button
                onClick={() => handleModeChange('from_pdf')}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${
                    mode === 'from_pdf' 
                    ? 'border-[#059669] bg-[#ECFDF5] text-[#059669] shadow-md' 
                    : 'border-white bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600'
                }`}
            >
                <div className={`p-3 rounded-full ${mode === 'from_pdf' ? 'bg-[#059669] text-white' : 'bg-gray-100'}`}>
                    <FileBox className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-lg block">PDF to Image</span>
                    <span className="text-xs opacity-70 mt-1 block">PDF → JPG, PNG</span>
                </div>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: Controls & Input */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Uploader Card */}
                <div 
                    className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#CBD5E1] hover:border-[#059669] transition-colors cursor-pointer text-center group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-[#059669]" />
                    </div>
                    <h3 className="font-bold text-[#0F172A] mb-1">
                        {mode === 'to_pdf' ? 'Add Images' : 'Upload PDF'}
                    </h3>
                    <p className="text-sm text-[#64748B] mb-4">
                        {mode === 'to_pdf' ? 'JPG, PNG, WEBP supported' : 'Select a PDF document'}
                    </p>
                    {mode === 'to_pdf' && (
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium bg-gray-50 py-1 px-2 rounded-lg mx-auto w-max">
                            <span>IMG</span> <ArrowRight className="w-3 h-3" /> <span>PDF</span>
                        </div>
                    )}
                    {mode === 'from_pdf' && (
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium bg-gray-50 py-1 px-2 rounded-lg mx-auto w-max">
                            <span>PDF</span> <ArrowRight className="w-3 h-3" /> <span>JPG/PNG</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple={mode === 'to_pdf'}
                        accept={mode === 'to_pdf' ? "image/*" : "application/pdf"}
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Settings Panel */}
                {(selectedImages.length > 0 || pdfFile) && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm animate-fade-in">
                        <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-[#059669]" /> 
                            {mode === 'to_pdf' ? 'PDF Settings' : 'Export Settings'}
                        </h3>
                        
                        {mode === 'to_pdf' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#64748B] uppercase mb-2 block">Page Size</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setPdfPageSize('a4')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${pdfPageSize === 'a4' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            A4
                                        </button>
                                        <button 
                                            onClick={() => setPdfPageSize('fit')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${pdfPageSize === 'fit' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            Fit Image
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#64748B] uppercase mb-2 block">Orientation</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setPdfOrientation('portrait')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${pdfOrientation === 'portrait' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            Portrait
                                        </button>
                                        <button 
                                            onClick={() => setPdfOrientation('landscape')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${pdfOrientation === 'landscape' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            Landscape
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={convertImagesToPdf}
                                    disabled={isGeneratingPdf}
                                    className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold mt-4 hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download PDF
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#64748B] uppercase mb-2 block">Output Format</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setOutputImageFormat('image/jpeg')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${outputImageFormat === 'image/jpeg' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            JPG
                                        </button>
                                        <button 
                                            onClick={() => setOutputImageFormat('image/png')}
                                            className={`py-2 rounded-lg text-sm font-semibold border ${outputImageFormat === 'image/png' ? 'bg-gray-100 border-gray-400 text-black' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            PNG
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    onClick={downloadAllAsZip}
                                    disabled={isZipping || pdfPages.length === 0}
                                    className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold mt-4 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isZipping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                    Download All (ZIP)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT: Preview Area */}
            <div className="lg:col-span-2">
                <div className="bg-[#E2E8F0] rounded-3xl border border-[#CBD5E1] p-6 min-h-[600px] flex flex-col relative overflow-hidden">
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-10" 
                        style={{ 
                        backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', 
                        backgroundSize: '24px 24px' 
                        }}
                    ></div>

                    {/* IMAGES TO PDF PREVIEW */}
                    {mode === 'to_pdf' && (
                        <div className="relative z-10 w-full">
                            {selectedImages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[500px]">
                                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p>Select images to start creating your PDF</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedImages.map((img, idx) => (
                                        <div key={idx} className="group relative aspect-[3/4] bg-white p-2 rounded-xl shadow-md transform transition-all hover:scale-105">
                                            <img 
                                                src={URL.createObjectURL(img)} 
                                                alt={`Page ${idx + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <button 
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur">
                                                Page {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Add More Button */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-[3/4] border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-white/50 hover:border-[#059669] hover:text-[#059669] transition-all cursor-pointer"
                                    >
                                        <Upload className="w-8 h-8 mb-2" />
                                        <span className="font-bold text-sm">Add More</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PDF TO IMAGES PREVIEW */}
                    {mode === 'from_pdf' && (
                         <div className="relative z-10 w-full">
                            {isRenderingPdf ? (
                                <div className="h-full flex flex-col items-center justify-center text-[#059669] min-h-[500px]">
                                    <RefreshCw className="w-12 h-12 mb-4 animate-spin" />
                                    <p className="font-bold">Rendering PDF Pages...</p>
                                </div>
                            ) : pdfPages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[500px]">
                                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                                    <p>Upload a PDF to view and download pages as images</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pdfPages.map((pageData, idx) => (
                                        <div key={idx} className="bg-white rounded-xl shadow-lg p-2 group">
                                            <div className="flex justify-between items-center px-2 py-2 mb-1 border-b border-gray-100">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Page {idx + 1}</span>
                                                <a 
                                                    href={pageData} 
                                                    download={`page-${idx + 1}.${outputImageFormat.split('/')[1]}`}
                                                    className="text-[#059669] hover:bg-[#ECFDF5] p-1.5 rounded-lg transition-colors"
                                                    title="Download this page"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                            <img 
                                                src={pageData} 
                                                alt={`Page ${idx + 1}`} 
                                                className="w-full h-auto rounded-lg border border-gray-100"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                         </div>
                    )}

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PdfConverter;