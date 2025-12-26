
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
  Home
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
      const inSearch = asset.name?.toLowerCase().includes(assetFilters.search.toLowerCase()) || asset.serialNumber?.toLowerCase().includes(assetFilters.search.toLowerCase()) || asset.category?.toLowerCase().includes(assetFilters.search.toLowerCase()) || asset.locationName?.toLowerCase().includes(assetFilters.search.toLowerCase()) || asset.staffName?.toLowerCase().includes(assetFilters.search.toLowerCase());
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

  // Fix: Explicitly type DashboardView as React.FC to resolve "Type '() => void' is not assignable to type 'FC<{}>'"
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

  // Fix: Implement the return statement for the App component with Layout and tab switching
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab !== 'dashboard' && (
        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-6">
          <div className="p-8 bg-slate-50 rounded-full">
            <Folder size={64} className="opacity-20" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">กำลังพัฒนาระบบส่วนนี้</h3>
            <p className="text-sm font-medium">ส่วน "{activeTab}" กำลังอยู่ในระหว่างการรวบรวมข้อมูลและพัฒนาฟีเจอร์</p>
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
          >
            กลับหน้าแดชบอร์ด
          </button>
        </div>
      )}

      {/* Drill-down Modal for Asset Categories */}
      {viewingCategoryDetail && (
        <Modal title={`รายละเอียดหมวดหมู่: ${viewingCategoryDetail}`} onClose={() => setViewingCategoryDetail(null)}>
          <div className="space-y-3">
            {categoryDrillDown.length > 0 ? (
              categoryDrillDown.map(([location, stats], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <LocationIcon locationName={location} category={stats.locCat} />
                    <div>
                      <p className="text-sm font-black text-slate-800">{location}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ผู้ดูแล: {stats.staff}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-blue-600">{stats.count}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">รายการ</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">ไม่พบข้อมูล</p>
            )}
          </div>
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
    </Layout>
  );
};

// Fix: Added missing default export for App component
export default App;
