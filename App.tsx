import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Footer from './components/Footer';
import ImageResizer from './components/ImageResizer';
import ImageCropper from './components/ImageCropper';
import ImageConverter from './components/ImageConverter';
import VideoDownloader from './components/VideoDownloader';
import PdfCompressor from './components/PdfCompressor';
import PdfConverter from './components/PdfConverter';
import DocumentConverter from './components/DocumentConverter';
import ColorIntelligence from './components/ColorIntelligence';
import BMICalculator from './components/calculators/BMICalculator';
import AgeCalculator from './components/calculators/AgeCalculator';
import LoanCalculator from './components/calculators/LoanCalculator';
import PercentageCalculator from './components/calculators/PercentageCalculator';

// A simple placeholder for specific tool routes
const ToolPlaceholder = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
    <h1 className="text-3xl font-bold text-[#0F172A] mb-4">{title}</h1>
    <p className="text-[#475569]">This tool interface is under construction.</p>
    <Link to="/" className="mt-8 text-[#059669] hover:underline">← Back to Home</Link>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        {/* Section divider to ensure background alternation */}
        <section className="bg-white">
          <div className="py-8">
             {/* Stats strip could go here */}
          </div>
        </section>
        <section id="tools" className="bg-[#F8FAFC]">
           <ToolsGrid />
        </section>
        
        {/* Features / Trust Section */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-2xl font-bold text-[#0F172A] mb-12">Trusted by teams who value speed and privacy</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale">
                <div className="flex items-center justify-center font-bold text-xl">ACME Corp</div>
                <div className="flex items-center justify-center font-bold text-xl">GlobalBank</div>
                <div className="flex items-center justify-center font-bold text-xl">TechSpace</div>
                <div className="flex items-center justify-center font-bold text-xl">LogiFlow</div>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pdf-compress" element={<PdfCompressor />} />
        <Route path="/pdf-chat" element={<ToolPlaceholder title="Chat with PDF (AI)" />} />
        <Route path="/pdf-convert" element={<PdfConverter />} />
        <Route path="/document-convert" element={<DocumentConverter />} />
        <Route path="/image-resize" element={<ImageResizer />} />
        <Route path="/image-crop" element={<ImageCropper />} />
        <Route path="/image-convert" element={<ImageConverter />} />
        <Route path="/color-tools" element={<ColorIntelligence />} />
        <Route path="/video-downloader" element={<VideoDownloader />} />
        <Route path="/word-counter" element={<ToolPlaceholder title="Word Counter" />} />
        <Route path="/summarizer" element={<ToolPlaceholder title="Text Summarizer (AI)" />} />
        
        {/* Calculators */}
        <Route path="/bmi-calculator" element={<BMICalculator />} />
        <Route path="/age-calculator" element={<AgeCalculator />} />
        <Route path="/loan-calculator" element={<LoanCalculator />} />
        <Route path="/percentage-calculator" element={<PercentageCalculator />} />
      </Routes>
    </Router>
  );
};

export default App;