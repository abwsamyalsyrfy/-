
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, Download } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Topic, TopicStatus } from '../types';

export const TopicList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const departments = DataService.getDepartments();

  useEffect(() => {
    setTopics(DataService.getTopics());
    
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter === 'overdue') {
        setTopics(DataService.getOverdueTopics());
        setStatusFilter('overdue_calculated');
    } else if (filter === 'completed') {
        setStatusFilter(TopicStatus.Closed);
    } else if (filter === 'pending') {
        setStatusFilter(TopicStatus.Pending);
    }
  }, [location.search]);

  const filteredTopics = topics.filter(t => {
    const matchesText = t.title.includes(filterText) || t.sender.includes(filterText) || t.details.includes(filterText);
    
    if (statusFilter === 'all') return matchesText;
    
    if (statusFilter === 'overdue_calculated') {
         const today = new Date().toISOString().split('T')[0];
         return matchesText && (t.status === TopicStatus.Overdue || (t.dueDate < today && t.status !== TopicStatus.Closed && t.status !== TopicStatus.Cancelled));
    }

    return matchesText && t.status === statusFilter;
  });

  const getStatusColor = (s: TopicStatus) => {
    switch (s) {
      case TopicStatus.Closed: return 'text-green-600 bg-green-50 border-green-200';
      case TopicStatus.Ongoing: return 'text-blue-600 bg-blue-50 border-blue-200';
      case TopicStatus.Pending: return 'text-sky-600 bg-sky-50 border-sky-200';
      case TopicStatus.Phased: return 'text-purple-600 bg-purple-50 border-purple-200';
      case TopicStatus.Postponed: return 'text-orange-600 bg-orange-50 border-orange-200';
      case TopicStatus.Overdue: return 'text-red-600 bg-red-50 border-red-200';
      case TopicStatus.Stalled: return 'text-stone-600 bg-stone-100 border-stone-300'; // New Color
      case TopicStatus.Cancelled: return 'text-slate-500 bg-slate-50 border-slate-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const exportToCSV = () => {
    const headers = ['معرف الموضوع', 'المهمة', 'المعني بالتنفيذ', 'تاريخ التكليف', 'موعد التسليم', 'الحالة', 'التفاصيل', 'تاريخ الإغلاق'];
    const rows = filteredTopics.map(t => {
        const deptName = departments.find(d => d.id === t.deptId)?.name || '';
        return [
            t.id, 
            t.title, 
            deptName, 
            t.assignmentDate, 
            t.dueDate, 
            t.status, 
            `"${t.details.replace(/"/g, '""')}"`, 
            t.closingDate || ''
        ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "topics_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">سجل الأهداف والمواضيع</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة ومتابعة كافة المهام الواردة للإدارات</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
            </button>
            <button 
                onClick={() => navigate('/topics/new')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                <span>موضوع جديد</span>
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث في المهمة، التفاصيل، أو المرسل..." 
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all">جميع الحالات</option>
                <option value="overdue_calculated">المهام المتأخرة (تنبيه)</option>
                <option value={TopicStatus.Pending}>{TopicStatus.Pending}</option>
                <option value={TopicStatus.Ongoing}>{TopicStatus.Ongoing}</option>
                <option value={TopicStatus.Closed}>{TopicStatus.Closed}</option>
                <option value={TopicStatus.Overdue}>{TopicStatus.Overdue}</option>
                <option value={TopicStatus.Phased}>{TopicStatus.Phased}</option>
                <option value={TopicStatus.Postponed}>{TopicStatus.Postponed}</option>
                <option value={TopicStatus.Stalled}>{TopicStatus.Stalled}</option>
                <option value={TopicStatus.Cancelled}>{TopicStatus.Cancelled}</option>
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-b whitespace-nowrap">معرف الموضوع</th>
              <th className="p-3 border-b min-w-[200px]">المهمة</th>
              <th className="p-3 border-b whitespace-nowrap">المعني بالتنفيذ</th>
              <th className="p-3 border-b whitespace-nowrap">تاريخ التكليف</th>
              <th className="p-3 border-b whitespace-nowrap">موعد التسليم</th>
              <th className="p-3 border-b whitespace-nowrap">الحالة</th>
              <th className="p-3 border-b min-w-[250px]">التفاصيل</th>
              <th className="p-3 border-b whitespace-nowrap">تاريخ الإغلاق</th>
              <th className="p-3 border-b"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredTopics.map((topic) => {
                const deptName = departments.find(d => d.id === topic.deptId)?.name || 'غير محدد';
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = topic.dueDate < today && topic.status !== TopicStatus.Closed && topic.status !== TopicStatus.Cancelled && topic.status !== TopicStatus.Overdue;

                return (
                    <tr 
                        key={topic.id} 
                        onClick={() => navigate(`/topics/${topic.id}`)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                        <td className="p-3 text-slate-500 font-mono">{topic.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{topic.title}</td>
                        <td className="p-3 text-slate-600">{deptName}</td>
                        <td className="p-3 text-slate-600 dir-ltr text-right">{topic.assignmentDate}</td>
                        <td className={`p-3 dir-ltr text-right font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {topic.dueDate}
                            {isOverdue && <span className="mr-2 text-xs text-red-500">!</span>}
                        </td>
                        <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(topic.status)}`}>
                                {topic.status}
                            </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs leading-relaxed max-w-xs">
                           <div className="line-clamp-2" title={topic.details}>
                             {topic.details}
                           </div>
                        </td>
                        <td className="p-3 text-slate-500 dir-ltr text-right">
                            {topic.closingDate || '-'}
                        </td>
                        <td className="p-3 text-center">
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
        {filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p>لا توجد بيانات للعرض</p>
            </div>
        )}
      </div>
    </div>
  );
};
