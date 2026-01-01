import React, { useState, useRef, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Download, Calendar, Activity, AlertCircle, Clock, LayoutGrid, ListFilter, FileText, ArrowUpRight, CheckCircle2, Filter } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TopicStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export const PerformanceAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'global' | 'department'>('global');
  
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  
  const generalReportRef = useRef<HTMLDivElement>(null);
  const deptReportRef = useRef<HTMLDivElement>(null);

  const topics = useMemo(() => DataService.getTopics(), []);
  const departments = useMemo(() => DataService.getDepartments(), []);

  // --- Statistics Logic ---
  const analytics = useMemo(() => {
    const filteredTopics = topics.filter(t => 
      t.assignmentDate >= startDate && t.assignmentDate <= endDate
    );

    const deptMetrics = departments.map(dept => {
      const deptTopics = filteredTopics.filter(t => t.deptId === dept.id);
      const total = deptTopics.length;
      
      const closed = deptTopics.filter(t => t.status === TopicStatus.Closed).length;
      const cancelled = deptTopics.filter(t => t.status === TopicStatus.Cancelled).length;
      const stalled = deptTopics.filter(t => t.status === TopicStatus.Stalled || t.status === TopicStatus.Postponed).length;
      
      const overdue = deptTopics.filter(t => 
          t.status === TopicStatus.Overdue || 
          (t.dueDate < new Date().toISOString().split('T')[0] && 
           t.status !== TopicStatus.Closed && 
           t.status !== TopicStatus.Cancelled &&
           t.status !== TopicStatus.Stalled &&
           t.status !== TopicStatus.Postponed
          )
      ).length;

      const active = deptTopics.filter(t => 
          (t.status === TopicStatus.Pending || t.status === TopicStatus.Ongoing || t.status === TopicStatus.Phased) &&
          t.dueDate >= new Date().toISOString().split('T')[0]
      ).length;

      const effectiveTotal = total - cancelled;
      const completionRate = effectiveTotal > 0 ? (closed / effectiveTotal) * 100 : 0;
      
      return {
        id: dept.id,
        name: dept.name,
        total,
        closed,
        active,
        overdue,
        cancelled,
        stalled,
        completionRate: Math.round(completionRate),
      };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    const statusCounts = filteredTopics.reduce((acc, topic) => {
        let key = topic.status;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = [
        { name: 'مغلقة', value: statusCounts[TopicStatus.Closed] || 0, color: '#10b981' },
        { name: 'جارية', value: (statusCounts[TopicStatus.Pending] || 0) + (statusCounts[TopicStatus.Ongoing] || 0) + (statusCounts[TopicStatus.Phased] || 0), color: '#3b82f6' },
        { name: 'متأخرة', value: (statusCounts[TopicStatus.Overdue] || 0) + filteredTopics.filter(t => t.dueDate < new Date().toISOString().split('T')[0] && t.status !== TopicStatus.Closed && t.status !== TopicStatus.Overdue && t.status !== TopicStatus.Cancelled).length, color: '#ef4444' },
        { name: 'أخرى', value: (statusCounts[TopicStatus.Stalled] || 0) + (statusCounts[TopicStatus.Postponed] || 0) + (statusCounts[TopicStatus.Cancelled] || 0), color: '#94a3b8' }
    ].filter(i => i.value > 0);

    const overdueList = topics.filter(t => { 
        if (t.status === TopicStatus.Closed || t.status === TopicStatus.Cancelled || t.status === TopicStatus.Stalled) return false;
        const isOverdue = t.status === TopicStatus.Overdue || t.dueDate < new Date().toISOString().split('T')[0];
        return isOverdue;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { deptMetrics, statusData, overdueList };
  }, [topics, departments, startDate, endDate]);

  const selectedDeptAnalytics = useMemo(() => {
      if (!selectedDeptId) return null;
      
      const deptTopics = topics.filter(t => t.deptId === Number(selectedDeptId));
      const filteredDeptTopics = deptTopics.filter(t => t.assignmentDate >= startDate && t.assignmentDate <= endDate);
      
      const total = filteredDeptTopics.length;
      const closed = filteredDeptTopics.filter(t => t.status === TopicStatus.Closed).length;
      const overdue = filteredDeptTopics.filter(t => t.status === TopicStatus.Overdue || (t.dueDate < new Date().toISOString().split('T')[0] && t.status !== TopicStatus.Closed && t.status !== TopicStatus.Cancelled)).length;
      const active = filteredDeptTopics.filter(t => (t.status === TopicStatus.Pending || t.status === TopicStatus.Ongoing) && t.dueDate >= new Date().toISOString().split('T')[0]).length;
      const others = total - closed - overdue - active;

      const pieData = [
        { name: 'مغلقة', value: closed, color: '#10b981' },
        { name: 'جارية', value: active, color: '#3b82f6' },
        { name: 'متأخرة', value: overdue, color: '#ef4444' },
        { name: 'أخرى', value: others, color: '#cbd5e1' }
      ].filter(d => d.value > 0);

      const topicsWithNotes = filteredDeptTopics.map(t => {
          const followups = DataService.getFollowups(t.id);
          const latestNote = followups.length > 0 ? followups[0].resultText : ''; 
          return { ...t, latestNote };
      });

      return {
          deptName: departments.find(d => d.id === Number(selectedDeptId))?.name,
          topics: topicsWithNotes,
          stats: { total, closed, overdue, active, others },
          pieData
      };
  }, [selectedDeptId, topics, startDate, endDate, departments]);

  const handleExportPDF = async (elementRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!elementRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(elementRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgHeight);
      
      pdf.addImage(imgData, 'PNG', (pdfW - imgW * ratio) / 2, 10, imgW * ratio, imgHeight * ratio);
      pdf.save(`${fileName}_${startDate}.pdf`);
    } catch (e) {
      console.error(e);
      alert('فشل التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-700" />
                    تحليل الأداء المؤسسي
                </h1>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                    <button 
                        onClick={() => setActiveTab('global')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'global' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        التحليل الشامل
                    </button>
                    <button 
                        onClick={() => setActiveTab('department')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'department' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ListFilter className="w-4 h-4" />
                        تحليل إدارة (تفصيلي)
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-300">
                <Calendar className="w-4 h-4 text-slate-600" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-slate-800 font-mono" />
                <span className="text-slate-400 font-bold">←</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium outline-none text-slate-800 font-mono" />
            </div>
        </div>
      </div>

      {/* GLOBAL TAB */}
      {activeTab === 'global' && (
          <div className="space-y-6">
              <div className="flex justify-end">
                  <button 
                    onClick={() => handleExportPDF(generalReportRef, "التقرير_الشامل")} 
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-md font-bold disabled:opacity-50 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير التقرير العام</span>
                  </button>
              </div>

              <div ref={generalReportRef} className="space-y-6 bg-[#f8fafc] p-4 rounded-xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-4">مقارنة أداء الإدارات</h3>
                        <div className="h-[300px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.deptMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} fontWeight={700} stroke="#475569" />
                                    <YAxis fontSize={12} fontWeight={700} stroke="#475569" />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right', fontFamily: 'Tajawal' }} />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar name="الإجمالي" dataKey="total" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar name="منجز" dataKey="closed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar name="متأخر" dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-2">توزيع الحالات</h3>
                        <div className="h-[250px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.statusData.map((entry, index) => (
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

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-lg">جدول الكفاءة والإنجاز</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b-2 border-slate-300">
                                <tr>
                                    <th className="p-3">الإدارة</th>
                                    <th className="p-3 text-center">الإجمالي</th>
                                    <th className="p-3 text-center text-green-700">منجز</th>
                                    <th className="p-3 text-center text-blue-700">جاري</th>
                                    <th className="p-3 text-center text-red-700">متأخر</th>
                                    <th className="p-3 text-center">نسبة الإنجاز</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white font-medium">
                                {analytics.deptMetrics.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-slate-800 font-bold">{dept.name}</td>
                                        <td className="p-3 text-center">{dept.total}</td>
                                        <td className="p-3 text-center text-green-600 bg-green-50/50">{dept.closed}</td>
                                        <td className="p-3 text-center text-blue-600">{dept.active}</td>
                                        <td className="p-3 text-center text-red-600 bg-red-50/50">{dept.overdue}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${dept.completionRate >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                                %{dept.completionRate}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* DEPARTMENT TAB */}
      {activeTab === 'department' && (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="w-full md:w-1/2">
                      <label className="block text-base font-bold text-slate-800 mb-2">اختر الإدارة للتحليل:</label>
                      <select 
                          className="w-full p-3 border-2 border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base font-medium"
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                      >
                          <option value="">-- اختر من القائمة --</option>
                          {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                  </div>
                  
                  {selectedDeptId && (
                      <button 
                        onClick={() => handleExportPDF(deptReportRef, `تقرير_${selectedDeptAnalytics?.deptName}`)}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 font-bold text-sm"
                      >
                          <FileText className="w-5 h-5" />
                          <span>تصدير التقرير التفصيلي (PDF)</span>
                      </button>
                  )}
              </div>

              {!selectedDeptId && (
                  <div className="text-center py-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                      <Filter className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 text-xl font-medium">يرجى اختيار إدارة لعرض التحليل الخاص بها</p>
                  </div>
              )}

              {selectedDeptId && selectedDeptAnalytics && (
                  <div ref={deptReportRef} className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-lg space-y-8">
                      <div className="border-b-2 border-slate-100 pb-6 flex justify-between items-start">
                          <div>
                              <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedDeptAnalytics.deptName}</h2>
                              <p className="text-slate-500 text-sm">تقرير تفصيلي للفترة من <span className="font-mono font-bold text-slate-700">{startDate}</span> إلى <span className="font-mono font-bold text-slate-700">{endDate}</span></p>
                          </div>
                          <div className="text-center bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-200">
                              <p className="text-xs text-indigo-700 font-bold mb-1 uppercase tracking-wider">نسبة الإنجاز</p>
                              <p className="text-3xl font-black text-indigo-800">
                                  {selectedDeptAnalytics.stats.total > 0 
                                      ? Math.round((selectedDeptAnalytics.stats.closed / selectedDeptAnalytics.stats.total) * 100) 
                                      : 0}%
                              </p>
                          </div>
                      </div>

                      {/* Charts & KPI */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className="md:col-span-2 grid grid-cols-4 gap-3">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                    <p className="text-slate-600 font-bold mb-1 text-xs">الإجمالي</p>
                                    <p className="text-2xl font-black text-slate-800">{selectedDeptAnalytics.stats.total}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200 text-center">
                                    <p className="text-green-700 font-bold mb-1 text-xs">منجز</p>
                                    <p className="text-2xl font-black text-green-800">{selectedDeptAnalytics.stats.closed}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                                    <p className="text-red-700 font-bold mb-1 text-xs">متأخر</p>
                                    <p className="text-2xl font-black text-red-800">{selectedDeptAnalytics.stats.overdue}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                                    <p className="text-blue-700 font-bold mb-1 text-xs">جاري</p>
                                    <p className="text-2xl font-black text-blue-800">{selectedDeptAnalytics.stats.active}</p>
                                </div>
                          </div>
                          <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie data={selectedDeptAnalytics.pieData} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                          {selectedDeptAnalytics.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                      </Pie>
                                      <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '10px'}}/>
                                      <Tooltip />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                      </div>

                      {/* Detailed Table */}
                      <div>
                          <h4 className="text-lg font-bold text-slate-900 mb-4 border-r-4 border-indigo-600 pr-3">جدول المهام التفصيلي</h4>
                          <div className="border border-slate-300 rounded-lg overflow-hidden">
                              <table className="w-full text-right text-sm border-collapse">
                                  <thead className="bg-slate-800 text-white font-bold">
                                      <tr>
                                          <th className="p-3 border-b border-slate-700 text-center w-12">#</th>
                                          <th className="p-3 border-b border-slate-700 w-[45%] text-right">المهمة</th>
                                          <th className="p-3 border-b border-slate-700 whitespace-nowrap w-24">التكليف</th>
                                          <th className="p-3 border-b border-slate-700 whitespace-nowrap w-24">التسليم</th>
                                          <th className="p-3 border-b border-slate-700 whitespace-nowrap w-20">الحالة</th>
                                          <th className="p-3 border-b border-slate-700">التفاصيل</th>
                                          <th className="p-3 border-b border-slate-700">الملاحظات</th>
                                      </tr>
                                  </thead>
                                  <tbody className="bg-white text-slate-800">
                                      {selectedDeptAnalytics.topics.map((t, idx) => (
                                          <tr key={t.id} className="border-b border-slate-200 hover:bg-indigo-50/30 transition-colors">
                                              <td className="p-2 text-center font-mono text-slate-500 font-bold border-l border-slate-200">{idx + 1}</td>
                                              <td className="p-2 font-bold text-justify leading-relaxed">{t.title}</td>
                                              <td className="p-2 font-mono text-slate-600 dir-ltr text-right text-xs">{t.assignmentDate}</td>
                                              <td className={`p-2 font-mono dir-ltr text-right text-xs ${t.status === TopicStatus.Overdue ? 'text-red-700 font-bold' : 'text-slate-600'}`}>{t.dueDate}</td>
                                              <td className="p-2">
                                                  <span className={`px-2 py-0.5 rounded text-xs border font-bold whitespace-nowrap`}>{t.status}</span>
                                              </td>
                                              <td className="p-2 text-xs leading-relaxed text-slate-600 max-w-xs">{t.details}</td>
                                              <td className="p-2 text-xs text-slate-500 italic">{t.latestNote || '-'}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              {selectedDeptAnalytics.topics.length === 0 && (
                                  <div className="p-8 text-center text-slate-400 text-lg">لا توجد مهام مسجلة لهذه الفترة</div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- URGENT SECTION (BOTTOM - Outside Print Refs) --- */}
      <div className="bg-red-50 rounded-xl border-2 border-red-200 overflow-hidden shadow-md mt-12">
          <div className="p-6 border-b border-red-200 flex justify-between items-center bg-red-100/50">
              <div>
                  <h3 className="font-extrabold text-red-900 text-xl flex items-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      المواضيع المتأخرة (تحتاج متابعة فورية)
                  </h3>
                  <p className="text-red-700 text-sm mt-1 font-medium">قائمة بجميع المهام التي تجاوزت موعد التسليم ولم تغلق بعد</p>
              </div>
              <span className="bg-white text-red-700 px-4 py-1 rounded-full text-base font-black shadow-sm border border-red-100">
                  {analytics.overdueList.length} مهمة
              </span>
          </div>
          
          <div className="p-6">
              {analytics.overdueList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {analytics.overdueList.map(topic => (
                          <div key={topic.id} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-mono text-slate-400 font-bold">#{topic.id}</span>
                                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-800 rounded border border-red-200 font-bold">
                                          {topic.priority}
                                      </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-base mb-2 line-clamp-2 leading-snug" title={topic.title}>{topic.title}</h4>
                                  <div className="space-y-1 text-xs text-slate-600 mb-4 font-medium">
                                      <p className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-red-500" />
                                          تاريخ التسليم: <span className="font-bold text-red-700 dir-ltr font-mono">{topic.dueDate}</span>
                                      </p>
                                      <p>المعني بالتنفيذ: {departments.find(d => d.id === topic.deptId)?.name}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => navigate(`/topics/${topic.id}`)}
                                  className="w-full py-2 flex items-center justify-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-bold text-sm"
                              >
                                  تسجيل متابعة الآن
                                  <ArrowUpRight className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 text-slate-400">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-500 opacity-30" />
                      <p className="text-xl font-bold text-green-700">رائع! لا توجد مواضيع متأخرة حالياً</p>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};