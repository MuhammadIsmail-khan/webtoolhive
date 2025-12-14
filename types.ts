import { LucideIcon } from 'lucide-react';

export enum ToolCategory {
  PDF = 'PDF Tools',
  AI = 'AI Tools',
  IMAGE = 'Image Tools',
  VIDEO = 'Video Tools',
  TEXT = 'Text Tools',
  CALCULATOR = 'Calculators',
  DOCUMENT = 'Document Tools'
}

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  isNew?: boolean;
  isAiPowered?: boolean;
  path: string;
}

export interface NavItem {
  label: string;
  href: string;
}