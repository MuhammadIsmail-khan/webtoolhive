import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ToolItem, ToolCategory } from '../types';
import { ArrowUpRight, Zap } from 'lucide-react';

interface ToolCardProps {
  tool: ToolItem;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const navigate = useNavigate();

  const getIconColor = (category: ToolCategory) => {
    switch (category) {
      case ToolCategory.PDF: return 'text-[#059669]'; // Emerald
      case ToolCategory.AI: return 'text-[#10B981]'; // Emerald-500
      case ToolCategory.IMAGE: return 'text-[#0D9488]'; // Teal
      case ToolCategory.VIDEO: return 'text-[#E11D48]'; // Rose for Video
      case ToolCategory.TEXT: return 'text-[#F59E0B]'; // Amber
      default: return 'text-[#059669]';
    }
  };

  const getIconBg = (category: ToolCategory) => {
    return 'bg-[#ECFDF5]'; // Light Emerald background
  };

  return (
    <div 
      onClick={() => navigate(tool.path)}
      className={`
      group relative bg-white rounded-2xl border border-[#E5E7EB] p-6 
      transition-all duration-300 ease-out 
      hover:-translate-y-1 
      shadow-[0_10px_30px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.03)]
      hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
      cursor-pointer flex flex-col h-full
      ${tool.isAiPowered ? 'ring-1 ring-[#059669]/20 shadow-[0_0_0_4px_rgba(5,150,105,0.05)]' : ''}
    `}>
      {tool.isAiPowered && (
        <div className="absolute top-4 right-4 bg-[#10B981] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Zap className="w-3 h-3 fill-current" />
          AI Powered
        </div>
      )}

      <div className={`w-14 h-14 rounded-2xl ${getIconBg(tool.category)} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
        <tool.icon className={`w-7 h-7 ${getIconColor(tool.category)}`} strokeWidth={2} />
      </div>

      <h3 className="text-xl font-bold text-[#0F172A] mb-2 group-hover:text-[#059669] transition-colors">
        {tool.title}
      </h3>
      
      <p className="text-[#475569] text-base leading-relaxed mb-6 flex-grow">
        {tool.description}
      </p>

      <div className="flex items-center text-[#059669] font-medium text-sm mt-auto opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Try Tool <ArrowUpRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

export default ToolCard;