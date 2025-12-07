
import React, { useState, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Calendar, Download, Search } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const DailyReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const followups = DataService.getFollowupsByDate(selectedDate);
  const topics = DataService.getTopics();
  const departments = DataService.getDepartments();
  const users = DataService.getUsers();

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`تقرير_يومي_${selectedDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert('فشل تصدير التقرير');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar className="w-5 h-5" />
            </div>
            <div>
                <label className="block text-xs text-slate-500 font-bold mb-1">تاريخ التقرير</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-1 border border-slate-300 rounded text-sm text-slate-700 font-mono"
                />
            </div>
        </div>
        <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
        >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري التحميل...' : 'تصدير PDF'}</span>
        </button>
      </div>

      <div className="bg-slate-200 p-4 md:p-8 rounded-xl overflow-auto shadow-inner">
          <div ref={reportRef} className="bg-white min-h-[297mm] w-[210mm] mx-auto p-[20mm] shadow-2xl text-slate-900 origin-top scale-90 md:scale-100">
              <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                  <div>
                      <h1 className="text-2xl font-extrabold text-slate-800 mb-2">تقرير المتابعة اليومي</h1>
                      <p className="text-sm text-slate-500">نظام GoalTrack لإدارة الأهداف</p>
                  </div>
                  <div className="text-left">
                      <p className="font-mono font-bold text-lg">{selectedDate}</p>
                      <p className="text-xs text-slate-400">تاريخ الإصدار</p>
                  </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8 grid grid-cols-3 gap-4 text-center">
                  <div>
                      <p className="text-xs text-slate-500 mb-1">عدد المتابعات</p>
                      <p className="text-xl font-bold text-blue-600">{followups.length}</p>
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 mb-1">الإدارات المشمولة</p>
                      <p className="text-xl font-bold text-slate-700">
                          {new Set(followups.map(f => {
                              const t = topics.find(topic => topic.id === f.topicId);
                              return t ? t.deptId : 0;
                          })).size}
                      </p>
                  </div>
                  <div>
                      <p className="text-xs text-slate-500 mb-1">تم إغلاقها اليوم</p>
                      <p className="text-xl font-bold text-green-600">
                          {topics.filter(t => t.closingDate === selectedDate).length}
                      </p>
                  </div>
              </div>

              {followups.length > 0 ? (
                  <table className="w-full text-right text-sm border-collapse">
                      <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b-2 border-slate-300">
                              <th className="p-3 font-bold w-1/4">الموضوع / المهمة</th>
                              <th className="p-3 font-bold">الإدارة</th>
                              <th className="p-3 font-bold">التقدم</th>
                              <th className="p-3 font-bold w-1/3">النتيجة والملاحظات</th>
                              <th className="p-3 font-bold">المقيم</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                          {followups.map((f, index) => {
                              const topic = topics.find(t => t.id === f.topicId);
                              const dept = topic ? departments.find(d => d.id === topic.deptId) : null;
                              const evaluator = users.find(u => u.id === f.evaluatorId);
                              
                              return (
                                  <tr key={index} className="break-inside-avoid">
                                      <td className="p-3 align-top">
                                          <p className="font-bold text-slate-800 mb-1">{topic?.title || 'موضوع محذوف'}</p>
                                          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">#{f.topicId}</span>
                                      </td>
                                      <td className="p-3 align-top text-slate-600">
                                          {dept?.name || '-'}
                                      </td>
                                      <td className="p-3 align-top">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              ['ممتاز', 'جيد جدا'].includes(f.progressLevel) ? 'bg-green-100 text-green-700' :
                                              f.progressLevel === 'متأخر' ? 'bg-red-100 text-red-700' :
                                              'bg-blue-50 text-blue-700'
                                          }`}>
                                              {f.progressLevel}
                                          </span>
                                      </td>
                                      <td className="p-3 align-top">
                                          <p className="font-semibold text-slate-800 mb-1">{f.resultText}</p>
                                          <p className="text-slate-500 text-xs italic">{f.notes}</p>
                                      </td>
                                      <td className="p-3 align-top text-slate-600 font-medium">
                                          {evaluator?.name || 'مستخدم'}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">لا توجد متابعات مسجلة في هذا التاريخ</p>
                  </div>
              )}

              <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                  <p>تم استخراج التقرير آلياً من نظام GoalTrack</p>
                  <p>صفحة 1 من 1</p>
              </div>
          </div>
      </div>
    </div>
  );
};
