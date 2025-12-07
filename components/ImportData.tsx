import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DataService } from '../services/dataService';
import { Topic, TopicStatus, PriorityLevel } from '../types';
import { useNavigate } from 'react-router-dom';

export const ImportData: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const departments = DataService.getDepartments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const processExcel = async () => {
    if (!file) {
      setError('الرجاء اختيار ملف أولاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Assume first sheet contains Topics
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("الملف فارغ");
      }

      // Map Excel columns to Topic interface
      const mappedTopics: Topic[] = jsonData.map((row: any) => {
        // Helper to parse Excel dates
        const parseDate = (val: any) => {
            if (!val) return new Date().toISOString().split('T')[0];
            if (typeof val === 'number') {
                // Excel serial date to JS Date
                const date = new Date(Math.round((val - 25569)*86400*1000));
                return date.toISOString().split('T')[0];
            }
            return val; // Assume string YYYY-MM-DD
        };

        // Get Department Name directly from Excel and resolve it dynamically
        const deptRaw = row['Responsible'] || row['المعني بالتنفيذ'] || row['القسم'] || row['الإدارة'];
        // This will find the existing dept OR create a new one with this exact name
        const deptId = DataService.resolveDepartment(deptRaw);

        return {
          id: row['TopicID'] || row['معرف الموضوع'] || Math.floor(Math.random() * 100000),
          title: row['Title'] || row['المهمة'] || 'بدون عنوان',
          deptId: deptId,
          assignmentDate: parseDate(row['AssignmentDate'] || row['تاريخ التكليف']),
          dueDate: parseDate(row['DueDate'] || row['موعد التسليم']),
          status: (row['Status'] || row['الحالة']) as TopicStatus || TopicStatus.Pending,
          details: row['Details'] || row['التفاصيل'] || '',
          closingDate: (row['ClosingDate'] || row['تاريخ الإغلاق']) ? parseDate(row['ClosingDate'] || row['تاريخ الإغلاق']) : undefined,
          
          // Default fields if not provided
          type: row['Type'] || 'عام', 
          sender: row['Sender'] || 'غير محدد',
          priority: PriorityLevel.Normal,
          lastUpdated: new Date().toISOString().split('T')[0],
          createdBy: 1,
        };
      });

      const count = DataService.importData(mappedTopics);
      setSuccess(`تم استيراد ${mappedTopics.length} سجل بنجاح. إجمالي السجلات: ${count}`);
      setTimeout(() => navigate('/topics'), 2000);
      
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الملف: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2">استيراد البيانات</h2>
        
        {/* Instructions & Dept List */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-6">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-bold mb-2">تعليمات ملف الإكسل (Excel):</p>
                <p className="mb-2">يجب أن يحتوي الملف على الأعمدة التالية (بنفس الترتيب والمسميات الموجودة في جدول عرض المهام):</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono mt-2 mb-4">
             <div className="bg-white p-2 rounded border border-blue-200 text-center">معرف الموضوع</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">المهمة</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center font-bold text-blue-600">المعني بالتنفيذ</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">تاريخ التكليف</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">موعد التسليم</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">الحالة</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">التفاصيل</div>
             <div className="bg-white p-2 rounded border border-blue-200 text-center">تاريخ الإغلاق</div>
          </div>
          
          <div className="bg-white/50 p-3 rounded border border-blue-200/50">
            <p className="font-bold mb-2 text-xs">ملاحظة هامة:</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
               سيقوم النظام بقراءة عمود <strong>"المعني بالتنفيذ"</strong> كما هو مكتوب في ملف الإكسل. إذا كانت الإدارة جديدة (غير موجودة في القائمة أدناه)، سيتم إضافتها للنظام تلقائياً.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] text-slate-500">الإدارات المسجلة حالياً:</span>
                {departments.map(d => (
                    <span key={d.id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 shadow-sm">
                        {d.name}
                    </span>
                ))}
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
          <FileSpreadsheet className="w-12 h-12 text-green-600 mb-4" />
          
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            className="hidden" 
            id="file-upload"
          />
          <label 
            htmlFor="file-upload" 
            className="px-6 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 cursor-pointer hover:bg-slate-50 font-medium"
          >
            {file ? file.name : 'اختر ملف Excel'}
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button 
            onClick={processExcel}
            disabled={!file || loading}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all
              ${!file || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}
            `}
          >
            {loading ? 'جاري المعالجة...' : 'بدء الاستيراد'}
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};