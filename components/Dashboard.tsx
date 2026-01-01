import React, { useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, FileText, Download, TrendingUp, Activity } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TopicStatus } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const stats = useMemo(() => DataService.getStats(), []);
  const overdueTopics = useMemo(() => DataService.getOverdueTopics(), []);
  const topics = useMemo(() => DataService.getTopics(), []);
  const departments = useMemo(() => DataService.getDepartments(), []);

  const statusCounts = useMemo(() => {
    return topics.reduce((acc, topic) => {
      acc[topic.status] = (acc[topic.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [topics]);

  const pieData = useMemo(() => [
    { name: TopicStatus.Closed, value: statusCounts[TopicStatus.Closed] || 0, color: '#22c55e' },
    { name: TopicStatus.Ongoing, value: statusCounts[TopicStatus.Ongoing] || 0, color: '#3b82f6' },
    { name: TopicStatus.Pending, value: statusCounts[TopicStatus.Pending] || 0, color: '#0ea5e9' },
    { name: TopicStatus.Overdue, value: statusCounts[TopicStatus.Overdue] || 0, color: '#ef4444' },
    { name: TopicStatus.Phased, value: statusCounts[TopicStatus.Phased] || 0, color: '#a855f7' },
    { name: TopicStatus.Postponed, value: statusCounts[TopicStatus.Postponed] || 0, color: '#f97316' },
    { name: TopicStatus.Stalled, value: statusCounts[TopicStatus.Stalled] || 0, color: '#78716c' },
    { name: TopicStatus.Cancelled, value: statusCounts[TopicStatus.Cancelled] || 0, color: '#64748b' },
  ].filter(item => item.value > 0), [statusCounts]);

  const deptPerformance = useMemo(() => departments.map(dept => {
    const deptTopics = topics.filter(t => t.deptId === dept.id);
    const total = deptTopics.length;
    const completed = deptTopics.filter(t => t.status === TopicStatus.Closed).length;
    return {
      name: dept.name,
      total: total,
      completed: completed,
      pending: total - completed
    };
  }).filter(d => d.total > 0), [departments, topics]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`تقرير_الاداء_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('حدث خطأ أثناء تصدير التقرير');
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick, subText }: any) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
           <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
           <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {subText && <p className="text-xs text-slate-400 mt-2">{subText}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">تحليل الأداء والمؤشرات</h2>
          <p className="text-sm text-slate-500">نظرة شاملة على سير العمل في الإدارات</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'جاري التصدير...' : 'تصدير PDF'}</span>
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-6 bg-[#f8fafc] p-1"> 
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="إجمالي المهام" 
            value={stats.total} 
            icon={FileText} 
            color="text-blue-600"
            subText="جميع المهام المسجلة بالنظام"
            onClick={() => navigate('/topics')}
          />
          <StatCard 
            title="نسبة الإنجاز العام" 
            value={`%${completionRate}`} 
            icon={TrendingUp} 
            color="text-green-600" 
            subText={`${stats.completed} مهمة مغلقة من أصل ${stats.total}`}
          />
          <StatCard 
            title="تحتاج متابعة" 
            value={stats.pending} 
            icon={Activity} 
            color="text-yellow-600" 
            subText="مهام جارية، مستمرة أو قيد المتابعة"
            onClick={() => navigate('/topics?filter=pending')}
          />
          <StatCard 
            title="مهام حرجة/متأخرة" 
            value={stats.overdue} 
            icon={AlertCircle} 
            color="text-red-600" 
            subText="تجاوزت موعد التسليم المحدد"
            onClick={() => navigate('/topics?filter=overdue')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">أداء الإدارات (الإجمالي vs المغلقة)</h3>
            <p className="text-xs text-slate-400 mb-6">مقارنة حجم العمل الموكل لكل إدارة وما تم إنجازه منه</p>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar name="إجمالي المهام" dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar name="تم الإنجاز" dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">توزيع حالات المهام</h3>
            <p className="text-xs text-slate-400 mb-6">نظرة عامة على الوضع الحالي</p>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};