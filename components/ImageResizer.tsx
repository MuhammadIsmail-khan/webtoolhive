import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Maximize, 
  RefreshCw, 
  Wand2, 
  ArrowLeft,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

const ImageResizer: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // Resize State
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);
  
  // AI Edit State
  const [activeTab, setActiveTab] = useState<'resize' | 'ai'>('resize');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setAiResultUrl(null);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions.width > 0) {
      setHeight(Math.round(newWidth * (originalDimensions.height / originalDimensions.width)));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions.height > 0) {
      setWidth(Math.round(newHeight * (originalDimensions.width / originalDimensions.height)));
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL(format, quality / 100);
      
      const link = document.createElement('a');
      link.download = `resized-image.${format.split('/')[1]}`;
      link.href = dataUrl;
      link.click();
    };
    img.src = previewUrl;
  };

  const handleAiGenerate = async () => {
    if (!imageFile || !aiPrompt) return;

    setIsAiProcessing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        const mimeType = imageFile.type;

        const resultBase64 = await geminiService.generateImageEdit(base64Data, mimeType, aiPrompt);
        
        if (resultBase64) {
          const resultUrl = `data:image/png;base64,${resultBase64}`;
          setAiResultUrl(resultUrl);
        }
        setIsAiProcessing(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error(error);
      setIsAiProcessing(false);
      alert('Failed to generate image edit. Please try again.');
    }
  };

  if (!imageFile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-4 font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-[#0F172A]">Image Resizer & Editor</h1>
            <p className="text-xl text-[#475569] mt-3 max-w-2xl">Resize images instantly or use AI to creatively edit them with professional quality.</p>
          </div>

          <div 
            className="bg-white border-2 border-dashed border-[#CBD5E1] rounded-3xl p-16 md:p-24 text-center hover:border-[#059669] transition-colors cursor-pointer shadow-sm hover:shadow-md group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-[#059669]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-3">Upload an Image</h3>
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#475569]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-[#0F172A]">Edit Image</h1>
          </div>
          <button 
            onClick={() => setImageFile(null)}
            className="text-[#475569] hover:text-[#EF4444] font-medium text-base px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remove Image
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="flex border-b border-[#E5E7EB]">
                <button
                  className={`flex-1 py-5 text-base font-semibold flex items-center justify-center gap-2 ${
                    activeTab === 'resize' 
                      ? 'text-[#059669] border-b-2 border-[#059669] bg-[#ECFDF5]/50' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('resize')}
                >
                  <Maximize className="w-5 h-5" /> Resize
                </button>
                <button
                  className={`flex-1 py-5 text-base font-semibold flex items-center justify-center gap-2 ${
                    activeTab === 'ai' 
                      ? 'text-[#059669] border-b-2 border-[#059669] bg-[#ECFDF5]/50' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('ai')}
                >
                  <Wand2 className="w-5 h-5" /> AI Magic Edit
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'resize' ? (
                  <div className="space-y-8">
                    <div>
                      <label className="block text-base font-semibold text-[#0F172A] mb-4">Dimensions</label>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-medium text-[#64748B] mb-2 block uppercase tracking-wider">Width (px)</label>
                          <input
                            type="number"
                            value={width}
                            onChange={handleWidthChange}
                            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg text-[#0F172A] focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#64748B] mb-2 block uppercase tracking-wider">Height (px)</label>
                          <input
                            type="number"
                            value={height}
                            onChange={handleHeightChange}
                            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-lg text-[#0F172A] focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none bg-gray-50"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                        className={`mt-4 text-sm font-medium flex items-center gap-2 ${maintainAspectRatio ? 'text-[#059669]' : 'text-[#64748B]'}`}
                      >
                        {maintainAspectRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        Maintain Aspect Ratio
                      </button>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-[#0F172A] mb-4">Format & Quality</label>
                      <div className="relative mb-5">
                         <select 
                           value={format}
                           onChange={(e) => setFormat(e.target.value as any)}
                           className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] focus:ring-2 focus:ring-[#059669] outline-none appearance-none bg-white"
                         >
                           <option value="image/jpeg">JPEG</option>
                           <option value="image/png">PNG</option>
                           <option value="image/webp">WebP</option>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                           <Sliders className="w-4 h-4" />
                         </div>
                      </div>
                      
                      <div className="flex justify-between text-sm font-medium text-[#0F172A] mb-3">
                        <span>Image Quality</span>
                        <span className="text-[#059669]">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                      />
                    </div>

                    <button 
                      onClick={handleDownload}
                      className="w-full bg-[#059669] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#047857] transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Download className="w-5 h-5" /> Download Resized
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[#ECFDF5] p-5 rounded-2xl border border-[#D1FAE5]">
                      <h4 className="text-base font-bold text-[#065F46] flex items-center gap-2 mb-2">
                        <Wand2 className="w-5 h-5" /> AI Powered
                      </h4>
                      <p className="text-sm text-[#064E3B] leading-relaxed">
                        Use Gemini AI to transform your image. Describe how you want to change it (e.g., "Make it look like an oil painting", "Add a cyberpunk filter").
                      </p>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-[#0F172A] mb-3">Describe Changes</label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="E.g., Turn this into a sketch..."
                        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-4 text-[#0F172A] focus:ring-2 focus:ring-[#059669] focus:border-transparent outline-none h-40 resize-none text-base"
                      />
                    </div>

                    <button 
                      onClick={handleAiGenerate}
                      disabled={isAiProcessing || !aiPrompt}
                      className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-md"
                    >
                      {isAiProcessing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" /> Generate with Gemini
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
             <div className="bg-[#E2E8F0] rounded-3xl border border-[#CBD5E1] p-2 h-[700px] flex items-center justify-center overflow-hidden relative shadow-inner">
               <div 
                 className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{ 
                   backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', 
                   backgroundSize: '24px 24px' 
                 }}
               ></div>
               
               {activeTab === 'ai' && aiResultUrl ? (
                 <div className="relative w-full h-full flex items-center justify-center">
                   <img 
                     src={aiResultUrl} 
                     alt="AI Result" 
                     className="max-w-full max-h-full object-contain shadow-2xl rounded-xl"
                   />
                   <a 
                      href={aiResultUrl} 
                      download="ai-edited-image.png"
                      className="absolute bottom-8 right-8 bg-white text-[#0F172A] px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-gray-50 flex items-center gap-3 transition-transform hover:scale-105"
                   >
                     <Download className="w-5 h-5" /> Save AI Result
                   </a>
                 </div>
               ) : (
                 <img 
                   src={previewUrl!} 
                   alt="Preview" 
                   className="max-w-full max-h-full object-contain shadow-2xl rounded-xl z-10"
                   style={{
                     width: activeTab === 'resize' ? `${width}px` : undefined,
                     maxWidth: '96%',
                     maxHeight: '96%'
                   }}
                 />
               )}
               
               <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
                 {activeTab === 'ai' && aiResultUrl ? '✨ AI Generated Result' : `Original: ${originalDimensions.width} x ${originalDimensions.height}`}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageResizer;