
import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  Settings, 
  Anchor,
  Camera,
  ShoppingCart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    { id: 'worklogs', icon: ClipboardList, label: 'บันทึกงานรายวัน' },
    { id: 'inspections', icon: Camera, label: 'ตรวจอุปกรณ์ในเรือ' },
    { id: 'repairs', icon: Wrench, label: 'แจ้งซ่อมอุปกรณ์' },
    { id: 'purchases', icon: ShoppingCart, label: 'ขออนุมัติจัดซื้อ' },
    { id: 'assets', icon: Anchor, label: 'คลังอุปกรณ์ (Asset)' },
    { id: 'settings', icon: Settings, label: 'สำรองและเรียกคืน' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar - White to Light Red Gradient Theme */}
      <aside className="w-72 bg-white border-r border-red-100 flex flex-col hidden md:flex shadow-xl shadow-red-900/5">
        <div className="p-8 border-b border-red-50 flex flex-col gap-1 bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Anchor size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-red-600 leading-tight">
              เรือด่วนเจ้าพระยา<br/><span className="text-slate-800 text-sm">จำกัด</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-xl shadow-red-500/40 font-bold scale-[1.02]' 
                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-8 border-t border-red-50 text-[10px] text-slate-400 font-bold text-center uppercase tracking-[0.2em]">
          IT Department v1.0.8
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-red-50 flex items-center justify-between px-10 shadow-sm z-10">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-6">
             <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-[0_0_10px_rgba(0,0,0,0.02)]">
               {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
             </div>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-400 p-0.5 shadow-lg shadow-red-500/20 overflow-hidden">
               <img src="https://picsum.photos/48" alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gradient-to-br from-white via-slate-50 to-red-50/20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
