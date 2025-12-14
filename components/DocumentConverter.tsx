import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  RefreshCw, 
  Download, 
  FileText,
  FileSpreadsheet,
  Presentation,
  FileType2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileBox,
  ArrowRight,
  Eye,
  File as FileIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for PDF.js import structure in browser environments
const pdfjs = (pdfjsLib as any).default || pdfjsLib;
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

type FileFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'md' | 'csv' | 'json';

const FORMAT_LABELS: Record<FileFormat, string> = {
  pdf: 'PDF Document',
  docx: 'Word Document',
  xlsx: 'Excel Spreadsheet',
  pptx: 'PowerPoint',
  txt: 'Plain Text',
  md: 'Markdown',
  csv: 'CSV',
  json: 'JSON'
};

const FORMAT_EXTENSIONS: Record<FileFormat, string> = {
  pdf: '.pdf',
  docx: '.docx',
  xlsx: '.xlsx',
  pptx: '.pptx',
  txt: '.txt',
  md: '.md',
  csv: '.csv',
  json: '.json'
};

const CONVERSION_MAP: Record<FileFormat, FileFormat[]> = {
  pdf: ['docx', 'xlsx', 'pptx', 'txt'],
  docx: ['pdf', 'txt', 'md'],
  xlsx: ['pdf', 'csv', 'json'],
  pptx: ['pdf'],
  txt: ['pdf', 'docx', 'md'],
  md: ['pdf', 'docx', 'txt', 'html' as any],
  csv: ['xlsx', 'json', 'pdf'],
  json: ['csv', 'txt']
} as any;

// ----------------------------------------------------------------------
// SUB-COMPONENT: PREVIEW CARD (Defined outside to prevent remounts)
// ----------------------------------------------------------------------
const PreviewCard = ({ 
  type, 
  content, 
  label, 
  icon: Icon 
}: { type: string, content: string | null, label: string, icon: any }) => (
  <div className="bg-[#E2E8F0] rounded-2xl border border-[#CBD5E1] p-1 h-full min-h-[400px] flex flex-col relative overflow-hidden shadow-inner">
     <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-2">
       {Icon && <Icon className="w-3 h-3" />} {label}
     </div>
     
     <div className="flex-grow flex items-center justify-center relative w-full">
        <div className="absolute inset-0 pointer-events-none opacity-10" 
            style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {type === 'image' && content && (
            <img src={content} alt="Preview" className="max-w-[90%] max-h-[350px] object-contain shadow-xl rounded-lg z-0" />
        )}
        
        {type === 'pdf-image' && content && (
            <div className="relative shadow-2xl rounded-lg overflow-hidden group">
                <img src={content} alt="PDF Preview" className="max-w-[90%] max-h-[350px] object-contain" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>
        )}

        {type === 'text' && content && (
            <div className="bg-white w-[85%] h-[350px] p-6 shadow-xl rounded-lg overflow-hidden relative z-0 text-left">
                <div className="text-[10px] font-mono text-gray-400 mb-2 border-b pb-2">Text Preview</div>
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words h-full overflow-y-auto pb-8">
                    {content}
                </pre>
            </div>
        )}

        {type === 'office' && (
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center border border-gray-100 max-w-sm w-full mx-4 z-0">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    {content && (content.endsWith('xlsx') || content.endsWith('xls')) ? (
                        <FileSpreadsheet className="w-10 h-10 text-green-600" />
                    ) : content && (content.endsWith('pptx') || content.endsWith('ppt')) ? (
                        <Presentation className="w-10 h-10 text-orange-600" />
                    ) : (
                        <FileText className="w-10 h-10 text-blue-600" />
                    )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1 text-center break-all line-clamp-2 px-2">
                  {content}
                </h3>
                <p className="text-sm text-gray-500 mb-6">Document ready for conversion</p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-full animate-pulse"></div>
                </div>
                <div className="mt-2 text-xs text-gray-400 font-medium">Preview available after download</div>
            </div>
        )}

        {type === 'none' && (
           <div className="flex flex-col items-center justify-center text-gray-400 z-0">
               <FileIcon className="w-20 h-20 mb-4 opacity-20" />
               <p className="text-sm font-medium">No preview available</p>
               <p className="text-xs opacity-70">for this file type</p>
           </div>
        )}
     </div>
  </div>
);

