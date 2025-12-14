import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#022C22] to-[#064E3B] py-24 lg:py-40 2xl:py-48">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] 2xl:w-[700px] 2xl:h-[700px] rounded-full bg-[#10B981] blur-[120px]"></div>
        <div className="absolute top-[20%] right-[0%] w-[400px] h-[400px] 2xl:w-[600px] 2xl:h-[600px] rounded-full bg-[#0D9488] blur-[100px]"></div>
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-12 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-10 animate-fade-in-up">
          <Sparkles className="w-5 h-5 text-[#34D399]" />
          <span className="text-base font-medium text-white/90">New: AI-Powered PDF Assistant</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
          All Online Tools, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            One Smart Platform
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-xl md:text-2xl 2xl:text-3xl text-[#D1FAE5] mb-12 leading-relaxed">
          PDF tools, AI question answering, converters, and compressors — fast, secure, and free. 
          Everything you need to manage your digital documents.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
          <button className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white px-10 py-5 rounded-2xl font-semibold text-lg 2xl:text-xl transition-all duration-300 shadow-[0_10px_25px_rgba(5,150,105,0.3)] hover:-translate-y-1 flex items-center justify-center gap-3">
            Get Started Free
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <button className="w-full sm:w-auto bg-transparent border border-[#6EE7B7] hover:bg-white/5 text-[#6EE7B7] hover:text-white px-10 py-5 rounded-2xl font-semibold text-lg 2xl:text-xl transition-all duration-300">
            View All Tools
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;