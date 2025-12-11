import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, Settings, LogOut, Menu, UploadCloud, BookOpen, FileText, BarChart2, X, User as UserIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TopicList } from './components/TopicList';
import { TopicDetail } from './components/TopicDetail';
import { NewTopicModal } from './components/NewTopicModal';
import { ImportData } from './components/ImportData';
import { Settings as SettingsPage } from './components/Settings';
import { UserGuide } from './components/UserGuide';
import { DailyReport } from './components/DailyReport';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { Login } from './components/Login';
import { DataService } from './services/dataService';
import { User } from './types';

const SidebarLink = ({ to, icon: Icon, label, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default function App() {
  // Initialize state directly from DataService to avoid login flash on refresh
  const [user, setUser] = useState<User | null>(() => {
    return DataService.isAuthenticated() ? DataService.getCurrentUser() : null;
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    setUser(DataService.getCurrentUser());
  };

  const handleLogout = () => {
    DataService.logout();
    setUser(null);
  };

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const deptName = DataService.getDepartments().find(d => d.id === user.deptId)?.name || 'غير محدد';

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">GoalTrack</h1>
        </div>
        <button onClick={closeMenu} className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarLink to="/" icon={LayoutDashboard} label="لوحة التحكم" onClick={closeMenu} />
        <SidebarLink to="/topics" icon={ListTodo} label="إدارة الأهداف" onClick={closeMenu} />
        <SidebarLink to="/topics/new" icon={PlusCircle} label="موضوع جديد" onClick={closeMenu} />
        <SidebarLink to="/analysis" icon={BarChart2} label="تحليل الأداء" onClick={closeMenu} />
        <SidebarLink to="/daily-report" icon={FileText} label="التقرير اليومي" onClick={closeMenu} />
        <SidebarLink to="/import" icon={UploadCloud} label="استيراد بيانات" onClick={closeMenu} />
        <SidebarLink to="/guide" icon={BookOpen} label="دليل الاستخدام" onClick={closeMenu} />
        <SidebarLink to="/settings" icon={Settings} label="الإعدادات والصلاحيات" onClick={closeMenu} />
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 w-full transition-colors rounded-lg hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span>تسجيل خروج</span>
        </button>
        <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-700 truncate" title={user.name}>{user.name}</p>
                <p className="text-xs text-slate-500 truncate" title={deptName}>{deptName}</p>
            </div>
        </div>
      </div>
    </>
  );

  return (
    <Router>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
        
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-l border-slate-200 hidden md:flex flex-col shadow-sm z-30">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay & Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={closeMenu}
            ></div>
            
            {/* Drawer Panel */}
            <aside className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative w-full">
          {/* Mobile Header */}
          <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-20 border-b border-slate-200">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">G</span>
                </div>
                <h1 className="font-bold text-slate-800">GoalTrack</h1>
             </div>
             <button onClick={toggleMenu} className="p-2 active:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6 text-slate-600" />
             </button>
          </div>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/topics" element={<TopicList />} />
              <Route path="/topics/new" element={<NewTopicModal />} />
              <Route path="/topics/edit/:id" element={<NewTopicModal />} />
              <Route path="/topics/:id" element={<TopicDetail />} />
              <Route path="/analysis" element={<PerformanceAnalysis />} />
              <Route path="/daily-report" element={<DailyReport />} />
              <Route path="/import" element={<ImportData />} />
              <Route path="/guide" element={<UserGuide />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}