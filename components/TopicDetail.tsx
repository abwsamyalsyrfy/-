
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Tag, Building2, Send, Paperclip, Edit, Trash2, CalendarCheck, CalendarDays, CheckCircle, Bell } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Topic, Followup, TopicStatus } from '../types';
import { TelegramService } from '../services/telegramService';

export const TopicDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | undefined>(undefined);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'followups' | 'attachments'>('details');
  const departments = DataService.getDepartments();

  const [newNote, setNewNote] = useState('');
  const [newResult, setNewResult] = useState('');
  const [progressLevel, setProgressLevel] = useState('جيد');
  const [sendingTelegram, setSendingTelegram] = useState(false);

  useEffect(() => {
    if (id) {
      const t = DataService.getTopicById(Number(id));
      if (t) {
        setTopic(t);
        setFollowups(DataService.getFollowups(t.id));
      } else {
        navigate('/topics');
      }
    }
  }, [id, navigate]);

  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    DataService.addFollowup({
        topicId: topic.id,
        date: new Date().toISOString().split('T')[0],
        type: 'متابعة دورية',
        notes: newNote,
        progressLevel,
        evaluatorId: DataService.getCurrentUser().id,
        resultText: newResult
    });

    setFollowups(DataService.getFollowups(topic.id));
    const updatedTopic = DataService.getTopicById(topic.id);
    if(updatedTopic) setTopic({...updatedTopic});

    setNewNote('');
    setNewResult('');
    setActiveTab('followups');
  };

  const handleDelete = () => {
      if (window.confirm('هل أنت متأكد من حذف هذا الموضوع؟ لا يمكن التراجع عن هذا الإجراء.')) {
          if (topic) {
              DataService.deleteTopic(topic.id);
              navigate('/topics');
          }
      }
  };

  const handleSendReminder = async () => {
      if(!topic) return;
      if(!window.confirm('إرسال تذكير عبر تيليجرام للإدارة المعنية؟')) return;
      
      setSendingTelegram(true);
      const success = await TelegramService.sendTaskNotification(topic, 'reminder');
      setSendingTelegram(false);
      
      if(success) alert('تم إرسال التذكير بنجاح');
      else alert('فشل الإرسال. تأكد من إعدادات تيليجرام.');
  };

  const getStatusColorClass = (s: TopicStatus) => {
     switch (s) {
       case TopicStatus.Closed: return 'bg-green-100 text-green-700';
       case TopicStatus.Overdue: return 'bg-red-100 text-red-700';
       case TopicStatus.Ongoing: return 'bg-blue-100 text-blue-700';
       case TopicStatus.Pending: return 'bg-sky-100 text-sky-700';
       case TopicStatus.Cancelled: return 'bg-slate-100 text-slate-700';
       case TopicStatus.Phased: return 'bg-purple-100 text-purple-700';
       case TopicStatus.Postponed: return 'bg-orange-100 text-orange-700';
       case TopicStatus.Stalled: return 'bg-stone-100 text-stone-700';
       default: return 'bg-gray-100 text-gray-700';
     }
  };

  if (!topic) return null;

  const TabButton = ({ id, label, count }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        activeTab === id 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-blue-100' : 'bg-slate-100'}`}>
            {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
            <ArrowRight className="w-4 h-4 ml-1" />
            عودة للقائمة
        </button>
        
        <div className="flex gap-2">
            <button 
                onClick={handleSendReminder}
                disabled={sendingTelegram}
                className="flex items-center gap-2 px-4 py-2 text-sky-600 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors shadow-sm disabled:opacity-50"
            >
                <Bell className="w-4 h-4" />
                <span>{sendingTelegram ? 'جاري الإرسال...' : 'تذكير تيليجرام'}</span>
            </button>
            <button 
                onClick={() => navigate(`/topics/edit/${topic.id}`)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
                <Edit className="w-4 h-4" />
                <span>تعديل</span>
            </button>
            <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
            >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-slate-400">#{topic.id}</span>
                <span className={`px-2 py-0.5 text-xs rounded-md ${getStatusColorClass(topic.status)}`}>
                    {topic.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{topic.title}</h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex flex-col items-center">
                    <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> تاريخ التكليف</span>
                    <span className="font-semibold text-slate-700">{topic.assignmentDate}</span>
                </div>
                <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg flex flex-col items-center">
                    <span className="text-slate-400 text-xs mb-1 flex items-center gap-1"><CalendarCheck className="w-3 h-3"/> موعد التسليم</span>
                    <span className="font-semibold text-slate-700">{topic.dueDate}</span>
                </div>
                {topic.closingDate && (
                    <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center">
                        <span className="text-green-600 text-xs mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> تاريخ الإغلاق</span>
                        <span className="font-semibold text-green-700">{topic.closingDate}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-6">
            <TabButton id="details" label="التفاصيل" />
            <TabButton id="followups" label="سجل المتابعات" count={followups.length} />
            <TabButton id="attachments" label="المرفقات" count={0} />
        </div>

        <div className="p-6">
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">المعني بالتنفيذ</label>
                                <p className="font-medium text-slate-800">
                                    {departments.find(d => d.id === topic.deptId)?.name || 'غير محدد'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">الجهة الطالبة / المرسل</label>
                                <p className="font-medium text-slate-800">{topic.sender}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">نوع المهمة</label>
                                <p className="font-medium text-slate-800">{topic.type}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">تفاصيل المهمة</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed min-h-[150px]">
                            {topic.details}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'followups' && (
                <div className="space-y-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Send className="w-4 h-4 text-blue-600" />
                            إضافة متابعة جديدة
                        </h3>
                        <form onSubmit={handleAddFollowup} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">مستوى التقدم</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg"
                                        value={progressLevel}
                                        onChange={e => setProgressLevel(e.target.value)}
                                    >
                                        <option>ممتاز</option>
                                        <option>جيد جدا</option>
                                        <option>جيد</option>
                                        <option>مقبول</option>
                                        <option>ضعيف</option>
                                        <option>متأخر</option>
                                        <option>متوقف</option>
                                        <option>ملغي</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">النتيجة الحالية</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="مثال: تم إنجاز المرحلة الأولى..."
                                        value={newResult}
                                        onChange={e => setNewResult(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">الملاحظات</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg h-20 resize-none"
                                    placeholder="تفاصيل إضافية..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    حفظ المتابعة
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="relative border-r border-slate-200 mr-4 space-y-8">
                        {followups.map((f, idx) => {
                            const evaluatorName = DataService.getUsers().find(u => u.id === f.evaluatorId)?.name || 'مستخدم';
                            return (
                                <div key={f.id} className="relative pr-8">
                                    <div className="absolute -right-1.5 top-0 w-3 h-3 bg-blue-600 rounded-full ring-4 ring-white"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-slate-800">{f.date}</span>
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{evaluatorName}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-semibold text-blue-700">{f.resultText}</span>
                                            <span className="text-xs font-medium text-slate-500">{f.progressLevel}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm">{f.notes}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'attachments' && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد مرفقات حالياً</p>
                    <button className="mt-4 px-4 py-2 text-sm text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50">
                        رفع ملف جديد
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
