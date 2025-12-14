import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Type, 
  Calculator, 
  Bot, 
  Minimize2, 
  ArrowLeftRight, 
  Crop,
  Percent,
  Video,
  Activity,
  Calendar,
  DollarSign,
  RefreshCcw,
  Layers,
  FileSpreadsheet,
  Presentation,
  FileType2,
  FileCode,
  Palette
} from 'lucide-react';
import { ToolItem, ToolCategory } from '../types';
import ToolCard from './ToolCard';

const tools: ToolItem[] = [
  // Document Tools (Traffic Drivers)
  {
    id: 'doc-converter',
    title: 'Document Converter',
    description: 'All-in-one converter for PDF, Word, Excel, PPT, and Text files.',
    icon: FileType2,
    category: ToolCategory.DOCUMENT,
    isNew: true,
    path: '/document-convert'
  },
  {
    id: 'word-pdf',
    title: 'Word to PDF',
    description: 'Convert DOC and DOCX files to PDF documents instantly.',
    icon: FileText,
    category: ToolCategory.DOCUMENT,
    path: '/document-convert?from=word&to=pdf'
  },
  {
    id: 'pdf-word',
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable Word (DOCX) files.',
    icon: FileText,
    category: ToolCategory.DOCUMENT,
    path: '/document-convert?from=pdf&to=word'
  },
  {
    id: 'excel-pdf',
    title: 'Excel to PDF',
    description: 'Transform XLS and XLSX spreadsheets into PDF documents.',
    icon: FileSpreadsheet,
    category: ToolCategory.DOCUMENT,
    path: '/document-convert?from=excel&to=pdf'
  },
  {
    id: 'ppt-pdf',
    title: 'PPT to PDF',
    description: 'Convert PowerPoint presentations to PDF for easy sharing.',
    icon: Presentation,
    category: ToolCategory.DOCUMENT,
    path: '/document-convert?from=ppt&to=pdf'
  },
  
  // PDF Tools
  {
    id: 'pdf-compress',
    title: 'PDF Compressor',
    description: 'Reduce PDF file size while maintaining the best quality. Perfect for uploads.',
    icon: Minimize2,
    category: ToolCategory.PDF,
    path: '/pdf-compress'
  },
  {
    id: 'pdf-convert',
    title: 'PDF ↔ Image',
    description: 'Convert PDF to JPG/PNG images or merge images into a PDF document.',
    icon: Layers,
    category: ToolCategory.PDF,
    path: '/pdf-convert'
  },
  {
    id: 'pdf-chat',
    title: 'Chat with PDF',
    description: 'Upload your document and ask questions. Get answers instantly powered by Gemini AI.',
    icon: Bot,
    category: ToolCategory.AI,
    isAiPowered: true,
    path: '/pdf-chat'
  },
  
  // Image & Video
  {
    id: 'color-tools',
    title: 'Color Intelligence',
    description: 'Extract palettes from images, check contrast accessibility, and generate website themes.',
    icon: Palette,
    category: ToolCategory.IMAGE,
    isNew: true,
    path: '/color-tools'
  },
  {
    id: 'image-converter',
    title: 'Image Converter',
    description: 'Convert images between formats like JPG, PNG, WEBP, and BMP instantly.',
    icon: RefreshCcw,
    category: ToolCategory.IMAGE,
    path: '/image-convert'
  },
  {
    id: 'image-resize',
    title: 'Image Resizer',
    description: 'Resize images to any dimension. Supports JPG, PNG, and WebP formats.',
    icon: ImageIcon,
    category: ToolCategory.IMAGE,
    path: '/image-resize'
  },
  {
    id: 'image-crop',
    title: 'Image Cropper',
    description: 'Crop images for social media, profiles, or custom aspect ratios.',
    icon: Crop,
    category: ToolCategory.IMAGE,
    path: '/image-crop'
  },
  {
    id: 'video-downloader',
    title: 'Video Downloader',
    description: 'Download videos from popular platforms in HD, 4K, and MP3 formats.',
    icon: Video,
    category: ToolCategory.VIDEO,
    path: '/video-downloader'
  },

  // Text & Code
  {
    id: 'markdown-pdf',
    title: 'Markdown to PDF',
    description: 'Convert Markdown (.md) files to formatted PDF or Word documents.',
    icon: FileCode,
    category: ToolCategory.TEXT,
    path: '/document-convert?from=md&to=pdf'
  },
  {
    id: 'summarizer',
    title: 'Text Summarizer',
    description: 'Condense long articles into short, digestible summaries using AI.',
    icon: FileText,
    category: ToolCategory.AI,
    isAiPowered: true,
    path: '/summarizer'
  },
  {
    id: 'word-counter',
    title: 'Word Counter',
    description: 'Count words, characters, and sentences in your text in real-time.',
    icon: Type,
    category: ToolCategory.TEXT,
    path: '/word-counter'
  },

  // Calculators
  {
    id: 'bmi-calc',
    title: 'BMI Calculator',
    description: 'Quickly calculate your Body Mass Index (BMI) to check your health status.',
    icon: Activity,
    category: ToolCategory.CALCULATOR,
    path: '/bmi-calculator'
  },
  {
    id: 'age-calc',
    title: 'Age Calculator',
    description: 'Instantly find your exact age in years, months, and days from your birth date.',
    icon: Calendar,
    category: ToolCategory.CALCULATOR,
    path: '/age-calculator'
  },
  {
    id: 'loan-calc',
    title: 'Loan/EMI Calculator',
    description: 'Easily calculate your monthly loan payments and total interest amount.',
    icon: DollarSign,
    category: ToolCategory.CALCULATOR,
    path: '/loan-calculator'
  },
  {
    id: 'percentage',
    title: 'Percentage Calculator',
    description: 'Quickly calculate percentages for marks, discounts, and financial values.',
    icon: Percent,
    category: ToolCategory.CALCULATOR,
    path: '/percentage-calculator'
  },
];

const ToolsGrid: React.FC = () => {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-24 2xl:py-32">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-6">
          Most Popular Tools
        </h2>
        <p className="text-[#475569] max-w-3xl mx-auto text-xl">
          Explore our most used utilities. From AI-driven analysis to simple conversions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 2xl:gap-10">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid;