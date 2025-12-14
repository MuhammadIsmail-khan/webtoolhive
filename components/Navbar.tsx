import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { label: 'PDF Tools', href: 'tools' },
  { label: 'AI Tools', href: 'tools' },
  { label: 'Image Tools', href: 'tools' },
  { label: 'Text Tools', href: 'tools' },
  { label: 'Calculators', href: 'tools' },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setIsOpen(false);

    if (location.pathname !== '/') {
      // If we are on a sub-page, go home first, then scroll
      navigate('/');
      // Allow a brief moment for the home page to mount
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If we are already home, just scroll
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="h-[80px] sticky top-0 bg-white z-50 w-full transition-shadow duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 w-full h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
            <img src="images/logo.png" alt="WebToolHive" className="h-10 w-auto object-contain" />
            <span className="font-bold text-2xl text-[#0F172A] tracking-tight">WebToolHive</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={`#${item.href}`}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-[#475569] hover:text-[#059669] font-medium text-base transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <button 
              onClick={(e) => handleNavClick(e, 'tools')}
              className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-3 rounded-xl text-base font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#475569] hover:text-[#059669] focus:outline-none"
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute top-[80px] w-full shadow-lg">
          <div className="px-6 pt-4 pb-8 space-y-2">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={`#${item.href}`}
                className="block px-4 py-3 rounded-xl text-lg font-medium text-[#0F172A] hover:bg-emerald-50 hover:text-[#059669]"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-6">
              <button 
                onClick={(e) => handleNavClick(e, 'tools')}
                className="w-full bg-[#059669] text-white px-5 py-4 rounded-xl text-lg font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;