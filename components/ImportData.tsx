
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
      
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("الملف فارغ");
      }

      const mapStatus = (val: string): TopicStatus => {
          if (!val) return TopicStatus.Pending;
          const v = val.trim();
          if (Object.values(TopicStatus).includes(v as TopicStatus)) return v as TopicStatus;
          
          const lower = v.toLowerCase();
          if (lower === 'closed') return TopicStatus.Closed;
          if (lower === 'pending') return TopicStatus.Pending;
          if (lower === 'ongoing') return TopicStatus.Ongoing;
          if (lower === 'overdue') return TopicStatus.Overdue;
          if (lower === 'cancelled') return TopicStatus.Cancelled;
          if (lower === 'stalled') return TopicStatus.Stalled;
          if (lower === 'postponed') return TopicStatus.Postponed;
          if (lower === 'phased') return TopicStatus.Phased;
          
          return TopicStatus.Pending;
      };

      const mappedTopics: Topic[] = jsonData.map((row: any) => {
        const parseDate = (val: any) => {
            if (!val) return new Date().toISOString().split('T')[0];
            if (typeof val === 'number') {
                const date = new Date(Math.round((val - 25569)*86400*1000));
                return date.toISOString().split('T')[0];
            }
            return val;
        };

        const deptRaw = row['Responsible'] || row['المعني بالتنفيذ'] || row['القسم'] || row['الإدارة'];
        const deptId = DataService.resolveDepartment(deptRaw);

        return {
          id: row['TopicID'] || row['معرف الموضوع'] || Math.floor(Math.random() * 100000),
          title: row['Title'] || row['المهمة'] || 'بدون عنوان',
          deptId: deptId,
          assignmentDate: parseDate(row['AssignmentDate'] || row['تاريخ التكليف']),
          dueDate: parseDate(row['DueDate'] || row['موعد التسليم']),
          status: mapStatus(row['Status'] || row['الحالة']),
          details: row['Details'] || row['التفاصيل'] || '',
          type: 'مستورد',
          priority: PriorityLevel.Normal,
          sender: 'استيراد',
          lastUpdated: new Date().toISOString().split('T')[0],
          createdBy: 1,
          closingDate: parseDate(row['ClosingDate'] || row['تاريخ الإغلاق']) || undefined
        };
      });

      const count = DataService.importData(mappedTopics);
      setSuccess(`تم استيراد ${count} موضوع بنجاح`);
      setTimeout(() => navigate('/topics'), 1500);

    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء معالجة الملف: ' + (err.message || 'تأكد من صيغة الملف'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">استيراد البيانات</h2>
        <p className="text-slate-500 mb-8">قم برفع ملف Excel يحتوي على سجل المهام</p>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 mb-6 hover:bg-slate-50 transition-colors relative">
            <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600 font-medium">
                    {file ? file.name : 'اضغط هنا لاختيار ملف Excel'}
                </span>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
            </div>
        )}

        {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2 mb-4 text-sm">
                <CheckCircle className="w-4 h-4" />
                {success}
            </div>
        )}

        <button 
            onClick={processExcel}
            disabled={!file || loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold shadow-md shadow-blue-200 transition-all"
        >
            {loading ? 'جاري المعالجة...' : 'بدء الاستيراد'}
        </button>

        <div className="mt-8 text-right bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
            <h4 className="font-bold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                تعليمات الملف
            </h4>
            <ul className="list-disc list-inside space-y-1 opacity-80">
                <li>يجب أن يكون الملف بصيغة .xlsx أو .xls</li>
                <li>الصف الأول يجب أن يحتوي على عناوين الأعمدة باللغة العربية أو الإنجليزية</li>
                <li>تأكد من وجود الأعمدة: (TopicID, Title, Status...)</li>
            </ul>
        </div>
      </div>
    </div>
  );
};