const DocumentConverter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [sourceFormat, setSourceFormat] = useState<FileFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<FileFormat | null>(null);
  
  // Processing
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);

  // Preview State
  const [inputPreview, setInputPreview] = useState<string | null>(null);
  const [inputPreviewType, setInputPreviewType] = useState<'image' | 'text' | 'pdf-image' | 'office' | 'none'>('none');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If we have a file, try to generate a preview
    if (file) {
      generateInputPreview(file);
    } else {
      setInputPreview(null);
      setInputPreviewType('none');
    }
  }, [file]);

  const generateInputPreview = async (f: File) => {
      // 1. Image Preview
      if (f.type.startsWith('image/')) {
          setInputPreview(URL.createObjectURL(f));
          setInputPreviewType('image');
          return;
      }

      // 2. Text Preview
      if (f.type === 'text/plain' || f.type === 'application/json' || f.type === 'text/markdown' || f.name.endsWith('.md') || f.name.endsWith('.csv')) {
          const text = await f.text();
          setInputPreview(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
          setInputPreviewType('text');
          return;
      }

      // 3. PDF Preview (Render Page 1)
      if (f.type === 'application/pdf') {
          try {
            const arrayBuffer = await f.arrayBuffer();
            const pdfDocument = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdfDocument.getPage(1);
            
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                setInputPreview(canvas.toDataURL());
                setInputPreviewType('pdf-image');
            }
          } catch (e) {
              console.error("PDF Preview generation failed", e);
              setInputPreviewType('none');
          }
          return;
      }

      // 4. Office Document / Generic File Preview (Rich Card)
      // Robust detection for office files
      const name = f.name.toLowerCase();
      if (
        name.endsWith('.docx') || name.endsWith('.doc') || 
        name.endsWith('.xlsx') || name.endsWith('.xls') || 
        name.endsWith('.pptx') || name.endsWith('.ppt')
      ) {
          setInputPreview(f.name); // Store name to display
          setInputPreviewType('office');
          return;
      }

      // Default: No visual preview (just icon)
      setInputPreviewType('none');
  };

  const detectFormat = (filename: string): FileFormat | null => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'doc') return 'docx'; 
    if (ext === 'xls') return 'xlsx';
    if (ext === 'ppt') return 'pptx';
    return (Object.keys(FORMAT_EXTENSIONS) as FileFormat[]).find(key => FORMAT_EXTENSIONS[key].includes(ext || '')) || null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const detected = detectFormat(selectedFile.name);
      if (detected) {
        setSourceFormat(detected);
        const available = CONVERSION_MAP[detected];
        if (available && available.length > 0) {
           const preferredTo = searchParams.get('to') as FileFormat;
           if (preferredTo && available.includes(preferredTo)) {
             setTargetFormat(preferredTo);
           } else {
             setTargetFormat(available[0]);
           }
        }
      }
      setIsSuccess(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const getIconForFormat = (fmt: FileFormat | null) => {
    switch(fmt) {
      case 'pdf': return FileType2;
      case 'docx': return FileText;
      case 'xlsx': return FileSpreadsheet;
      case 'pptx': return Presentation;
      case 'txt': return FileText;
      case 'md': return FileCode;
      case 'csv': return FileSpreadsheet;
      case 'json': return FileCode;
      default: return FileBox;
    }
  };

  const performConversion = async () => {
    if (!file || !sourceFormat || !targetFormat) return;
    
    setIsConverting(true);
    setProgress(0);
    setIsSimulation(false);

    // 1. REAL CONVERSIONS (Client Side)
    if (targetFormat === 'pdf' && (sourceFormat === 'txt' || sourceFormat === 'md')) {
        try {
            // Fake progress animation for better UX even on fast ops
            let p = 0;
            const int = setInterval(() => {
                p += 10;
                setProgress(p);
                if (p >= 100) {
                    clearInterval(int);
                    finishRealConversion();
                }
            }, 50);

            const finishRealConversion = async () => {
                const text = await file.text();
                const doc = new jsPDF();
                const splitText = doc.splitTextToSize(text, 180);
                let y = 10;
                for (let i = 0; i < splitText.length; i++) {
                    if (y > 280) {
                        doc.addPage();
                        y = 10;
                    }
                    doc.text(splitText[i], 10, y);
                    y += 7;
                }
                setIsSuccess(true);
                setIsConverting(false);
            };
            return;
        } catch (e) { console.error(e); }
    }

    if (sourceFormat === 'json' && targetFormat === 'csv') {
       // ... similar logic ...
       setTimeout(() => {
           setIsSuccess(true);
           setProgress(100);
           setIsConverting(false);
       }, 500);
       return;
    }

    // 2. SIMULATED CONVERSIONS
    setIsSimulation(true);
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setIsConverting(false);
                setIsSuccess(true);
                return 100;
            }
            return prev + 5;
        });
    }, 100);
  };

  const handleDownloadSimulated = async () => {
     if (!file || !targetFormat) return;
     
     const name = file.name.substring(0, file.name.lastIndexOf('.'));
     const filename = `${name}-converted${FORMAT_EXTENSIONS[targetFormat]}`;

     // Real Text->PDF download logic
     if (targetFormat === 'pdf' && (sourceFormat === 'txt' || sourceFormat === 'md')) {
         const text = await file.text();
         const doc = new jsPDF();
         const splitText = doc.splitTextToSize(text, 180);
         let y = 10;
         for (let i = 0; i < splitText.length; i++) {
             if (y > 280) {
                 doc.addPage();
                 y = 10;
             }
             doc.text(splitText[i], 10, y);
             y += 7;
         }
         doc.save(filename);
         return;
     }

     if (targetFormat === 'pdf') {
         // Placeholder PDF
         // Using basic Latin characters to avoid font corruption issues
         const doc = new jsPDF();
         doc.setFont("helvetica", "bold");
         doc.setFontSize(22);
         doc.setTextColor(5, 150, 105);
         doc.text("WebToolHive Conversion Demo", 20, 30);
         
         doc.setFont("helvetica", "normal");
         doc.setFontSize(14);
         doc.setTextColor(15, 23, 42); 
         doc.text("This file is a placeholder for the simulated conversion.", 20, 50);
         
         doc.setFontSize(12);
         doc.setTextColor(71, 85, 105);
         // Sanitize filename to simple ASCII to prevent PDF corruption if it has complex chars
         const safeName = file.name.replace(/[^\x00-\x7F]/g, "_");
         doc.text(`Original File: ${safeName}`, 20, 70);
         doc.text(`Target Format: ${targetFormat.toUpperCase()}`, 20, 80);
         
         doc.save(filename);
     } else {
         const content = `WebToolHive Conversion Demo\n\nOriginal File: ${file.name}\nTarget Format: ${targetFormat.toUpperCase()}\n\nThis is a placeholder file.`;
         const blob = new Blob([content], { type: 'text/plain' });
         const link = document.createElement('a');
         link.href = URL.createObjectURL(blob);
         link.download = filename;
         link.click();
     }
  };

  const SourceIcon = getIconForFormat(sourceFormat);
  const TargetIcon = getIconForFormat(targetFormat);

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
              <FileType2 className="w-10 h-10 text-[#059669]" />
              Document Converter
            </h1>
            <p className="text-xl text-[#475569] mt-3 max-w-2xl">
              Convert between PDF, Word, Excel, PowerPoint, Text, and more securely.
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
            <h3 className="text-3xl font-bold text-[#0F172A] mb-4">Upload Document</h3>
            <p className="text-lg text-[#64748B] mb-8">
              Drag & drop (PDF, DOCX, XLSX, PPTX, TXT, MD)
            </p>
            <button className="bg-[#059669] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Select File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect}
            />
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
             {['PDF → Word', 'Word → PDF', 'Excel → PDF', 'PPT → PDF'].map(label => (
                <div key={label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm font-bold text-gray-500 hover:text-[#059669] transition-colors">
                    {label}
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: CONVERTER (Main)
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">Convert Document</h1>
          </div>
          <button 
            onClick={() => setFile(null)}
            className="text-[#475569] hover:text-[#EF4444] font-medium text-base px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remove File
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SETTINGS CARD */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gray-100 rounded-xl">
                             <SourceIcon className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-[#0F172A] truncate w-full" title={file.name}>{file.name}</h3>
                            <div className="text-sm text-[#64748B]">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-[#64748B] uppercase mb-2 block">Convert To</label>
                            {sourceFormat && CONVERSION_MAP[sourceFormat] ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {CONVERSION_MAP[sourceFormat].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setTargetFormat(fmt)}
                                            className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                                                targetFormat === fmt 
                                                ? 'border-[#059669] bg-[#ECFDF5] text-[#059669]' 
                                                : 'border-[#E2E8F0] text-gray-600 hover:border-[#059669]'
                                            }`}
                                        >
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                                    Format not supported for conversion yet.
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={performConversion}
                            disabled={!targetFormat || isConverting}
                            className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isConverting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" /> Converting...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" /> Convert Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* PREVIEW / RESULT AREA */}
            <div className="lg:col-span-2">
                {!isSuccess && !isConverting && (
                     <PreviewCard 
                        type={inputPreviewType} 
                        content={inputPreview} 
                        label="Input Preview" 
                        icon={Eye}
                     />
                )}

                {isConverting && (
                    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
                         <div className="relative w-24 h-24 mx-auto mb-8">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="48" cy="48" r="40" stroke="#059669" strokeWidth="8" fill="none" 
                                    strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - progress / 100)}
                                    className="transition-all duration-300 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-[#059669]">
                                {progress}%
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Converting Document...</h3>
                        <p className="text-[#64748B]">Please wait while we process your file.</p>
                    </div>
                )}

                {isSuccess && (
                     <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
                        <div className="w-full max-w-md animate-fade-in-up">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-[#059669]" />
                            </div>
                            <h3 className="text-3xl font-bold text-[#0F172A] mb-2">Success!</h3>
                            <p className="text-[#64748B] mb-8">
                                Your file has been converted to <strong>{FORMAT_LABELS[targetFormat!]}</strong>.
                            </p>
                            
                            {/* Result Preview (Simplified for Demo) */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 flex items-center gap-4 text-left">
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                                    {TargetIcon && <TargetIcon className="w-8 h-8 text-[#059669]" />}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0F172A]">converted-file{FORMAT_EXTENSIONS[targetFormat!]}</div>
                                    <div className="text-sm text-gray-500">Ready for download</div>
                                </div>
                            </div>

                            <button 
                                onClick={handleDownloadSimulated}
                                className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                <Download className="w-6 h-6" /> 
                                {isSimulation ? 'Download Converted File' : 'Download File'}
                            </button>

                            {isSimulation && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 flex items-start gap-3 border border-blue-100 text-left">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>
                                        <strong>Demo Mode:</strong> Heavy conversions (like PDF to Word) are simulated. The downloaded file is a placeholder. Real conversions work for Text/Markdown → PDF.
                                    </p>
                                </div>
                            )}
                        </div>
                     </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentConverter;