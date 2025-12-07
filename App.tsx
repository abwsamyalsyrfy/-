
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, Settings, LogOut, Menu, UploadCloud, BookOpen, FileText } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TopicList } from './components/TopicList';
import { TopicDetail } from './components/TopicDetail';
import { NewTopicModal } from './components/NewTopicModal';
import { ImportData } from './components/ImportData';
import { Settings as SettingsPage } from './components/Settings';
import { UserGuide } from './components/UserGuide';
import { DailyReport } from './components/DailyReport';

const SidebarLink = ({ to, icon: Icon, label }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
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
  return (
    <Router>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-l border-slate-200 hidden md:flex flex-col shadow-sm z-10">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">GoalTrack</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <SidebarLink to="/" icon={LayoutDashboard} label="لوحة التحكم" />
            <SidebarLink to="/topics" icon={ListTodo} label="إدارة الأهداف" />
            <SidebarLink to="/topics/new" icon={PlusCircle} label="موضوع جديد" />
            <SidebarLink to="/daily-report" icon={FileText} label="التقرير اليومي" />
            <SidebarLink to="/import" icon={UploadCloud} label="استيراد بيانات" />
            <SidebarLink to="/guide" icon={BookOpen} label="دليل الاستخدام" />
            <SidebarLink to="/settings" icon={Settings} label="الإعدادات والصلاحيات" />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 w-full transition-colors">
              <LogOut className="w-5 h-5" />
              <span>تسجيل خروج</span>
            </button>
            <div className="mt-4 flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    م
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-700">مدير النظام</p>
                    <p className="text-xs text-slate-400">الإدارة العامة</p>
                </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          {/* Mobile Header */}
          <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-20">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">G</span>
                </div>
                <h1 className="font-bold text-slate-800">GoalTrack</h1>
             </div>
             <button className="p-2">
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
