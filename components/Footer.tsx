import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0F172A] text-[#CBD5E1] py-20 border-t border-gray-800">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <img src="images/logo.png" alt="WebToolHive" className="h-8 w-auto object-contain brightness-0 invert" />
              <span className="font-bold text-2xl text-white tracking-tight">WebToolHive</span>
            </div>
            <p className="text-base leading-relaxed text-gray-400">
              The modern platform for all your document, image, and text needs. Secure, fast, and enhanced with Artificial Intelligence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-8">Product</h4>
            <ul className="space-y-4 text-base">
              <li><a href="#" className="hover:text-[#059669] transition-colors">PDF Tools</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">Image Converter</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">Calculators</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-8">Company</h4>
            <ul className="space-y-4 text-base">
              <li><a href="#" className="hover:text-[#059669] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#059669] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-8">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 p-3 rounded-xl hover:bg-[#059669] transition-colors text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="bg-gray-800 p-3 rounded-xl hover:bg-[#059669] transition-colors text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="bg-gray-800 p-3 rounded-xl hover:bg-[#059669] transition-colors text-white">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} WebToolHive Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-400">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;