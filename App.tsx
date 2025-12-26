
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import { 
  AppData, 
  TaskStatus, 
  Ticket, 
  TicketType, 
  WorkLog, 
  Asset, 
  LocationCategory,
  ShipInspection,
  InspectionImage
} from './types';
import { storageService } from './services/storageService';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Download,
  Upload,
  RefreshCw,
  Anchor,
  ClipboardList,
  Trash2,
  Edit2,
  X,
  LayoutList,
  AlignJustify,
  LayoutGrid,
  Grid3X3,
  ArrowRight,
  Folder,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Calendar,
  Wrench,
  FileText,
  MapPin,
  Ship,
  Building2,
  Hammer,
  Filter,
  Camera,
  Image as ImageIcon,
  Package,
  EyeOff,
  Maximize2,
  User,
  ShieldCheck,
  Activity,
  Box,
  ExternalLink,
  ChevronRightCircle,
  ShoppingCart,
  Briefcase,
  Store,
  Tag,
  Coins,
  Percent,
  Fuel,
  Home,
  Calculator,
  LayoutDashboard,
  Database,
  Info,
  Archive
} from 'lucide-react';

// --- Types ---
type ViewMode = 'list' | 'compact' | 'grid' | 'gallery';

interface FilterState {
  search: string;
  day: string; // "all" or "01"-"31"
  startMonth: string;
  endMonth: string;
  year: string;
}

const MONTHS = [
  { val: '01', label: 'มกราคม' },
  { val: '02', label: 'กุมภาพันธ์' },
  { val: '03', label: 'มีนาคม' },
  { val: '04', label: 'เมษายน' },
  { val: '05', label: 'พฤษภาคม' },
  { val: '06', label: 'มิถุนายน' },
  { val: '07', label: 'กรกฎาคม' },
  { val: '08', label: 'สิงหาคม' },
  { val: '09', label: 'กันยายน' },
  { val: '10', label: 'ตุลาคม' },
  { val: '11', label: 'พฤศจิกายน' },
  { val: '12', label: 'ธันวาคม' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

const PERMANENT_STAFF_NAME = "มนชัย เจริญอินทร์";

// --- Helpers ---

const isOverdue = (dateStr: string, timeStr?: string): boolean => {
  try {
    const dateTime = timeStr 
      ? new Date(`${dateStr}T${timeStr}`) 
      : new Date(dateStr);
    if (isNaN(dateTime.getTime())) return false;
    const diff = Date.now() - dateTime.getTime();
    return diff > 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const translateInspectionStatus = (status?: string) => {
  switch (status) {
    case 'Normal': return 'ปกติ';
    case 'Broken': return 'ชำรุด';
    case 'Lost': return 'สูญหาย';
    case 'Claiming': return 'ส่งเคลม';
    case 'WaitingPurchase': return 'รอจัดซื้อ';
    default: return 'ไม่ระบุ';
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'Normal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Broken': return 'bg-red-100 text-red-700 border-red-200';
    case 'Lost': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Claiming': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'WaitingPurchase': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};

// --- Components ---

const ImageLightbox: React.FC<{ 
  images: string[]; 
  initialIndex: number; 
  onClose: () => void 
}> = ({ images, initialIndex, onClose }) => {
  const [index, setIndex] = useState(initialIndex);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-[110]"
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-5xl aspect-square sm:aspect-video flex items-center justify-center">
        {images.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute left-0 sm:-left-16 p-4 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={48} />
            </button>
            <button 
              onClick={next}
              className="absolute right-0 sm:-right-16 p-4 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={48} />
            </button>
          </>
        )}

        <img 
          src={images[index]} 
          alt={`View ${index + 1}`} 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-white/60 font-black text-sm uppercase tracking-widest">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

const LongPressDeleteButton: React.FC<{ onDelete: () => void, size?: number }> = ({ onDelete, size = 18 }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressing(true);
    setProgress(0);
    const startTime = Date.now();
    const duration = 2000;
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        onDelete();
        setIsPressing(false);
        setProgress(0);
      }
    }, 50);
  };

  const endPress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsPressing(false);
    setProgress(0);
  };

  return (
    <button 
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={`relative p-2 rounded-xl transition-all ${isPressing ? 'bg-red-50 scale-110 shadow-inner' : 'hover:bg-red-50 text-red-400 hover:text-red-600'}`}
      title="กดค้าง 2 วินาทีเพื่อลบ"
    >
      <Trash2 size={size} className={isPressing ? 'animate-pulse' : ''} />
      {isPressing && (
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="88" strokeDashoffset={88 - (88 * progress) / 100} className="text-red-500" />
        </svg>
      )}
    </button>
  );
};

const LocationIcon: React.FC<{ locationName: string; size?: number; category?: LocationCategory }> = ({ locationName, size = 16, category }) => {
  const name = (locationName || "").toLowerCase();
  
  if (category === LocationCategory.SHIPYARD || name.includes('อู่ซ่อมเรือ') || name.includes('อู่ซ่อม')) {
    return <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] border border-orange-500/20"><Hammer size={size} /></div>;
  }
  if (category === LocationCategory.WAT_RAJSINGKORN || name.includes('ราชสิงขร')) {
    return <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)] border border-red-500/20"><Home size={size} /></div>;
  }
  if (category === LocationCategory.GAS_STATION || name.includes('ปั้มน้ำมัน') || name.includes('ปั๊ม')) {
    return <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-500/20"><Fuel size={size} /></div>;
  }
  if (category === LocationCategory.SHIP || (name.includes('เรือ') && !name.includes('ท่าเรือ'))) {
    return <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-500/20"><Ship size={size} /></div>;
  }
  if (category === LocationCategory.PORT || name.includes('ท่าเรือ')) {
    return <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-100/20"><Anchor size={size} /></div>;
  }
  if (category === LocationCategory.OFFICE || name.includes('สำนักงาน') || name.includes('ออฟฟิศ')) {
    return <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 shadow-[0_0_10px_rgba(71,85,105,0.3)] border border-slate-500/20"><Building2 size={size} /></div>;
  }
  return <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] border border-indigo-500/20"><MapPin size={size} /></div>;
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900 overflow-y-auto">
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto border border-white/20">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

