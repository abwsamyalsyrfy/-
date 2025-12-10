
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
      case TopicStatus.Closed: return 'text-green-800 bg-green-100 border-green-300';
      case TopicStatus.Ongoing: return 'text-blue-800 bg-blue-100 border-blue-300';
      case TopicStatus.Pending: return 'text-sky-800 bg-sky-100 border-sky-300';
      case TopicStatus.Phased: return 'text-purple-800 bg-purple-100 border-purple-300';
      case TopicStatus.Postponed: return 'text-orange-800 bg-orange-100 border-orange-300';
      case TopicStatus.Overdue: return 'text-red-800 bg-red-100 border-red-300';
      case TopicStatus.Stalled: return 'text-stone-800 bg-stone-200 border-stone-400';
      case TopicStatus.Cancelled: return 'text-slate-600 bg-slate-200 border-slate-300';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">سجل الأهداف والمواضيع</h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">إدارة ومتابعة كافة المهام الواردة للإدارات</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
                onClick={exportToCSV}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-bold text-sm"
            >
                <Download className="w-4 h-4" />
                <span>تصدير Excel</span>
            </button>
            <button 
                onClick={() => navigate('/topics/new')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm font-bold text-sm"
            >
                <Plus className="w-4 h-4" />
                <span>موضوع جديد</span>
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث في المهمة، التفاصيل، أو المرسل..." 
            className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 md:min-w-[250px]">
            <Filter className="w-5 h-5 text-slate-500" />
            <select 
                className="w-full p-3 border border-slate-300 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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

      {/* Table - Responsive Container */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="min-w-[1000px] md:min-w-full">
            <table className="w-full text-right border-collapse">
            <thead className="bg-slate-100 text-slate-800 text-lg font-extrabold sticky top-0 z-10 shadow-sm border-b-2 border-slate-300">
                <tr>
                <th className="p-4 whitespace-nowrap w-20">#</th>
                <th className="p-4 w-[45%]">المهمة (الموضوع)</th>
                <th className="p-4 whitespace-nowrap">المعني بالتنفيذ</th>
                <th className="p-4 whitespace-nowrap">تاريخ التكليف</th>
                <th className="p-4 whitespace-nowrap">موعد التسليم</th>
                <th className="p-4 whitespace-nowrap">الحالة</th>
                <th className="p-4 whitespace-nowrap">تاريخ الإغلاق</th>
                <th className="p-4"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-lg">
                {filteredTopics.map((topic) => {
                    const deptName = departments.find(d => d.id === topic.deptId)?.name || 'غير محدد';
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = topic.dueDate < today && topic.status !== TopicStatus.Closed && topic.status !== TopicStatus.Cancelled && topic.status !== TopicStatus.Overdue;

                    return (
                        <tr 
                            key={topic.id} 
                            onClick={() => navigate(`/topics/${topic.id}`)}
                            className="hover:bg-blue-50 transition-colors cursor-pointer group odd:bg-white even:bg-slate-50"
                        >
                            <td className="p-4 text-slate-500 font-mono text-base">{topic.id}</td>
                            <td className="p-4 font-bold text-slate-900 text-justify leading-relaxed">
                                {topic.title}
                                <div className="text-sm text-slate-500 font-normal mt-1 truncate max-w-md">{topic.details}</div>
                            </td>
                            <td className="p-4 text-slate-700 font-medium">{deptName}</td>
                            <td className="p-4 text-slate-600 dir-ltr text-right font-mono">{topic.assignmentDate}</td>
                            <td className={`p-4 dir-ltr text-right font-mono font-bold ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                                {topic.dueDate}
                                {isOverdue && <span className="mr-2 text-sm text-red-600 font-bold">(متأخر)</span>}
                            </td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-md text-base border font-bold whitespace-nowrap ${getStatusColor(topic.status)}`}>
                                    {topic.status}
                                </span>
                            </td>
                            <td className="p-4 text-slate-600 dir-ltr text-right font-mono">
                                {topic.closingDate || '-'}
                            </td>
                            <td className="p-4 text-center">
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600" />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
        {filteredTopics.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Search className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-xl font-medium">لا توجد بيانات للعرض</p>
            </div>
        )}
      </div>
    </div>
  );
};
