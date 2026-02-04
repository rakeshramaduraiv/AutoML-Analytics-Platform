// Centralized icon mapping using react-icons (Lucide icons)
import {
  // Navigation & Core Actions
  Upload, Database, BarChart3, Brain, Target, FileText, Settings,
  // Status & Feedback
  CheckCircle, AlertTriangle, XCircle, Info, Clock, Zap, Loader,
  // Data & Analytics
  TrendingUp, PieChart, Activity, Layers, Search, Filter,
  // System & Controls
  Play, Pause, RotateCcw, Download, Copy, Trash2,
  // UI Elements
  ChevronLeft, ChevronRight, Menu, X, Plus, Minus,
  // Business & Enterprise
  Building2, Shield, Globe, Users, Award, Star,
  // File Types
  File, FileImage, FileSpreadsheet, FileText as FileDoc,
  // Additional Icons
  Lightbulb, Gauge, Timer, Cpu, Wrench, Eye, Edit3,
  Bell, Bot, TreePine, Calculator, Scale, Trophy, Shuffle
} from 'lucide-react';

// Icon mapping based on semantic meaning
export const ICONS = {
  // Navigation & Core Features
  UPLOAD: Upload,
  DATA_INGESTION: Upload,
  DASHBOARD: BarChart3,
  ANALYTICS: BarChart3,
  TRAIN_MODEL: Brain,
  ML_TRAINING: Brain,
  PREDICTION: Target,
  AI_PREDICTION: Target,
  MODELS: Database,
  DATABASE: Database,
  REPORTS: FileText,
  POWERBI: PieChart,
  SETTINGS: Settings,
  TRANSFORM: Shuffle,

  // Status Indicators
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  INFO: Info,
  PENDING: Clock,
  RUNNING: Activity,
  LIVE: Zap,
  LOADING: Loader,

  // Data & Metrics
  TRENDING_UP: TrendingUp,
  CHART: BarChart3,
  PIE_CHART: PieChart,
  ACTIVITY: Activity,
  LAYERS: Layers,
  SEARCH: Search,
  FILTER: Filter,
  GAUGE: Gauge,

  // Actions
  PLAY: Play,
  PAUSE: Pause,
  REFRESH: RotateCcw,
  DOWNLOAD: Download,
  COPY: Copy,
  DELETE: Trash2,
  EDIT: Edit3,
  VIEW: Eye,

  // UI Controls
  CHEVRON_LEFT: ChevronLeft,
  CHEVRON_RIGHT: ChevronRight,
  MENU: Menu,
  CLOSE: X,
  ADD: Plus,
  REMOVE: Minus,

  // Enterprise & Business
  ENTERPRISE: Building2,
  SECURITY: Shield,
  GLOBAL: Globe,
  USERS: Users,
  AWARD: Award,
  STAR: Star,
  BOT: Bot,
  BELL: Bell,

  // File Types
  FILE: File,
  FILE_IMAGE: FileImage,
  FILE_SPREADSHEET: FileSpreadsheet,
  FILE_DOC: FileDoc,

  // Specialized
  LIGHTBULB: Lightbulb,
  TIMER: Timer,
  CPU: Cpu,
  WRENCH: Wrench,
  TREE: TreePine,
  CALCULATOR: Calculator,
  SCALE: Scale,
  TROPHY: Trophy
};

// Icon component wrapper with consistent sizing and styling
export const Icon = ({ 
  name, 
  size = 20, 
  color = 'currentColor', 
  className = '',
  ...props 
}) => {
  const IconComponent = ICONS[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ICONS mapping`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className}
      {...props}
    />
  );
};

// Predefined icon sizes for consistency
export const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 20,
  LARGE: 24,
  XLARGE: 32
};

// Status-specific icon configurations
export const STATUS_ICONS = {
  SUCCESS: { name: 'SUCCESS', color: '#10B981' },
  RUNNING: { name: 'RUNNING', color: '#3B82F6' },
  FAILED: { name: 'ERROR', color: '#EF4444' },
  PENDING: { name: 'PENDING', color: '#F59E0B' },
  COMPLETED: { name: 'SUCCESS', color: '#10B981' }
};

// Navigation menu icon configurations
export const NAV_ICONS = {
  DATA_INGESTION: { name: 'DATA_INGESTION', size: ICON_SIZES.MEDIUM },
  ANALYTICS: { name: 'ANALYTICS', size: ICON_SIZES.MEDIUM },
  ML_TRAINING: { name: 'ML_TRAINING', size: ICON_SIZES.MEDIUM },
  AI_PREDICTION: { name: 'AI_PREDICTION', size: ICON_SIZES.MEDIUM },
  REPORTS: { name: 'REPORTS', size: ICON_SIZES.MEDIUM },
  POWERBI: { name: 'POWERBI', size: ICON_SIZES.MEDIUM }
};