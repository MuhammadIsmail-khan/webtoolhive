import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, Download, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, PlayCircle, FileCheck, Server, ServerOff } from 'lucide-react';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
// Once you deploy your backend (e.g., on Render), replace this URL.
// Example: const BACKEND_URL = 'https://my-omnitools-backend.onrender.com';
const BACKEND_URL = 'http://localhost:3001'; 
// ----------------------------------------------------------------------------

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Server Status State
  const [useRealBackend, setUseRealBackend] = useState(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeDownloadFormat, setActiveDownloadFormat] = useState<string | null>(null);

  // 1. Fetch Metadata
  const fetchVideoData = async (videoUrl: string) => {
    try {
      // ATTEMPT 1: Try Real Backend First
      try {
        const res = await fetch(`${BACKEND_URL}/api/info?url=${encodeURIComponent(videoUrl)}`);
        if (res.ok) {
            const data = await res.json();
            setUseRealBackend(true);
            return {
                title: data.title,
                author: data.author,
                thumbnail: data.thumbnail,
                duration: data.duration,
                source: 'YouTube (Real Backend)',
                // Transform backend formats to UI formats
                formats: data.formats.map((f: any) => ({
                    quality: f.quality || 'Unknown',
                    size: 'Unknown',
                    type: f.hasAudio ? 'video' : 'video-muted',
                    itag: f.itag
                })).slice(0, 5) // Limit for UI
            };
        }
      } catch (e) {
        // Backend failed or not running, fall through to demo
        setUseRealBackend(false);
        console.log("Backend not reachable, switching to Demo Mode");
      }

      // ATTEMPT 2: Demo Mode (oEmbed)
      // Using noembed.com as a public oEmbed proxy to get metadata without CORS issues
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
      const data = await response.json();

      if (data.error || !data.title) {
        throw new Error('Could not fetch video details. Please check the URL.');
      }

      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url,
        duration: 'Unknown',
        source: data.provider_name,
        formats: [
          { quality: '1080p (MP4)', size: 'High', type: 'video' },
          { quality: '720p (MP4)', size: 'Medium', type: 'video' },
          { quality: '480p (MP4)', size: 'Low', type: 'video' },
          { quality: 'Audio (MP3)', size: 'Audio Only', type: 'audio' }
        ]
      };
    } catch (err) {
      throw err;
    }
  };

  const handleAnalyze = async () => {
    if (!url) {
      setError('Please enter a valid video URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (_) {
      setError('Please enter a valid URL (e.g., https://youtube.com/...)');
      return;
    }
    
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const metadata = await fetchVideoData(url);
      
      if (!useRealBackend) {
          // Simulate processing time for demo feel
          await new Promise(resolve => setTimeout(resolve, 800));
      }

      setResult(metadata);
    } catch (err) {
      console.error(err);
      setError('Failed to load video. Make sure the link is correct and from a supported platform (YouTube, Vimeo, etc.).');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger a browser download from a Blob
  const triggerFileDownload = (blob: Blob, filename: string) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  };

  // 2. Download Logic
  const handleDownload = async (format: any) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setActiveDownloadFormat(format.quality);
    setDownloadProgress(0);
    setError('');

    const safeTitle = (result?.title || 'download').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const isAudio = format.quality.toLowerCase().includes('audio');
    const ext = isAudio ? 'mp3' : 'mp4';
    const filename = `${safeTitle}.${ext}`;

    try {
      // ------------------------------------------------
      // PATH A: REAL BACKEND DOWNLOAD
      // ------------------------------------------------
      if (useRealBackend && format.itag) {
          const downloadUrl = `${BACKEND_URL}/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}&title=${encodeURIComponent(safeTitle)}`;
          
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error('Backend download failed');

          const reader = response.body?.getReader();
          const contentLength = +response.headers.get('Content-Length')!;
          
          let receivedLength = 0;
          const chunks = [];

          if (reader) {
             while(true) {
                const {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedLength += value.length;
                if (contentLength) {
                    setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
                } else {
                    setDownloadProgress(prev => Math.min(prev + 1, 90));
                }
             }
             const blob = new Blob(chunks);
             triggerFileDownload(blob, filename);
             setDownloadProgress(100);
             setTimeout(() => {
                setIsDownloading(false);
                setActiveDownloadFormat(null);
                setDownloadProgress(0);
             }, 1000);
             return;
          }
      }

      // ------------------------------------------------
      // PATH B: CLIENT SIDE / DEMO MODE
      // ------------------------------------------------
      const isDirectFile = url.match(/\.(mp4|webm|ogg|mp3)$/i);
      
      if (isDirectFile) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Network error');
          const reader = response.body?.getReader();
          const contentLength = +response.headers.get('Content-Length')!;
          let receivedLength = 0;
          const chunks = []; 
          if (reader) {
            while(true) {
              const {done, value} = await reader.read();
              if (done) break;
              chunks.push(value);
              receivedLength += value.length;
              if (contentLength) setDownloadProgress(Math.round((receivedLength / contentLength) * 100));
            }
            const blob = new Blob(chunks);
            triggerFileDownload(blob, filename);
            setIsDownloading(false);
            setActiveDownloadFormat(null);
            setDownloadProgress(0);
            return; 
          }
        } catch (e) { console.warn("Direct fetch failed", e); }
      }

      simulateDownload(filename);

    } catch (err) {
      console.error(err);
      setError('An error occurred during download.');
      setIsDownloading(false);
      setActiveDownloadFormat(null);
    }
  };

  const simulateDownload = (filename: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setDownloadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        const dummyContent = `This is a demo file for: ${result?.title || 'Video'}\n\nTo get real video files, please deploy the backend server code provided and update the BACKEND_URL in VideoDownloader.tsx.`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        triggerFileDownload(blob, filename);
        
        setTimeout(() => {
          setIsDownloading(false);
          setActiveDownloadFormat(null);
          setDownloadProgress(0);
        }, 1000);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center text-[#475569] hover:text-[#059669] transition-colors mb-6 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] flex items-center justify-center gap-4 mb-4">
            <Video className="w-10 h-10 md:w-12 md:h-12 text-[#E11D48]" />
            Video Downloader
          </h1>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Download videos from YouTube, Vimeo, Facebook, and more in HD quality directly to your device.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-8 md:p-12 mb-12 max-w-4xl mx-auto">
          <label className="block text-base font-semibold text-[#0F172A] mb-4">Paste Video URL</label>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="h-6 w-6 text-[#94A3B8]" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="https://youtube.com/watch?v=..."
                className="block w-full pl-12 pr-4 py-5 text-lg border border-[#E2E8F0] rounded-2xl bg-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent text-[#0F172A] transition-all"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || isDownloading}
              className="bg-[#059669] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#047857] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 min-w-[160px]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start'}
            </button>
          </div>
          {error && (
            <div className="mt-6 flex items-center text-[#EF4444] bg-red-50 p-4 rounded-xl border border-red-100 animate-fade-in">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl border border-[#E5E7EB] overflow-hidden animate-fade-in-up max-w-5xl mx-auto">
            <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Thumbnail */}
              <div className="md:col-span-1">
                <div className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer aspect-video md:aspect-[4/3]">
                  <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <PlayCircle className="w-16 h-16 text-white/90" />
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="font-bold text-xl text-[#0F172A] leading-tight line-clamp-2">{result.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#64748B]">
                    <span className="font-medium">{result.source || 'Video'}</span>
                    <span>•</span>
                    <span>{result.author}</span>
                    {useRealBackend ? (
                      <span className="flex items-center gap-1 text-[#059669] bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100 ml-auto">
                        <Server className="w-3 h-3" /> Server Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100 ml-auto">
                        <ServerOff className="w-3 h-3" /> Demo Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-xl text-[#0F172A] flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                    Available Formats
                  </h4>
                  {isDownloading && (
                    <span className="text-sm font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1.5 rounded-full animate-pulse border border-[#D1FAE5]">
                      Processing... {downloadProgress}%
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {result.formats.map((fmt: any, idx: number) => {
                     const isThisActive = activeDownloadFormat === fmt.quality;
                     
                     return (
                    <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border transition-all bg-white group ${
                      isThisActive ? 'border-[#059669] bg-[#ECFDF5]/20 ring-1 ring-[#059669]/20' : 'border-[#E2E8F0] hover:border-[#059669] hover:bg-[#ECFDF5]/30'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${fmt.type.includes('video') ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {fmt.type.includes('video') ? <Video className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-[#0F172A]">{fmt.quality}</div>
                          <div className="text-sm text-[#64748B]">{fmt.size}</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDownload(fmt)}
                        disabled={isDownloading}
                        className={`px-6 py-3 rounded-xl text-base font-semibold transition-all flex items-center gap-2 min-w-[140px] justify-center ${
                          isThisActive 
                            ? 'bg-[#059669] text-white shadow-md' 
                            : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#059669] hover:text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isThisActive ? (
                          downloadProgress >= 100 ? (
                            <>
                              <FileCheck className="w-5 h-5" /> Done
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> {downloadProgress}%
                            </>
                          )
                        ) : (
                          <>
                            <Download className="w-5 h-5" /> Download
                          </>
                        )}
                      </button>
                    </div>
                  );
                  })}
                </div>
                
                {/* Demo Disclaimer */}
                {!useRealBackend && (
                  <div className="mt-8 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 flex items-start gap-3 border border-blue-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Demo Mode:</strong> The app is currently running in client-only mode so video downloads are simulated. To enable real downloads, deploy the backend server code provided and update the configuration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features / SEO Text */}
        {!result && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#ECFDF5] rounded-xl flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-[#059669]" />
              </div>
              <h3 className="font-bold text-xl text-[#0F172A] mb-3">High Quality</h3>
              <p className="text-base text-[#64748B] leading-relaxed">Download videos in 4K, 1080p, and 720p resolutions depending on the source quality.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#ECFDF5] rounded-xl flex items-center justify-center mb-6">
                <Download className="w-6 h-6 text-[#059669]" />
              </div>
              <h3 className="font-bold text-xl text-[#0F172A] mb-3">Fast & Free</h3>
              <p className="text-base text-[#64748B] leading-relaxed">No limitations on downloads. High-speed processing for immediate results.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#ECFDF5] rounded-xl flex items-center justify-center mb-6">
                <LinkIcon className="w-6 h-6 text-[#059669]" />
              </div>
              <h3 className="font-bold text-xl text-[#0F172A] mb-3">Universal Support</h3>
              <p className="text-base text-[#64748B] leading-relaxed">Works with all major video hosting platforms and social media sites seamlessly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDownloader;