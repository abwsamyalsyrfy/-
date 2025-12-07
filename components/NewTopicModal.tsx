
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { PriorityLevel, TopicStatus, Topic } from '../types';
import { X, Save } from 'lucide-react';

export const NewTopicModal: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const departments = DataService.getDepartments();

  const [formData, setFormData] = useState<Partial<Topic>>({
    title: '',
    type: 'مشروع',
    sender: '',
    deptId: 1,
    priority: PriorityLevel.Normal,
    dueDate: '',
    details: '',
    status: TopicStatus.Pending,
    assignmentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isEditMode && id) {
        const topic = DataService.getTopicById(Number(id));
        if (topic) {
            setFormData(topic);
        } else {
            navigate('/topics');
        }
    }
  }, [id, isEditMode, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && id) {
        const updates = { ...formData };
        if (updates.status === TopicStatus.Closed && !updates.closingDate) {
            updates.closingDate = new Date().toISOString().split('T')[0];
        } else if (updates.status !== TopicStatus.Closed) {
            updates.closingDate = undefined;
        }
        
        DataService.updateTopic(Number(id), updates);
    } else {
        DataService.addTopic({
            ...(formData as any),
            status: TopicStatus.Pending,
            createdBy: DataService.getCurrentUser().id
        });
    }
    navigate('/topics');
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">
                {isEditMode ? 'تعديل المهمة / الموضوع' : 'إضافة مهمة جديدة'}
            </h2>
            <button onClick={() => navigate('/topics')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">المهمة (العنوان)</label>
                    <input 
                        name="title" 
                        required 
                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="أدخل عنواناً واضحاً للمهمة..."
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المعني بالتنفيذ (الإدارة)</label>
                    <select name="deptId" className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.deptId} onChange={handleChange}>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ التكليف</label>
                    <input type="date" name="assignmentDate" required className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.assignmentDate} onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نوع الموضوع</label>
                    <select name="type" className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.type} onChange={handleChange}>
                        <option>مشروع</option>
                        <option>مهمة</option>
                        <option>بلاغ</option>
                        <option>اقتراح</option>
                        <option>شكوى</option>
                        <option>طلب شراء</option>
                        <option>تقرير</option>
                        <option>صيانة</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
                    <select name="priority" className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.priority} onChange={handleChange}>
                        <option value={PriorityLevel.Low}>{PriorityLevel.Low}</option>
                        <option value={PriorityLevel.Normal}>{PriorityLevel.Normal}</option>
                        <option value={PriorityLevel.High}>{PriorityLevel.High}</option>
                        <option value={PriorityLevel.Urgent}>{PriorityLevel.Urgent}</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المرسل / الجهة الطالبة</label>
                    <input name="sender" className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.sender} onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">موعد التسليم</label>
                    <input type="date" name="dueDate" required className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.dueDate} onChange={handleChange} />
                </div>

                {isEditMode && (
                    <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                        <select name="status" className="w-full p-2.5 border border-slate-200 rounded-lg" value={formData.status} onChange={handleChange}>
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
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الإغلاق</label>
                         <input type="date" name="closingDate" className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" value={formData.closingDate || ''} readOnly={true} title="يتم تحديده تلقائياً عند الإنجاز" />
                    </div>
                    </>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التفاصيل</label>
                <textarea 
                    name="details" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg h-32 resize-none" 
                    placeholder="شرح كامل للمهمة..."
                    value={formData.details}
                    onChange={handleChange}
                ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" onClick={() => navigate('/topics')} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                    إلغاء
                </button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200">
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'حفظ التعديلات' : 'حفظ الموضوع'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