const ViewSwitcher: React.FC<{ activeMode: ViewMode, onChange: (mode: ViewMode) => void }> = ({ activeMode, onChange }) => (
  <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm h-fit">
    {[
      { mode: 'list', icon: LayoutList },
      { mode: 'compact', icon: AlignJustify },
      { mode: 'grid', icon: LayoutGrid },
      { mode: 'gallery', icon: Grid3X3 },
    ].map(({ mode, icon: Icon }) => (
      <button 
        key={mode}
        onClick={() => onChange(mode as ViewMode)}
        className={`p-2 rounded-xl transition-all ${activeMode === mode ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
      >
        <Icon size={18} />
      </button>
    ))}
  </div>
);

const SearchFilterBar: React.FC<{ 
  filters: FilterState, 
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>,
  placeholder?: string,
  showDay?: boolean
}> = ({ filters, setFilters, placeholder, showDay = false }) => (
  <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
    <div className="relative flex-1 w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input 
        type="text" 
        placeholder={placeholder || "ค้นหาข้อมูล..."}
        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm transition-all"
        value={filters.search}
        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
      />
    </div>
    <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm w-full lg:w-auto">
      {showDay && (
        <select 
          className="bg-transparent text-sm font-medium px-3 py-2 focus:outline-none cursor-pointer border border-slate-100 rounded-xl"
          value={filters.day}
          onChange={(e) => setFilters(prev => ({ ...prev, day: e.target.value }))}
        >
          <option value="all">ทุกวัน</option>
          {DAYS.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
        </select>
      )}
      <select 
        className="bg-transparent text-sm font-medium px-3 py-2 focus:outline-none cursor-pointer"
        value={filters.startMonth}
        onChange={(e) => setFilters(prev => ({ ...prev, startMonth: e.target.value }))}
      >
        {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
      </select>
      <ArrowRight size={14} className="text-slate-300" />
      <select 
        className="bg-transparent text-sm font-medium px-3 py-2 focus:outline-none cursor-pointer"
        value={filters.endMonth}
        onChange={(e) => setFilters(prev => ({ ...prev, endMonth: e.target.value }))}
      >
        {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
      </select>
      <select 
        className="bg-transparent text-sm font-medium px-3 py-2 focus:outline-none cursor-pointer"
        value={filters.year}
        onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
      >
        {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y + 543}</option>)}
      </select>
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(storageService.getData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workLogView, setWorkLogView] = useState<ViewMode>('list');
  const [ticketView, setTicketView] = useState<ViewMode>('grid');
  const [assetView, setAssetView] = useState<ViewMode>('list');
  const [inspectionView, setInspectionView] = useState<ViewMode>('grid');

  const currentYear = new Date().getFullYear().toString();
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });
  const [workLogFilters, setWorkLogFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });
  const [repairFilters, setRepairFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });
  const [purchaseFilters, setPurchaseFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });
  const [assetFilters, setAssetFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });
  const [inspectionFilters, setInspectionFilters] = useState<FilterState>({ search: '', day: 'all', startMonth: '01', endMonth: '12', year: currentYear });

  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingInspection, setEditingInspection] = useState<ShipInspection | null>(null);

  // Drill-down State
  const [viewingCategoryDetail, setViewingCategoryDetail] = useState<string | null>(null);

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<{ images: string[], index: number } | null>(null);

  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedAssetNames, setExpandedAssetNames] = useState<Set<string>>(new Set());
  const [expandedInspectionDates, setExpandedInspectionDates] = useState<Set<string>>(new Set());

  const toggleFolder = (date: string) => { setExpandedDates(prev => { const next = new Set(prev); if (next.has(date)) next.delete(date); else next.add(date); return next; }); };
  const toggleAssetFolder = (name: string) => { setExpandedAssetNames(prev => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; }); };
  const toggleInspectionFolder = (date: string) => { setExpandedInspectionDates(prev => { const next = new Set(prev); if (next.has(date)) next.delete(date); else next.add(date); return next; }); };

  useEffect(() => { storageService.saveData(data); }, [data]);

  const filterLogs = (logs: WorkLog[], filters: FilterState) => {
    return logs.filter(log => {
      const logDate = new Date(log.date);
      const logDay = logDate.getDate().toString().padStart(2, '0');
      const logMonth = (logDate.getMonth() + 1).toString().padStart(2, '0');
      const logYear = logDate.getFullYear().toString();
      const inSearch = log.location?.toLowerCase().includes(filters.search.toLowerCase()) || log.taskDescription.toLowerCase().includes(filters.search.toLowerCase());
      const inDay = filters.day === 'all' || logDay === filters.day;
      const inMonthRange = logMonth >= filters.startMonth && logMonth <= filters.endMonth;
      const inYear = logYear === filters.year;
      return inSearch && inDay && inMonthRange && inYear;
    });
  };

  const dashboardFilteredLogs = useMemo(() => filterLogs(data.workLogs, dashboardFilters), [data.workLogs, dashboardFilters]);
  const filteredWorkLogs = useMemo(() => filterLogs(data.workLogs, workLogFilters), [data.workLogs, workLogFilters]);
  const groupedWorkLogs = useMemo(() => {
    const groups: Record<string, WorkLog[]> = {};
    filteredWorkLogs.forEach(log => { if (!groups[log.date]) groups[log.date] = []; groups[log.date].push(log); });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({ date, logs: groups[date] }));
  }, [filteredWorkLogs]);

  const filteredRepairs = useMemo(() => {
    return data.tickets.filter(ticket => {
      if (ticket.type !== TicketType.REPAIR) return false;
      const tDate = new Date(ticket.createdAt);
      const tMonth = (tDate.getMonth() + 1).toString().padStart(2, '0');
      const tYear = tDate.getFullYear().toString();
      const inSearch = ticket.subject.toLowerCase().includes(repairFilters.search.toLowerCase()) || ticket.details.toLowerCase().includes(repairFilters.search.toLowerCase()) || ticket.location.toLowerCase().includes(repairFilters.search.toLowerCase());
      const inMonthRange = tMonth >= repairFilters.startMonth && tMonth <= repairFilters.endMonth;
      const inYear = tYear === repairFilters.year;
      return inSearch && inMonthRange && inYear;
    });
  }, [data.tickets, repairFilters]);

  const filteredPurchases = useMemo(() => {
    return data.tickets.filter(ticket => {
      if (ticket.type !== TicketType.PURCHASE) return false;
      const tDate = new Date(ticket.createdAt);
      const tMonth = (tDate.getMonth() + 1).toString().padStart(2, '0');
      const tYear = tDate.getFullYear().toString();
      const inSearch = ticket.subject.toLowerCase().includes(purchaseFilters.search.toLowerCase()) || ticket.details.toLowerCase().includes(purchaseFilters.search.toLowerCase()) || ticket.location.toLowerCase().includes(purchaseFilters.search.toLowerCase());
      const inMonthRange = tMonth >= purchaseFilters.startMonth && tMonth <= purchaseFilters.endMonth;
      const inYear = tYear === purchaseFilters.year;
      return inSearch && inMonthRange && inYear;
    });
  }, [data.tickets, purchaseFilters]);

  const filteredAssets = useMemo(() => {
    return data.assets.filter(asset => {
      const aDate = new Date(asset.lastChecked);
      const aMonth = (aDate.getMonth() + 1).toString().padStart(2, '0');
      const aYear = aDate.getFullYear().toString();
      const inSearch = (asset.name?.toLowerCase() || '').includes(assetFilters.search.toLowerCase()) || (asset.serialNumber?.toLowerCase() || '').includes(assetFilters.search.toLowerCase()) || (asset.category?.toLowerCase() || '').includes(assetFilters.search.toLowerCase()) || (asset.locationName?.toLowerCase() || '').includes(assetFilters.search.toLowerCase()) || (asset.staffName?.toLowerCase() || '').includes(assetFilters.search.toLowerCase()) || (asset.position?.toLowerCase() || '').includes(assetFilters.search.toLowerCase());
      const inMonthRange = aMonth >= assetFilters.startMonth && aMonth <= assetFilters.endMonth;
      const inYear = aYear === assetFilters.year;
      return inSearch && inMonthRange && inYear;
    });
  }, [data.assets, assetFilters]);

  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    filteredAssets.forEach(asset => { if (!groups[asset.name]) groups[asset.name] = []; groups[asset.name].push(asset); });
    return Object.keys(groups).sort().map(name => ({ name, assets: groups[name], total: groups[name].length, active: groups[name].filter(a => a.status === 'Active').length, maintenance: groups[name].filter(a => a.status === 'Maintenance').length, lost: groups[name].filter(a => a.status === 'Lost').length }));
  }, [filteredAssets]);

  const assetDashboardSummary = useMemo(() => {
    const categories: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const status: Record<string, number> = { Active: 0, Maintenance: 0, Lost: 0, Retired: 0 };

    data.assets.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
      locations[a.locationCategory] = (locations[a.locationCategory] || 0) + 1;
      status[a.status] = (status[a.status] || 0) + 1;
    });

    return { categories, locations, status };
  }, [data.assets]);

  // Drill down calculation for selected category
  const categoryDrillDown = useMemo(() => {
    if (!viewingCategoryDetail) return [];
    const assetsInCategory = data.assets.filter(a => a.category === viewingCategoryDetail);
    
    // Grouping by locationName but also tracking staffName
    const groups: Record<string, { count: number, locCat: LocationCategory, staff: string }> = {};
    assetsInCategory.forEach(a => {
      if (!groups[a.locationName]) {
        groups[a.locationName] = { count: 0, locCat: a.locationCategory, staff: a.staffName };
      }
      groups[a.locationName].count++;
    });
    return Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
  }, [data.assets, viewingCategoryDetail]);

  const filteredInspections = useMemo(() => {
    return data.shipInspections.filter(ins => {
      const iDate = new Date(ins.date);
      const iMonth = (iDate.getMonth() + 1).toString().padStart(2, '0');
      const iYear = iDate.getFullYear().toString();
      const inSearch = ins.shipName.toLowerCase().includes(inspectionFilters.search.toLowerCase()) || ins.inspector.toLowerCase().includes(inspectionFilters.search.toLowerCase());
      const inMonthRange = iMonth >= inspectionFilters.startMonth && iMonth <= inspectionFilters.endMonth;
      const inYear = iYear === inspectionFilters.year;
      return inSearch && inMonthRange && inYear;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [data.shipInspections, inspectionFilters]);

  const groupedInspections = useMemo(() => {
    const groups: Record<string, ShipInspection[]> = {};
    filteredInspections.forEach(ins => { if (!groups[ins.date]) groups[ins.date] = []; groups[ins.date].push(ins); });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({ date, items: groups[date] }));
  }, [filteredInspections]);

  const addWorkLog = (log: Omit<WorkLog, 'id' | 'staffName'>) => { setData(prev => ({ ...prev, workLogs: [{ ...log, staffName: PERMANENT_STAFF_NAME, id: `wl-${Date.now()}` }, ...prev.workLogs] })); setExpandedDates(prev => { const next = new Set(prev); next.add(log.date); return next; }); };
  const updateWorkLog = (updated: WorkLog) => { setData(prev => ({ ...prev, workLogs: prev.workLogs.map(l => l.id === updated.id ? updated : l) })); setEditingWorkLog(null); };
  const updateWorkLogStatus = (id: string, status: TaskStatus) => { setData(prev => ({ ...prev, workLogs: prev.workLogs.map(l => l.id === id ? { ...l, status } : l) })); };
  const deleteWorkLog = (id: string) => { setData(prev => ({ ...prev, workLogs: prev.workLogs.filter(l => l.id !== id) })); };

  const addTicket = (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => { const now = new Date().toISOString(); setData(prev => ({ ...prev, tickets: [{ ...ticket, id: `tk-${Date.now()}`, createdAt: now, updatedAt: now }, ...prev.tickets] })); };
  const updateTicket = (updated: Ticket) => { setData(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : t) })); setEditingTicket(null); };
  const updateTicketStatus = (id: string, status: TaskStatus) => setData(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t) }));
  const deleteTicket = (id: string) => { setData(prev => ({ ...prev, tickets: prev.tickets.filter(t => t.id !== id) })); };

  const addAsset = (asset: Omit<Asset, 'id'>) => setData(prev => ({ ...prev, assets: [{ ...asset, id: `as-${Date.now()}` }, ...prev.assets] }));
  const updateAsset = (updated: Asset) => { setData(prev => ({ ...prev, assets: prev.assets.map(a => a.id === updated.id ? updated : a) })); setEditingAsset(null); };
  const deleteAsset = (id: string) => { setData(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) })); };

  const addInspection = (ins: Omit<ShipInspection, 'id' | 'date' | 'inspector'>) => { const today = new Date().toISOString().split('T')[0]; const newIns: ShipInspection = { ...ins, id: `ins-${Date.now()}`, date: today, inspector: PERMANENT_STAFF_NAME }; setData(prev => ({ ...prev, shipInspections: [newIns, ...prev.shipInspections] })); setExpandedInspectionDates(prev => { const next = new Set(prev); next.add(today); return next; }); };
  const updateInspection = (updated: ShipInspection) => { setData(prev => ({ ...prev, shipInspections: prev.shipInspections.map(i => i.id === updated.id ? updated : i) })); setEditingInspection(null); };
  const deleteInspection = (id: string) => { setData(prev => ({ ...prev, shipInspections: prev.shipInspections.filter(i => i.id !== id) })); };

  const handleExport = () => storageService.exportData(data);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const importedData = await storageService.importData(file); if (importedData) { setData(importedData); alert('เรียกคืนข้อมูลสำเร็จ'); } } };

  const translateStatus = (s: TaskStatus) => { 
    if(s === TaskStatus.PENDING) return 'รอดำเนินการ'; 
    if(s === TaskStatus.WAITING_PURCHASE) return 'รอจัดซื้อ'; 
    if(s === TaskStatus.IN_PROGRESS) return 'กำลังทำ'; 
    if(s === TaskStatus.COMPLETED) return 'เสร็จสิ้น'; 
    return s; 
  };

  const handleSavePDF = (date: string, logs: WorkLog[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const formattedDate = new Date(date).toLocaleDateString('th-TH', { dateStyle: 'long' });
    let content = `<html><head><title>รายงานการปฏิบัติงานวันที่ ${formattedDate}</title><style>body { font-family: 'Inter', sans-serif; padding: 40px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } th { background-color: #f2f2f2; } h1 { color: #1e293b; }</style></head><body><h1>รายงานการปฏิบัติงาน</h1><p><strong>วันที่:</strong> ${formattedDate}</p><p><strong>ผู้บันทึก:</strong> ${PERMANENT_STAFF_NAME}</p><table><thead><tr><th>เวลา</th><th>สถานที่</th><th>รายละเอียดงาน</th><th>สถานะ</th></tr></thead><tbody>${logs.map(log => `<tr><td>${log.time}</td><td>${log.location}</td><td>${log.taskDescription}</td><td>${translateStatus(log.status)}</td></tr>`).join('')}</tbody></table></body></html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleLocationStatClick = (categoryLabel: string) => {
    setAssetFilters(prev => ({ ...prev, search: categoryLabel }));
    setActiveTab('assets');
  };

  const DashboardView: React.FC = () => (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'แจ้งซ่อมที่ยังค้าง', value: data.tickets.filter(t => t.type === TicketType.REPAIR && t.status !== TaskStatus.COMPLETED).length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100/60', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)] border-amber-100', iconGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)] bg-amber-100', targetTab: 'repairs' },
          { label: 'รอจัดซื้ออุปกรณ์', value: data.tickets.filter(t => t.type === TicketType.PURCHASE && t.status === TaskStatus.WAITING_PURCHASE).length, icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-100/60', glow: 'shadow-[0_0_25px_rgba(99,102,241,0.15)] border-indigo-100', iconGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)] bg-indigo-100', targetTab: 'purchases' },
          { label: 'อุปกรณ์ทั้งหมด', value: data.assets.length, icon: Box, color: 'text-blue-500', bg: 'bg-blue-100/60', glow: 'shadow-[0_0_25px_rgba(59,130,246,0.15)] border-blue-100', iconGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)] bg-blue-100', targetTab: 'assets' },
          { label: 'งานที่เสร็จแล้ว', value: data.workLogs.filter(w => w.status === TaskStatus.COMPLETED).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100/60', glow: 'shadow-[0_0_25px_rgba(16,185,129,0.15)] border-emerald-100', iconGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-emerald-100', targetTab: 'worklogs' },
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setActiveTab(stat.targetTab)}
            className={`p-7 rounded-[2.5rem] border bg-white ${stat.glow} flex items-center justify-between transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <div className="z-10">
              <div className={`inline-block px-3 py-1 rounded-full ${stat.bg} mb-3 transition-colors duration-300`}>
                <p className="text-[11px] font-black text-black uppercase tracking-wider">{stat.label}</p>
              </div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-3xl ${stat.iconGlow} ${stat.color} transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 z-10`}>
              <stat.icon size={32} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 p-4 text-slate-100 group-hover:text-blue-500/10 transition-colors pointer-events-none">
               <ChevronRight size={48} strokeWidth={4} />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Operations Log History - Main Column */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-black text-xl flex items-center gap-3 text-slate-800 uppercase tracking-tight">
              <RefreshCw size={22} className="text-blue-500" />ประวัติการปฏิบัติงาน
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">กิจกรรมล่าสุด</span>
            </div>
          </div>
          <div className="px-8 py-6 bg-slate-50/30">
            <SearchFilterBar filters={dashboardFilters} setFilters={setDashboardFilters} placeholder="ค้นหาบันทึกงาน..." showDay={true} />
          </div>
          <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
            {dashboardFilteredLogs.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400"><div className="p-6 rounded-full bg-slate-50 mb-4 opacity-50"><ClipboardList size={64} className="opacity-20"/></div><p className="text-sm font-bold tracking-wide text-slate-500 uppercase">ไม่พบข้อมูลบันทึก</p></div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                  <tr className="text-[10px] uppercase text-slate-500 font-black border-b border-slate-200 tracking-widest">
                    <th className="px-8 py-4 border-r border-slate-200 last:border-r-0">วันที่ / เวลา</th>
                    <th className="px-8 py-4 border-r border-slate-200 last:border-r-0">สถานที่</th>
                    <th className="px-8 py-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardFilteredLogs.slice(0, 10).map(log => {
                    const overdue = log.status === TaskStatus.PENDING && isOverdue(log.date, log.time);
                    return (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-8 py-5 text-xs text-slate-500 border-r border-slate-100 font-bold whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })} <span className="text-blue-600 ml-1">{log.time}</span>
                        </td>
                        <td className="px-8 py-5 border-r border-slate-100">
                          <div className="flex items-center gap-3">
                            <LocationIcon locationName={log.location} size={14} />
                            <span className="text-sm font-black text-slate-800 truncate max-w-[140px]">{log.location}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${log.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {translateStatus(log.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center"><button onClick={() => setActiveTab('worklogs')} className="text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-transparent hover:border-blue-600">ดูทั้งหมด</button></div>
        </div>

        {/* Asset Summary - Sidebar Column */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-8 border-b border-slate-100">
            <h3 className="font-black text-xl flex items-center gap-3 text-slate-800 uppercase tracking-tight">
              <Anchor size={22} className="text-blue-500" />สรุปคลังอุปกรณ์
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">ภาพรวมสถานะปัจจุบัน</p>
          </div>
          
          <div className="p-8 space-y-8 flex-1">
            {/* Status Breakdown */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-blue-500" /> ความสมบูรณ์ของอุปกรณ์
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'ปกติ (Active)', val: assetDashboardSummary.status.Active, color: 'bg-emerald-500' },
                  { label: 'ชำรุด (Repair)', val: assetDashboardSummary.status.Maintenance, color: 'bg-amber-500' },
                  { label: 'สูญหาย (Lost)', val: assetDashboardSummary.status.Lost, color: 'bg-red-500' },
                  { label: 'ยกเลิก (Retired)', val: assetDashboardSummary.status.Retired, color: 'bg-slate-400' },
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                       <div className={`w-2 h-2 rounded-full ${s.color}`} />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{s.label}</span>
                    </div>
                    <span className="text-2xl font-black text-slate-800">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown with Drill-Down Button */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-blue-500" /> หมวดหมู่หลัก (คลิกเพื่อดูแยกตามสถานที่)
              </h4>
              <div className="space-y-3">
                {Object.entries(assetDashboardSummary.categories)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .slice(0, 5)
                  .map(([cat, count], idx) => {
                    const percentage = (Number(count) / (data.assets.length || 1)) * 100;
                    return (
                      <div key={idx} className="group relative">
                        <div className="flex justify-between text-[11px] font-bold mb-1.5">
                          <span className="text-slate-700">{cat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{count} เครื่อง</span>
                            <button 
                              onClick={() => setViewingCategoryDetail(cat)}
                              className="p-1 rounded-md bg-blue-50 text-blue-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                              title="ดูรายละเอียดแยกตามสถานที่"
                            >
                              <ChevronRightCircle size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden cursor-pointer" onClick={() => setViewingCategoryDetail(cat)}>
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Location Category Summary */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-500" /> แยกตามประเภทสถานที่ (คลิกเพื่อดูข้อมูล)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                   { label: 'บนเรือ', icon: Ship, val: assetDashboardSummary.locations[LocationCategory.SHIP] || 0, lightColor: 'bg-blue-50', textColor: 'text-blue-700', shadow: 'shadow-[0_6px_0_#1e40af]' },
                   { label: 'ท่าเรือ', icon: Anchor, val: assetDashboardSummary.locations[LocationCategory.PORT] || 0, lightColor: 'bg-emerald-50', textColor: 'text-emerald-700', shadow: 'shadow-[0_6px_0_#065f46]' },
                   { label: 'สำนักงาน', icon: Building2, val: assetDashboardSummary.locations[LocationCategory.OFFICE] || 0, lightColor: 'bg-indigo-50', textColor: 'text-indigo-700', shadow: 'shadow-[0_6px_0_#3730a3]' },
                   { label: 'อู่เรือ', icon: Hammer, val: assetDashboardSummary.locations[LocationCategory.SHIPYARD] || 0, lightColor: 'bg-orange-50', textColor: 'text-orange-700', shadow: 'shadow-[0_6px_0_#9a3412]' },
                   { label: 'วัดราชสิงขร', icon: Home, val: assetDashboardSummary.locations[LocationCategory.WAT_RAJSINGKORN] || 0, lightColor: 'bg-red-50', textColor: 'text-red-700', shadow: 'shadow-[0_6px_0_#991b1b]' },
                   { label: 'ปั้มน้ำมัน', icon: Fuel, val: assetDashboardSummary.locations[LocationCategory.GAS_STATION] || 0, lightColor: 'bg-yellow-50', textColor: 'text-yellow-700', shadow: 'shadow-[0_6px_0_#854d0e]' },
                ].map((loc, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleLocationStatClick(loc.label)}
                    className={`flex-1 p-4 rounded-[1.5rem] ${loc.lightColor} border border-white flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-1 active:translate-y-1 ${loc.shadow} active:shadow-none group relative overflow-hidden text-center`}
                  >
                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className={`p-2 rounded-xl bg-white shadow-sm ${loc.textColor} relative z-10`}>
                      <loc.icon size={22} strokeWidth={2.5} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${loc.textColor} relative z-10 line-clamp-1`}>{loc.label}</span>
                    <span className={`text-2xl font-black ${loc.textColor} relative z-10`}>{loc.val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center"><button onClick={() => setActiveTab('assets')} className="text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-transparent hover:border-blue-600">จัดการคลังอุปกรณ์</button></div>
        </div>
      </div>
    </div>
  );

  const WorkLogsView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">ประวัติการปฏิบัติงาน (พนักงาน: {PERMANENT_STAFF_NAME})</h3>
          <ViewSwitcher activeMode={workLogView} onChange={setWorkLogView} />
        </div>
        <SearchFilterBar filters={workLogFilters} setFilters={setWorkLogFilters} placeholder="ค้นหาตามสถานที่ หรือรายละเอียดงาน..." showDay={true} />
      </div>

      <div className="space-y-4">
        {groupedWorkLogs.length === 0 ? (<div className="bg-white rounded-3xl border border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400"><ClipboardList size={64} className="opacity-10 mb-4"/><p>ไม่พบข้อมูลที่ค้นหา</p></div>) : (
          groupedWorkLogs.map(group => (
            <div key={group.date} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <div className="flex items-center">
                <button onClick={() => toggleFolder(group.date)} className="flex-1 flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100" data-expanded={expandedDates.has(group.date)}>
                  <div className="flex items-center gap-4"><div className={`p-2 rounded-xl transition-all duration-300 ${expandedDates.has(group.date) ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}><Folder size={20} fill={expandedDates.has(group.date) ? "currentColor" : "none"} /></div><div className="text-left"><h4 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{new Date(group.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</h4><p className="text-xs text-slate-400 font-medium">มีทั้งหมด {group.logs.length} รายการปฏิบัติงาน</p></div></div>
                  <div className="flex items-center gap-4">{expandedDates.has(group.date) ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}</div>
                </button>
                <div className="pr-6"><button onClick={() => handleSavePDF(group.date, group.logs)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors flex items-center gap-2 font-bold text-xs" title="บันทึกเป็น PDF"><FileText size={16} /><span>PDF</span></button></div>
              </div>
              {expandedDates.has(group.date) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  {workLogView === 'grid' || workLogView === 'gallery' ? (
                    <div className={`p-6 grid gap-4 bg-slate-50/50 ${workLogView === 'gallery' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                      {group.logs.map(log => {
                        const overdue = log.status === TaskStatus.PENDING && isOverdue(log.date, log.time);
                        return (
                          <div key={log.id} className={`bg-white p-4 border rounded-2xl group relative hover:border-blue-300 hover:shadow-md transition-all ${overdue ? 'border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-blue-500 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-lg">{log.time}</span><div className="flex flex-col items-end gap-1"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${log.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>{translateStatus(log.status)}</span>{overdue && <span className="text-[8px] font-black text-red-500">ล่าช้าเกิน 24 ชม.</span>}</div></div>
                            <div className="flex items-center gap-3 text-slate-800 font-bold text-sm mb-1"><LocationIcon locationName={log.location} size={14} /><span className="truncate">{log.location}</span></div>
                            <p className="text-xs text-slate-500 line-clamp-2">{log.taskDescription}</p>
                            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t pt-3 border-slate-50">
                              <button onClick={(e) => { e.stopPropagation(); setEditingWorkLog(log); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"><Edit2 size={14}/></button>
                              <LongPressDeleteButton onDelete={() => deleteWorkLog(log.id)} size={14} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50/30 overflow-x-auto"><table className="w-full text-left table-fixed"><thead className="bg-slate-100/50"><tr className="text-[10px] uppercase font-bold text-slate-500"><th className="px-6 py-3 border-r border-slate-300 last:border-r-0 w-20 md:w-24">เวลา</th><th className="px-6 py-3 border-r border-slate-300 last:border-r-0 w-32 md:w-48">สถานที่</th><th className="px-6 py-3 border-r border-slate-300 last:border-r-0 w-48 md:w-64">รายละเอียดงาน</th><th className="px-6 py-3 border-r border-slate-300 last:border-r-0 w-28 md:w-32">สถานะ</th><th className="px-6 py-3 w-20 md:w-24">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">
                      {group.logs.map(log => {
                        const overdue = log.status === TaskStatus.PENDING && isOverdue(log.date, log.time);
                        return (
                          <tr key={log.id} className={`hover:bg-blue-50/20 transition-colors ${workLogView === 'compact' ? 'text-xs' : 'text-sm'}`}><td className={`px-6 ${workLogView === 'compact' ? 'py-2' : 'py-4'} text-blue-500 font-mono font-bold border-r border-slate-300 last:border-r-0`}>{log.time}</td><td className={`px-6 ${workLogView === 'compact' ? 'py-2' : 'py-4'} font-bold text-slate-800 border-r border-slate-300 last:border-r-0`}><div className="flex items-center gap-3 truncate"><LocationIcon locationName={log.location} size={14} /><span className="truncate">{log.location}</span></div></td><td className={`px-6 ${workLogView === 'compact' ? 'py-2' : 'py-4'} text-slate-600 border-r border-slate-300 last:border-r-0`}><div className="truncate" title={log.taskDescription}>{log.taskDescription}</div></td><td className={`px-6 ${workLogView === 'compact' ? 'py-2' : 'py-4'} border-r border-slate-300 last:border-r-0`}><div className="flex flex-col gap-0.5"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] w-fit ${log.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>{translateStatus(log.status)}</span>{overdue && <span className="text-[8px] font-black text-red-500 whitespace-nowrap">ล่าช้าเกิน 24 ชม.</span>}</div></td><td className={`px-6 ${workLogView === 'compact' ? 'py-2' : 'py-4'}`}>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setEditingWorkLog(log); }} className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16}/></button>
                              <LongPressDeleteButton onDelete={() => deleteWorkLog(log.id)} size={16} />
                            </div>
                          </td></tr>
                        );
                      })}
                    </tbody></table></div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8 text-slate-900">
        <h3 className="text-lg font-bold text-slate-800 mb-6">ลงบันทึกงานใหม่</h3>
        <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addWorkLog({ date: f.get('date') as string, time: f.get('time') as string, location: f.get('location') as string, taskDescription: f.get('taskDescription') as string, status: f.get('status') as TaskStatus }); e.currentTarget.reset(); }}>
          <input name="date" type="date" className="p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" defaultValue={new Date().toISOString().split('T')[0]} />
          <input name="time" type="time" className="p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" defaultValue={new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} />
          <input name="location" type="text" placeholder="สถานที่" className="p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" />
          <input name="taskDescription" type="text" placeholder="รายละเอียดงาน" className="p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" />
          <div className="flex gap-2"><select name="status" className="flex-1 p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm"><option value={TaskStatus.PENDING}>รอดำเนินการ</option><option value={TaskStatus.IN_PROGRESS}>กำลังดำเนินการ</option><option value={TaskStatus.COMPLETED}>เสร็จสิ้น</option></select><button type="submit" className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"><Plus size={24}/></button></div>
        </form>
      </div>

      {editingWorkLog && (
        <Modal title="แก้ไขบันทึกงาน" onClose={() => setEditingWorkLog(null)}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); updateWorkLog({ ...editingWorkLog, date: f.get('date') as string, time: f.get('time') as string, location: f.get('location') as string, taskDescription: f.get('taskDescription') as string, status: f.get('status') as TaskStatus }); }}>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs font-bold text-slate-500">วันที่</label><input name="date" type="date" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900" defaultValue={editingWorkLog.date} /></div><div className="space-y-1"><label className="text-xs font-bold text-slate-500">เวลา</label><input name="time" type="time" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-mono" defaultValue={editingWorkLog.time} /></div></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">สถานที่</label><input name="location" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 shadow-sm" defaultValue={editingWorkLog.location} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">รายละเอียดงาน</label><textarea name="taskDescription" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 h-24 shadow-sm" defaultValue={editingWorkLog.taskDescription} /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">สถานะ</label><select name="status" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 shadow-sm" defaultValue={editingWorkLog.status}><option value={TaskStatus.PENDING}>รอดำเนินการ</option><option value={TaskStatus.IN_PROGRESS}>กำลังดำเนินการ</option><option value={TaskStatus.COMPLETED}>เสร็จสิ้น</option></select></div>
            <div className="flex gap-4 pt-4"><button type="button" onClick={() => setEditingWorkLog(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600">ยกเลิก</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold">บันทึก</button></div>
          </form>
        </Modal>
      )}
    </div>
  );

  const InspectionsView = () => {
    const [shipName, setShipName] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [inspectionItems, setInspectionItems] = useState<InspectionImage[]>([
      { id: 'start-1', label: 'กล้องหน้าเรือ', url: null, status: 'Normal', details: '' },
      { id: 'start-2', label: 'แอมป์', url: null, status: 'Normal', details: '' },
      { id: 'start-3', label: 'ลำโพง', url: null, status: 'Normal', details: '' },
      { id: 'start-4', label: 'VIABUS', url: null, status: 'Normal', details: '' },
      { id: 'start-5', label: 'จอแสดงผล', url: null, status: 'Normal', details: '' },
    ]);

    const addDeviceSlot = () => {
      if (!newLabel.trim()) return;
      setInspectionItems(prev => [...prev, { id: `new-slot-${Date.now()}`, label: newLabel, url: null, status: 'Normal', details: '' }]);
      setNewLabel('');
    };

    const removeDeviceSlot = (id: string) => {
      setInspectionItems(prev => prev.filter(item => item.id !== id));
    };

    const updateSlotLabel = (id: string, label: string) => {
      setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, label } : item));
    };

    const updateSlotStatus = (id: string, status: any) => {
      setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const updateSlotDetails = (id: string, details: string) => {
      setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, details } : item));
    };

    const handleFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.match('image/jp.*')) {
          alert('กรุณาอัปโหลดไฟล์นามสกุล .jpg หรือ .jpeg เท่านั้น');
          return;
        }
        const base64 = await fileToBase64(file);
        setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, url: base64 } : item));
      }
    };

    const clearImage = (id: string) => {
      setInspectionItems(prev => prev.map(item => item.id === id ? { ...item, url: null } : item));
    };

    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      addInspection({ shipName: shipName || "ไม่ระบุชื่อเรือ", images: inspectionItems });
      setShipName('');
      setInspectionItems([
        { id: 'start-1', label: 'กล้องหน้าเรือ', url: null, status: 'Normal', details: '' },
        { id: 'start-2', label: 'แอมป์', url: null, status: 'Normal', details: '' },
        { id: 'start-3', label: 'ลำโพง', url: null, status: 'Normal', details: '' },
        { id: 'start-4', label: 'VIABUS', url: null, status: 'Normal', details: '' },
        { id: 'start-5', label: 'จอแสดงผล', url: null, status: 'Normal', details: '' },
      ]);
    };

    return (
      <div className="space-y-8 text-slate-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">ประวัติการตรวจสอบ</h4>
            <ViewSwitcher activeMode={inspectionView} onChange={setInspectionView} />
          </div>
          <SearchFilterBar filters={inspectionFilters} setFilters={setInspectionFilters} placeholder="ค้นหาตามชื่อเรือหรือชื่อผู้ตรวจ..." />
          
          {groupedInspections.length === 0 ? (
            <div className="bg-white py-20 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-slate-300">
              <Camera size={64} className="opacity-20 mb-4" />
              <p className="font-bold text-sm">ไม่พบรายงานการตรวจสอบ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedInspections.map(group => (
                <div key={group.date} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
                  <button 
                    onClick={() => toggleInspectionFolder(group.date)}
                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors border-b border-transparent data-[expanded=true]:border-slate-100"
                    data-expanded={expandedInspectionDates.has(group.date)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-2xl transition-all duration-300 ${expandedInspectionDates.has(group.date) ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        <Folder size={20} fill={expandedInspectionDates.has(group.date) ? "currentColor" : "none"} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(group.date).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">พบข้อมูลการตรวจ {group.items.length} ลำ</p>
                      </div>
                    </div>
                    {expandedInspectionDates.has(group.date) ? <ChevronDown size={22} className="text-slate-400" /> : <ChevronRight size={22} className="text-slate-400" />}
                  </button>
                  
                  {expandedInspectionDates.has(group.date) && (
                    <div className="p-8 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
                      <div className={`grid gap-6 ${inspectionView === 'grid' || inspectionView === 'gallery' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {group.items.map(ins => (
                          <div key={ins.id} className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm group hover:border-red-500 hover:shadow-xl transition-all duration-300">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                              <div>
                                <h5 className="font-black text-slate-900 text-lg group-hover:text-red-600 transition-colors uppercase tracking-tight">{ins.shipName}</h5>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">โดย {ins.inspector}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingInspection(ins)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button>
                                <LongPressDeleteButton onDelete={() => deleteInspection(ins.id)} size={16} />
                              </div>
                            </div>
                            <div className="p-5 bg-slate-50/20 grid grid-cols-2 gap-3">
                              {ins.images.map((img, i) => (
                                <div key={img.id} className="space-y-1">
                                  <div className="aspect-square bg-white border border-slate-100 rounded-2xl overflow-hidden cursor-pointer group/img" onClick={() => img.url && setLightboxData({ images: ins.images.filter(x => x.url).map(x => x.url!), index: i })}>
                                    {img.url ? (
                                      <div className="w-full h-full relative">
                                        <img src={img.url} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 size={18} className="text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <ImageIcon size={20}/>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border ${getStatusColor(img.status)}`}>
                                      {translateInspectionStatus(img.status)}
                                    </span>
                                    <p className="text-[9px] font-black text-slate-500 text-center uppercase tracking-widest truncate w-full mt-1">{img.label}</p>
                                    {img.details && <p className="text-[8px] text-slate-400 text-center line-clamp-2 w-full px-1">{img.details}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-10">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Camera className="text-red-500" />ตรวจอุปกรณ์ในเรือ (ลำใหม่)
          </h3>
          <form className="space-y-8" onSubmit={handleAdd}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">ชื่อเรือ / หมายเลขเรือ</label>
                <input 
                  type="text" 
                  placeholder="ระบุชื่อเรือ..." 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-lg shadow-inner" 
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">เพิ่มรายการอุปกรณ์</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="เช่น กล้องหน้าเรือ, แอมป์..." 
                      className="w-full p-4 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-600 transition-all placeholder:text-slate-300" 
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeviceSlot())}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={addDeviceSlot}
                    className="bg-[#1e293b] text-white px-10 rounded-[1.5rem] font-bold text-sm hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <Plus size={18} strokeWidth={3} /> เพิ่มรายการ
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {inspectionItems.map(item => (
                <div key={item.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-5 space-y-4 hover:border-red-100 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.02)] group relative">
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white p-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none transition-all text-center"
                      value={item.label}
                      onChange={(e) => updateSlotLabel(item.id, e.target.value)}
                      placeholder="ชื่ออุปกรณ์..."
                    />
                    <button 
                      type="button" 
                      onClick={() => removeDeviceSlot(item.id)} 
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="relative">
                    <label className="block w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] overflow-hidden cursor-pointer hover:border-red-400 hover:bg-red-50/20 transition-all relative group/img shadow-sm">
                      {item.url ? (
                        <>
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
                              <Camera size={24} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 group-hover/img:text-red-300 transition-colors">
                          <ImageIcon size={32} strokeWidth={1.5} />
                          <span className="text-[8px] font-black mt-2 uppercase tracking-[0.2em] opacity-40">UPLOAD JPG</span>
                        </div>
                      )}
                      <input type="file" accept="image/jpeg" className="hidden" onChange={(e) => handleFileChange(item.id, e)} />
                    </label>
                    {item.url && (
                      <button 
                        type="button" 
                        onClick={() => clearImage(item.id)} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all z-20 border-2 border-white"
                      >
                        <X size={10} strokeWidth={4} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">สถานะอุปกรณ์</label>
                      <select 
                        className={`w-full p-2.5 rounded-xl text-[10px] font-black border-2 focus:outline-none transition-all ${getStatusColor(item.status)}`}
                        value={item.status}
                        onChange={(e) => updateSlotStatus(item.id, e.target.value as any)}
                      >
                        <option value="Normal">ปกติ (Normal)</option>
                        <option value="Broken">ชำรุด (Broken)</option>
                        <option value="Lost">สูญหาย (Lost)</option>
                        <option value="Claiming">ส่งเคลม (Claiming)</option>
                        <option value="WaitingPurchase">รอจัดซื้อ (Wait)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">รายละเอียด (2 บรรทัด)</label>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all resize-none h-[60px]"
                        placeholder="ระบุรายละเอียดอุปกรณ์..."
                        rows={2}
                        value={item.details}
                        onChange={(e) => updateSlotDetails(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-slate-50 flex justify-end">
              <button 
                type="submit" 
                className="bg-gradient-to-br from-red-600 to-red-500 text-white px-14 py-5 rounded-[1.75rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                บันทึกรายงานการตรวจ
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const UnifiedTicketView = ({ type }: { type: TicketType }) => {
    const filters = type === TicketType.REPAIR ? repairFilters : purchaseFilters;
    const setFilters = type === TicketType.REPAIR ? setRepairFilters : setPurchaseFilters;
    const filteredList = type === TicketType.REPAIR ? filteredRepairs : filteredPurchases;
    const [tempImages, setTempImages] = useState<string[]>([]);
    
    // State for auto-calculation in purchase form
    const [purchaseQty, setPurchaseQty] = useState<number>(0);
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [isVatInclusive, setIsVatInclusive] = useState<boolean>(true);

    const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newImages: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.match('image/jp.*')) {
            const base64 = await fileToBase64(file);
            newImages.push(base64);
          }
        }
        setTempImages(prev => [...prev, ...newImages]);
      }
    };

    const handleRemoveImage = (idx: number) => {
      setTempImages(prev => prev.filter((_, i) => i !== idx));
    };

    const calculationSummary = useMemo(() => {
      const subtotal = purchaseQty * purchasePrice;
      let vat = 0;
      let grandTotal = 0;

      if (isVatInclusive) {
        grandTotal = subtotal;
        vat = subtotal - (subtotal / 1.07);
      } else {
        vat = subtotal * 0.07;
        grandTotal = subtotal + vat;
      }

      return { subtotal, vat, grandTotal };
    }, [purchaseQty, purchasePrice, isVatInclusive]);

    const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      
      addTicket({ 
        type, 
        subject: (f.get('subject') as string) || "ไม่ระบุหัวข้อ", 
        details: (f.get('details') as string) || "-", 
        location: (f.get('location') as string) || "ไม่ระบุสถานที่", 
        status: (f.get('status') as TaskStatus) || (type === TicketType.PURCHASE ? TaskStatus.WAITING_PURCHASE : TaskStatus.PENDING),
        images: tempImages,
        requesterName: (f.get('requesterName') as string) || "ไม่ระบุชื่อ",
        requesterPosition: (f.get('requesterPosition') as string) || "-",
        companyName: type === TicketType.PURCHASE ? (f.get('companyName') as string) : undefined,
        quantity: purchaseQty || undefined,
        price: purchasePrice || undefined,
        isVatInclusive: type === TicketType.PURCHASE ? isVatInclusive : undefined,
        totalPrice: type === TicketType.PURCHASE ? calculationSummary.grandTotal : undefined
      });
      setTempImages([]);
      setPurchaseQty(0);
      setPurchasePrice(0);
      e.currentTarget.reset();
    };

    return (
      <div className="space-y-6 text-slate-900">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {type === TicketType.REPAIR ? 'รายการแจ้งซ่อมอุปกรณ์' : 'รายการขออนุมัติจัดซื้อ'}
            </h3>
            <ViewSwitcher activeMode={ticketView} onChange={setTicketView} />
          </div>
          <SearchFilterBar filters={filters} setFilters={setFilters} placeholder="ค้นหาหัวข้อ หรือสถานที่..." />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {filteredList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              {type === TicketType.REPAIR ? <Wrench size={64} className="opacity-10 mb-4"/> : <ShoppingCart size={64} className="opacity-10 mb-4"/>}
              <p>ไม่พบรายการที่ค้นหา</p>
            </div>
          ) : (
            ticketView === 'grid' || ticketView === 'gallery' ? (
              <div className={`p-8 grid gap-8 ${ticketView === 'gallery' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                {filteredList.map(ticket => {
                  const overdue = ticket.status === TaskStatus.PENDING && isOverdue(ticket.createdAt);
                  return (
                    <div key={ticket.id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300 ${overdue ? 'border-red-200 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-slate-200'}`}>
                      <div className={`h-2 ${ticket.type === TicketType.REPAIR ? 'bg-orange-500' : 'bg-blue-600'}`} />
                      {ticket.images && ticket.images.length > 0 ? (
                        <div className="w-full h-56 overflow-hidden relative border-b border-slate-50 cursor-zoom-in group/img" onClick={() => setLightboxData({ images: ticket.images!, index: 0 })}>
                          <img src={ticket.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white font-black text-sm uppercase tracking-widest">
                               +{ticket.images.length} Photos
                             </div>
                          </div>
                        </div>
                      ) : (<div className="w-full h-56 bg-slate-50 flex items-center justify-center text-slate-200"><ImageIcon size={48} strokeWidth={1} /></div>)}
                      <div className="p-7 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-5">
                          <span className={`text-sm font-black px-4 py-1.5 rounded-full shadow-sm uppercase tracking-tight ${ticket.type === TicketType.REPAIR ? 'bg-orange-100 text-orange-700 shadow-orange-100' : 'bg-blue-100 text-blue-700 shadow-blue-100'}`}>{type === TicketType.REPAIR ? 'แจ้งซ่อม' : 'จัดซื้อ'}</span>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingTicket(ticket)} className="p-2 hover:bg-slate-50 rounded-xl text-blue-500 transition-colors" title="แก้ไขข้อมูล"><Edit2 size={18}/></button>
                            <LongPressDeleteButton onDelete={() => deleteTicket(ticket.id)} size={18} />
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-3 leading-tight uppercase tracking-tight cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setEditingTicket(ticket)}>{ticket.subject}</h4>
                        
                        {ticket.type === TicketType.PURCHASE && (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                             <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100 flex items-center gap-2">
                                <Store size={14} className="text-blue-500 shrink-0" />
                                <span className="text-[10px] font-black text-slate-600 truncate uppercase tracking-tight">{ticket.companyName || "ไม่ระบุร้าน"}</span>
                             </div>
                             <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                <Coins size={14} className="text-emerald-500 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                                    {ticket.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[8px] font-bold text-emerald-500 uppercase">{ticket.isVatInclusive ? 'Inc VAT' : 'Ex VAT'}</span>
                                </div>
                             </div>
                          </div>
                        )}

                        <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-4 font-medium">{ticket.details}</p>
                        
                        {(ticket.requesterName || ticket.requesterPosition) && (
                          <div className="flex flex-col gap-1 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             {ticket.requesterName && <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><User size={12} className="text-blue-500" />{ticket.requesterName}</div>}
                             {ticket.requesterPosition && <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><Briefcase size={12} className="text-slate-300" />{ticket.requesterPosition}</div>}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-6 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 font-bold uppercase tracking-wider"><MapPin size={14} className="text-slate-300"/><span className="truncate">{ticket.location}</span></div>
                        <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                          <select 
                            value={ticket.status} 
                            onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TaskStatus)} 
                            className={`text-xs font-black px-3 py-1.5 border-none rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer ${overdue ? 'bg-red-50 text-red-600 animate-pulse' : (ticket.status === TaskStatus.WAITING_PURCHASE ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700')}`}
                          >
                            {type === TicketType.REPAIR ? (
                              <>
                                <option value={TaskStatus.PENDING}>รอรับเรื่อง</option>
                                <option value={TaskStatus.IN_PROGRESS}>ดำเนินการ</option>
                                <option value={TaskStatus.COMPLETED}>เสร็จสิ้น</option>
                              </>
                            ) : (
                              <>
                                <option value={TaskStatus.WAITING_PURCHASE}>รอจัดซื้อ</option>
                                <option value={TaskStatus.IN_PROGRESS}>สั่งซื้อแล้ว</option>
                                <option value={TaskStatus.COMPLETED}>รับของแล้ว</option>
                              </>
                            )}
                          </select>
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[10px] uppercase font-bold text-slate-500"><th className="px-8 py-4 border-r border-slate-300 last:border-r-0 whitespace-nowrap">หัวข้อ {type === TicketType.PURCHASE && '/ ผู้ขอ'}</th><th className="px-8 py-4 border-r border-slate-300 last:border-r-0">สถานที่</th>{type === TicketType.PURCHASE && <th className="px-8 py-4 border-r border-slate-300 last:border-r-0">ราคารวมสุทธิ</th>}<th className="px-8 py-4 border-r border-slate-300 last:border-r-0 text-center">รูปภาพ</th><th className="px-8 py-4 border-r border-slate-300 last:border-r-0">สถานะ</th><th className="px-8 py-4">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredList.map(ticket => (
                    <tr key={ticket.id} className={`hover:bg-slate-50 transition-colors ${ticketView === 'compact' ? 'text-xs' : 'text-sm'}`}>
                      <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'} border-r border-slate-300 last:border-r-0 truncate max-w-[200px]`}>
                        <div className="font-black text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setEditingTicket(ticket)}>{ticket.subject}</div>
                      </td>
                      <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'} border-r border-slate-300 last:border-r-0 text-slate-500 font-bold`}>{ticket.location}</td>
                      {type === TicketType.PURCHASE && (
                        <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'} border-r border-slate-300 last:border-r-0 font-black text-emerald-600`}>
                          {ticket.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'} border-r border-slate-300 last:border-r-0 text-center`}>{ticket.images && ticket.images.length > 0 ? (<div className="flex items-center justify-center cursor-zoom-in" onClick={() => setLightboxData({ images: ticket.images!, index: 0 })}><div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black">{ticket.images.length}P</div></div>) : <span className="text-slate-300">-</span>}</td>
                      <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'} border-r border-slate-300 last:border-r-0`}>
                        <span className="text-[10px] font-black">{translateStatus(ticket.status)}</span>
                      </td>
                      <td className={`px-8 ${ticketView === 'compact' ? 'py-1' : 'py-5'}`}><div className="flex gap-2"><button onClick={() => setEditingTicket(ticket)} className="text-slate-400 hover:text-blue-600 transition-colors p-1.5"><Edit2 size={16}/></button><LongPressDeleteButton onDelete={() => deleteTicket(ticket.id)} size={16} /></div></td>
                    </tr>
                ))}
              </tbody></table></div>
            )
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mt-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
            {type === TicketType.REPAIR ? <Wrench className="text-orange-500" size={20} /> : <ShoppingCart className="text-blue-600" size={20} />}
            ลงบันทึก{type === TicketType.REPAIR ? 'แจ้งซ่อม' : 'จัดซื้อ'}ใหม่
          </h3>
          <form className="space-y-6" onSubmit={handleCreateTicket}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <input name="subject" type="text" placeholder="หัวข้อการแจ้ง" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" required />
              <input name="location" type="text" placeholder="สถานที่ / เรือลำที่" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" required />
              <select name="status" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
                 <option value={TaskStatus.PENDING}>รอดำเนินการ</option>
                 <option value={TaskStatus.IN_PROGRESS}>กำลังทำ</option>
                 <option value={TaskStatus.WAITING_PURCHASE}>รอจัดซื้อ</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="requesterName" type="text" placeholder="ชื่อผู้แจ้ง" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
              <input name="requesterPosition" type="text" placeholder="ตำแหน่งผู้แจ้ง" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" />
            </div>

            {type === TicketType.PURCHASE && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ร้านค้า / บริษัท</label>
                    <input name="companyName" type="text" placeholder="ชื่อร้านค้า / บริษัท" className="w-full p-4 bg-white border border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">จำนวน</label>
                    <input name="quantity" type="number" placeholder="0" className="w-full p-4 bg-white border border-slate-200 rounded-2xl" onChange={(e) => setPurchaseQty(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ราคาต่อหน่วย</label>
                    <input name="price" type="number" placeholder="0.00" className="w-full p-4 bg-white border border-slate-200 rounded-2xl" onChange={(e) => setPurchasePrice(Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">การคำนวณภาษี (VAT 7%)</label>
                    <div className="flex bg-white p-1 rounded-2xl border border-blue-200 w-fit">
                      <button 
                        type="button" 
                        onClick={() => setIsVatInclusive(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isVatInclusive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-blue-600'}`}
                      >
                        รวม VAT แล้ว
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsVatInclusive(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!isVatInclusive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-blue-600'}`}
                      >
                        แยก VAT ต่างหาก
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ราคารวม (Subtotal)</span>
                      <p className="text-lg font-black text-slate-800">{calculationSummary.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ภาษี (VAT 7%)</span>
                      <p className="text-lg font-black text-blue-600">{calculationSummary.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-1 bg-white p-3 rounded-2xl border border-blue-100">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ยอดสุทธิ (Grand Total)</span>
                      <p className="text-xl font-black text-emerald-600">{calculationSummary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <textarea name="details" placeholder="ระบุรายละเอียดอุปกรณ์ที่ขัดข้อง หรือสาเหตุที่ต้องการแจ้ง..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-32 focus:ring-2 focus:ring-blue-500 outline-none font-medium" required />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} className="text-blue-500" /> อัปโหลดรูปภาพ (.jpg)
                </label>
                <span className="text-[10px] font-black text-slate-300 uppercase">เลือกได้มากกว่า 1 รูป</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm">
                  <Plus size={32} className="text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <span className="text-[9px] font-black text-slate-300 mt-2 uppercase">Add Photos</span>
                  <input type="file" multiple accept="image/jpeg" className="hidden" onChange={handleAddImages} />
                </label>
                {tempImages.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden relative group shadow-md border border-white">
                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white">
                      <X size={12} strokeWidth={4} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-end">
              <button type="submit" className="bg-gradient-to-br from-blue-600 to-blue-500 text-white px-12 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all">
                บันทึก{type === TicketType.REPAIR ? 'แจ้งซ่อม' : 'คำขอจัดซื้อ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AssetsView = () => {
    const glowInputStyle = "p-3 border-2 border-slate-200 rounded-2xl bg-white text-slate-900 shadow-sm transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.4)]";
    const [tempAssetImage, setTempAssetImage] = useState<string | null>(null);

    const assetSummary = useMemo(() => {
      let stock = 0;
      let broken = 0;
      let lost = 0;
      data.assets.forEach(a => {
        if (a.status === 'Active') stock++;
        if (a.status === 'Maintenance') broken++;
        if (a.status === 'Lost') lost++;
      });
      return { stock, broken, lost };
    }, [data.assets]);

    const handleAssetImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.match('image/jp.*')) {
        const base64 = await fileToBase64(file);
        setTempAssetImage(base64);
      }
    };

    return (
      <div className="space-y-6 text-slate-900">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">ทะเบียนคลังอุปกรณ์ไอที</h3>
            <ViewSwitcher activeMode={assetView} onChange={setAssetView} />
          </div>
          
          {/* Global Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">สต็อกพร้อมใช้งาน</p>
                <h4 className="text-3xl font-black text-emerald-700">{assetSummary.stock}</h4>
              </div>
              <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm"><Box size={24}/></div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">อุปกรณ์ที่ชำรุด</p>
                <h4 className="text-3xl font-black text-amber-700">{assetSummary.broken}</h4>
              </div>
              <div className="p-3 bg-white rounded-xl text-amber-500 shadow-sm"><Hammer size={24}/></div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">อุปกรณ์สูญหาย</p>
                <h4 className="text-3xl font-black text-slate-700">{assetSummary.lost}</h4>
              </div>
              <div className="p-3 bg-white rounded-xl text-slate-500 shadow-sm"><EyeOff size={24}/></div>
            </div>
          </div>

          <SearchFilterBar filters={assetFilters} setFilters={setAssetFilters} placeholder="ค้นหาอุปกรณ์ หรือสถานที่..." />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {groupedAssets.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-slate-400"><Anchor size={64} className="opacity-10 mb-4"/><p>ไม่พบอุปกรณ์</p></div>) : (
            <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400"><th className="px-8 py-4">ชื่ออุปกรณ์</th><th className="px-8 py-4 text-center">จำนวน</th><th className="px-8 py-4 text-center">ใช้งาน</th><th className="px-8 py-4 text-center">ชำรุด</th><th className="px-8 py-4 text-center">สำรอง</th><th className="px-8 py-4 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">
                  {groupedAssets.map(group => (
                    <React.Fragment key={group.name}>
                      <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => toggleAssetFolder(group.name)}>
                        <td className="px-8 py-5 border-r border-slate-200 last:border-r-0"><div className="flex items-center gap-4"><div className={`p-2.5 rounded-2xl shadow-sm transition-all duration-300 ${expandedAssetNames.has(group.name) ? 'bg-blue-600 text-white scale-110 shadow-blue-500/30' : 'bg-slate-100 text-slate-400'}`}><Folder size={20} fill={expandedAssetNames.has(group.name) ? 'currentColor' : 'none'} /></div><div className="flex flex-col"><span className="font-black text-slate-800 tracking-tight">{group.name}</span></div></div></td>
                        <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-black">{group.total}</span></td>
                        <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black">{group.active}</span></td>
                        <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-xs font-black">{group.maintenance}</span></td>
                        <td className="px-8 py-5 text-center"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">{group.total - group.active}</span></td>
                        <td className="px-8 py-5 text-right">{expandedAssetNames.has(group.name) ? <ChevronDown size={22} className="text-slate-300" /> : <ChevronRight size={22} className="text-slate-300" />}</td>
                      </tr>
                      {expandedAssetNames.has(group.name) && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {group.assets.map(asset => (
                                <div key={asset.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group flex gap-4">
                                  {asset.imageUrl && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 cursor-zoom-in" onClick={() => setLightboxData({ images: [asset.imageUrl!], index: 0 })}>
                                      <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.name} />
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg truncate">{asset.serialNumber}</span>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingAsset(asset)} className="text-slate-400 hover:text-blue-500"><Edit2 size={12}/></button>
                                        <LongPressDeleteButton onDelete={() => deleteAsset(asset.id)} size={12} />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                      <MapPin size={12} className="text-slate-400"/>
                                      <span className="truncate">{asset.locationName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                      <User size={12} className="text-slate-300"/>
                                      <span className="truncate">{asset.staffName}</span>
                                    </div>
                                    {asset.position && (
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                        <LayoutDashboard size={12} className="text-slate-300"/>
                                        <span className="truncate">{asset.position}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
            </tbody></table></div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mt-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <Plus className="text-blue-600" size={20}/>
            เพิ่มข้อมูลอุปกรณ์ใหม่
          </h3>
          <form className="space-y-6" onSubmit={(e) => { 
            e.preventDefault(); 
            const f = new FormData(e.currentTarget); 
            addAsset({ 
              name: (f.get('name') as string) || "ไม่ระบุชื่อ", 
              serialNumber: (f.get('serial') as string) || "N/A", 
              category: (f.get('category') as string) || "ทั่วไป", 
              locationCategory: f.get('locCat') as LocationCategory, 
              locationName: (f.get('locName') as string) || "ไม่ระบุสถานที่", 
              position: (f.get('position') as string) || "",
              description: (f.get('description') as string) || "",
              staffName: (f.get('staffName') as string) || PERMANENT_STAFF_NAME, 
              status: 'Active', 
              lastChecked: new Date().toISOString().split('T')[0],
              imageUrl: tempAssetImage || undefined
            }); 
            setTempAssetImage(null);
            e.currentTarget.reset(); 
          }}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ชื่ออุปกรณ์</label>
                    <input name="name" type="text" placeholder="ระบุชื่ออุปกรณ์..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">S/N (Serial Number)</label>
                    <input name="serial" type="text" placeholder="ระบุเลขซีเรียล..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">หมวดหมู่</label>
                    <input name="category" type="text" placeholder="เช่น เน็ตเวิร์ค, คอมพิวเตอร์..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ประเภทสถานที่</label>
                    <select name="locCat" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value={LocationCategory.SHIP}>บนเรือ</option>
                      <option value={LocationCategory.OFFICE}>สำนักงาน</option>
                      <option value={LocationCategory.PORT}>ท่าเรือ</option>
                      <option value={LocationCategory.SHIPYARD}>อู่เรือ</option>
                      <option value={LocationCategory.WAT_RAJSINGKORN}>วัดราชสิงขร</option>
                      <option value={LocationCategory.GAS_STATION}>ปั้มน้ำมัน</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ชื่อสถานที่</label>
                    <input name="locName" type="text" placeholder="เช่น เรือด่วนลำที่ 101, ห้องไอที..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ตำแหน่ง (Position)</label>
                    <input name="position" type="text" placeholder="เช่น โต๊ะทำงาน, ชั้นวาง, เสาเรือ..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ชื่อพนักงานที่รับผิดชอบ</label>
                    <input name="staffName" type="text" placeholder="ระบุชื่อพนักงาน..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" defaultValue={PERMANENT_STAFF_NAME} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">รายละเอียดเพิ่มเติม</label>
                    <input name="description" placeholder="ระบุสเปค หรือจุดสังเกต..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">รูปถ่ายอุปกรณ์ (.jpg)</label>
                <label className="block w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all relative group">
                  {tempAssetImage ? (
                    <>
                      <img src={tempAssetImage} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={32} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-[10px] font-black mt-2 uppercase tracking-widest">Upload JPG</span>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg" className="hidden" onChange={handleAssetImageUpload} />
                </label>
                {tempAssetImage && (
                  <button type="button" onClick={() => setTempAssetImage(null)} className="text-[10px] font-black text-red-500 uppercase tracking-widest w-full text-center hover:underline mt-2">ลบรูปภาพ</button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-50">
              <button type="submit" className="bg-gradient-to-br from-blue-600 to-blue-500 text-white px-16 py-4 rounded-[1.75rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all">
                บันทึกอุปกรณ์เข้าคลัง
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="max-w-4xl space-y-10 text-slate-900">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-10">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Database size={24} /></div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">จัดการและสำรองข้อมูล</h3>
            <p className="text-sm text-slate-400 font-medium">Export ข้อมูลเพื่อเก็บรักษา หรือ Import ข้อมูลเก่ากลับเข้าสู่ระบบ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Card */}
          <div className="flex flex-col p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
               <div className="p-4 bg-white rounded-3xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform"><Download size={32} /></div>
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Safe & Secure</span>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">Export JSON (สำรองข้อมูล)</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-8 flex-1 font-medium">
              รวบรวมข้อมูลทั้งหมดในระบบ ทั้งบันทึกงาน, รายการจัดซื้อ, และคลังอุปกรณ์ ออกเป็นไฟล์ไฟล์เดียว (.json) 
              เพื่อให้คุณสามารถนำไปเก็บไว้ในที่ปลอดภัย หรือย้ายไปใช้งานบนเครื่องอื่น
            </p>
            <button 
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all" 
              onClick={handleExport}
            >
              เริ่มสำรองข้อมูล
            </button>
          </div>

          {/* Import Card */}
          <div className="flex flex-col p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-6">
               <div className="p-4 bg-white rounded-3xl shadow-sm text-slate-800 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full">
                  <AlertCircle size={10} />
                  <span className="text-[9px] font-black uppercase tracking-tight">Overwrite Warning</span>
               </div>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2">Import JSON (เรียกคืนข้อมูล)</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-8 flex-1 font-medium">
              เลือกไฟล์สำรองข้อมูล (.json) ที่คุณเคยบันทึกไว้ เพื่อกู้คืนสถานะข้อมูลทั้งหมดกลับมาสู่ระบบ 
              เหมาะสำหรับการย้ายเครื่องหรือการติดตั้งระบบใหม่
            </p>
            
            <div className="space-y-4">
              <label className="block w-full text-center py-4 bg-slate-800 text-white rounded-2xl font-black cursor-pointer uppercase tracking-widest shadow-xl shadow-slate-500/20 hover:scale-105 active:scale-95 transition-all">
                เลือกไฟล์เพื่อเรียกคืน
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
              <div className="flex items-start gap-3 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-700 font-bold leading-normal">
                  <span className="uppercase text-red-800 block mb-1">ข้อควรระวัง:</span>
                  การเรียกคืนข้อมูลจะลบข้อมูลปัจจุบันทั้งหมดและแทนที่ด้วยข้อมูลจากไฟล์สำรอง โปรดแน่ใจว่าได้สำรองข้อมูลปัจจุบันไว้ก่อนดำเนินการ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'worklogs' && <WorkLogsView />}
      {activeTab === 'inspections' && <InspectionsView />}
      {activeTab === 'repairs' && <UnifiedTicketView type={TicketType.REPAIR} />}
      {activeTab === 'purchases' && <UnifiedTicketView type={TicketType.PURCHASE} />}
      {activeTab === 'assets' && <AssetsView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Modal แก้ไข Asset */}
      {editingAsset && (
        <Modal title="แก้ไขข้อมูลอุปกรณ์" onClose={() => setEditingAsset(null)}>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            updateAsset({
              ...editingAsset,
              name: f.get('name') as string,
              serialNumber: f.get('serial') as string,
              category: f.get('category') as string,
              locationName: f.get('locName') as string,
              locationCategory: f.get('locCat') as LocationCategory,
              position: f.get('position') as string,
              description: f.get('description') as string,
              staffName: f.get('staffName') as string,
              status: f.get('status') as any
            });
          }}>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ชื่ออุปกรณ์</label>
              <input name="name" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">S/N</label>
                <input name="serial" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.serialNumber} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">สถานะ</label>
                <select name="status" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-black shadow-sm" defaultValue={editingAsset.status}>
                  <option value="Active">ปกติ (Active)</option>
                  <option value="Maintenance">ชำรุด (Maintenance)</option>
                  <option value="Lost">สูญหาย (Lost)</option>
                  <option value="Retired">ยกเลิกใช้งาน</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">หมวดหมู่</label>
                <input name="category" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.category} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ตำแหน่ง</label>
                <input name="position" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.position} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ชื่อพนักงานที่รับผิดชอบ</label>
                <input name="staffName" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.staffName} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ชื่อสถานที่</label>
                <input name="locName" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.locationName} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">ประเภทสถานที่</label>
              <select name="locCat" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingAsset.locationCategory}>
                <option value={LocationCategory.SHIP}>บนเรือ</option>
                <option value={LocationCategory.OFFICE}>สำนักงาน</option>
                <option value={LocationCategory.PORT}>ท่าเรือ</option>
                <option value={LocationCategory.SHIPYARD}>อู่เรือ</option>
                <option value={LocationCategory.WAT_RAJSINGKORN}>วัดราชสิงขร</option>
                <option value={LocationCategory.GAS_STATION}>ปั้มน้ำมัน</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">รายละเอียด</label>
              <textarea name="description" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 h-24 shadow-sm font-medium" defaultValue={editingAsset.description} />
            </div>
            
            {/* Display/Edit Image in Modal */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">รูปถ่ายอุปกรณ์</label>
              <div className="flex gap-4">
                {editingAsset.imageUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 relative group">
                    <img src={editingAsset.imageUrl} className="w-full h-full object-cover" alt="Asset" />
                    <button type="button" onClick={() => updateAsset({...editingAsset, imageUrl: undefined})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                      <X size={10} strokeWidth={4} />
                    </button>
                  </div>
                )}
                <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all">
                  <Plus size={16} className="text-slate-400" />
                  <input type="file" accept="image/jpeg" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.match('image/jp.*')) {
                      const base64 = await fileToBase64(file);
                      setEditingAsset({...editingAsset, imageUrl: base64});
                    }
                  }} />
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button type="button" onClick={() => setEditingAsset(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase tracking-widest">ยกเลิก</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">บันทึกข้อมูล</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal แก้ไข Ticket (ซ่อม/จัดซื้อ) */}
      {editingTicket && (
        <Modal title={`แก้ไขรายการ${editingTicket.type === TicketType.REPAIR ? 'แจ้งซ่อม' : 'คำขอจัดซื้อ'}`} onClose={() => setEditingTicket(null)}>
          <form className="space-y-4" onSubmit={(e) => { 
            e.preventDefault(); 
            const f = new FormData(e.currentTarget);
            
            let finalPrice = editingTicket.totalPrice;
            if (editingTicket.type === TicketType.PURCHASE) {
              const qty = Number(f.get('quantity'));
              const uprice = Number(f.get('price'));
              const isInc = f.get('vatType') === 'inclusive';
              const base = qty * uprice;
              finalPrice = isInc ? base : base + (base * 0.07);
            }

            updateTicket({
              ...editingTicket,
              subject: f.get('subject') as string,
              details: f.get('details') as string,
              location: f.get('location') as string,
              status: f.get('status') as TaskStatus,
              requesterName: f.get('requesterName') as string,
              requesterPosition: f.get('requesterPosition') as string,
              companyName: editingTicket.type === TicketType.PURCHASE ? (f.get('companyName') as string) : undefined,
              quantity: editingTicket.type === TicketType.PURCHASE ? Number(f.get('quantity')) : undefined,
              price: editingTicket.type === TicketType.PURCHASE ? Number(f.get('price')) : undefined,
              isVatInclusive: editingTicket.type === TicketType.PURCHASE ? f.get('vatType') === 'inclusive' : undefined,
              totalPrice: finalPrice
            });
          }}>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">หัวข้อการแจ้ง</label>
              <input name="subject" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-black shadow-sm" defaultValue={editingTicket.subject} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">สถานที่ / เรือ</label>
                 <input name="location" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingTicket.location} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">สถานะ</label>
                 <select name="status" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-black shadow-sm" defaultValue={editingTicket.status}>
                   <option value={TaskStatus.PENDING}>รอดำเนินการ</option>
                   <option value={TaskStatus.IN_PROGRESS}>กำลังทำ</option>
                   <option value={TaskStatus.WAITING_PURCHASE}>รอจัดซื้อ</option>
                   <option value={TaskStatus.COMPLETED}>เสร็จสิ้น</option>
                 </select>
               </div>
            </div>

            {editingTicket.type === TicketType.PURCHASE && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ร้านค้า / บริษัท</label>
                  <input name="companyName" type="text" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingTicket.companyName} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">จำนวน</label>
                    <input name="quantity" type="number" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingTicket.quantity} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ราคาต่อหน่วย</label>
                    <input name="price" type="number" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingTicket.price} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ประเภทภาษี</label>
                  <select name="vatType" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 font-bold shadow-sm" defaultValue={editingTicket.isVatInclusive ? 'inclusive' : 'exclusive'}>
                    <option value="inclusive">รวม VAT แล้ว</option>
                    <option value="exclusive">แยก VAT 7%</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">รายละเอียด</label>
              <textarea name="details" className="w-full p-3 border border-slate-200 rounded-2xl bg-white text-slate-900 h-32 shadow-sm font-medium" defaultValue={editingTicket.details} />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">จัดการรูปภาพ ({editingTicket.images?.length || 0})</label>
              <div className="grid grid-cols-4 gap-2">
                {editingTicket.images?.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative border border-slate-100 shadow-sm group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => {
                      const newImages = editingTicket.images?.filter((_, idx) => idx !== i);
                      setEditingTicket({...editingTicket, images: newImages});
                    }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} strokeWidth={4} />
                    </button>
                  </div>
                ))}
                <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all">
                   <Plus size={16} className="text-slate-400" />
                   <input type="file" multiple accept="image/jpeg" className="hidden" onChange={async (e) => {
                     const files = e.target.files;
                     if (files) {
                       const newImages = [...(editingTicket.images || [])];
                       for (let i = 0; i < files.length; i++) {
                         if (files[i].type.match('image/jp.*')) {
                           const base64 = await fileToBase64(files[i]);
                           newImages.push(base64);
                         }
                       }
                       setEditingTicket({...editingTicket, images: newImages});
                     }
                   }} />
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50">
              <button type="button" onClick={() => setEditingTicket(null)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase tracking-widest">ยกเลิก</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">บันทึกข้อมูล</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox for viewing images */}
      {lightboxData && (
        <ImageLightbox 
          images={lightboxData.images} 
          initialIndex={lightboxData.index} 
          onClose={() => setLightboxData(null)} 
        />
      )}

      {/* Drill-down Modal for Asset Categories */}
      {viewingCategoryDetail && (
        <Modal title={`รายละเอียด: ${viewingCategoryDetail}`} onClose={() => setViewingCategoryDetail(null)}>
          <div className="space-y-3">
            {categoryDrillDown.map(([location, stats], idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <LocationIcon locationName={location} category={stats.locCat} />
                  <span className="font-black text-slate-800">{location}</span>
                </div>
                <span className="font-black text-blue-600">{stats.count}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default App;
