

import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { User, UserRole, LogEntry } from '../types';
import { Trash2, Edit2, Shield, RefreshCw, Send, Save, Download, Upload, AlertTriangle, Activity, FileText } from 'lucide-react';
import { TelegramService } from '../services/telegramService';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'telegram' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>(DataService.getUsers());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [departments, setDepartments] = useState(DataService.getDepartments());
  const [telegramToken, setTelegramToken] = useState(DataService.getTelegramToken());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.User,
    deptId: 1
  });

  useEffect(() => {
      if (activeTab === 'logs') {
          setLogs(DataService.getLogs());
      }
  }, [activeTab]);

  const refreshUsers = () => {
    setUsers(DataService.getUsers());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.addUser({
        ...newUser,
        isActive: true
    });
    setNewUser({ name: '', email: '', role: UserRole.User, deptId: 1 });
    refreshUsers();
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        DataService.deleteUser(id);
        refreshUsers();
    }
  };

  const handleUpdateRole = (id: number, newRole: UserRole) => {
    DataService.updateUser(id, { role: newRole });
    refreshUsers();
    setEditingId(null);
  };

  const handleResetSystem = () => {
      const confirmText = prompt('لإعادة تعيين النظام وحذف جميع البيانات المضافة، اكتب "تأكيد"');
      if (confirmText === 'تأكيد') {
          DataService.resetSystem();
          alert('تم إعادة تعيين النظام بنجاح');
          window.location.href = '/'; // Hard reload
      }
  };

  const handleSaveTelegramToken = () => {
      DataService.setTelegramToken(telegramToken);
      alert('تم حفظ توكن البوت بنجاح');
  };

  const handleUpdateChatId = (deptId: number, chatId: string) => {
      DataService.updateDepartment(deptId, { telegramChatId: chatId });
      setDepartments(DataService.getDepartments());
  };

  const handleTestTelegram = async (chatId: string) => {
      if(!chatId) return alert('ادخل معرف المحادثة أولاً');
      const success = await TelegramService.sendMessage(chatId, '🔔 رسالة تجريبية من نظام GoalTrack');
      if(success) alert('تم الإرسال بنجاح!');
      else alert('فشل الإرسال. تأكد من التوكن ومعرف المحادثة وأن البوت مضاف للمجموعة.');
  };

  const handleBackup = () => {
    const data = DataService.exportFullSystem();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `goaltrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (DataService.importFullSystem(json)) {
                  alert('تم استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل النظام.');
                  window.location.reload();
              } else {
                  alert('ملف النسخة الاحتياطية غير صالح.');
              }
          } catch (err) {
              alert('حدث خطأ أثناء قراءة الملف. تأكد من اختيار ملف JSON صحيح.');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + ['التاريخ,المستخدم,الإجراء,التفاصيل'].join(',') + '\n'
        + logs.map(l => `${l.timestamp},${l.userName},${l.action},${l.details}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "activity_logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">إعدادات النظام</h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'
          }`}
        >
          إدارة المستخدمين
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'telegram' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'
          }`}
        >
          إعدادات تيليجرام
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          سجل النشاطات
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'system' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'
          }`}
        >
          النظام والصيانة
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">المستخدمين الحاليين</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-3">الاسم</th>
                                <th className="p-3">البريد</th>
                                <th className="p-3">الصلاحية</th>
                                <th className="p-3">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3 text-slate-500">{user.email}</td>
                                    <td className="p-3">
                                        {editingId === user.id ? (
                                            <select 
                                                className="p-1 border rounded text-xs"
                                                defaultValue={user.role}
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                                onBlur={() => setEditingId(null)}
                                            >
                                                {Object.values(UserRole).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                user.role === UserRole.Admin ? 'bg-purple-100 text-purple-700' : 
                                                user.role === UserRole.Manager ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'
                                            }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => setEditingId(user.id)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {user.id !== 1 && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-fit p-4">
                <h3 className="font-bold text-slate-800 mb-4">إضافة مستخدم جديد</h3>
                <form onSubmit={handleAddUser} className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">الاسم الكامل</label>
                        <input 
                            required
                            className="w-full p-2 border rounded-lg text-sm"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">البريد الإلكتروني</label>
                        <input 
                            required type="email"
                            className="w-full p-2 border rounded-lg text-sm"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">الصلاحية</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                        >
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">الإدارة</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={newUser.deptId}
                            onChange={e => setNewUser({...newUser, deptId: Number(e.target.value)})}
                        >
                             {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        إضافة المستخدم
                    </button>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">سجل النشاطات (Audit Log)</h3>
                    <p className="text-xs text-slate-500">آخر العمليات التي تمت على النظام</p>
                  </div>
                  <button 
                    onClick={exportLogs}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs font-bold"
                  >
                      <FileText className="w-3 h-3" />
                      تصدير السجل
                  </button>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-sm text-right">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                          <tr>
                              <th className="p-3 w-40">التاريخ / الوقت</th>
                              <th className="p-3 w-40">المستخدم</th>
                              <th className="p-3 w-40">الإجراء</th>
                              <th className="p-3">التفاصيل</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {logs.length > 0 ? logs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="p-3 text-xs dir-ltr font-mono text-slate-500">
                                      {new Date(log.timestamp).toLocaleString('en-US')}
                                  </td>
                                  <td className="p-3 font-medium text-slate-700">{log.userName}</td>
                                  <td className="p-3">
                                      <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{log.action}</span>
                                  </td>
                                  <td className="p-3 text-slate-600">{log.details}</td>
                              </tr>
                          )) : (
                              <tr>
                                  <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد سجلات محفوظة</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'telegram' && (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-600" />
                      إعدادات البوت
                  </h3>
                  <div className="flex gap-3 items-end">
                      <div className="flex-1">
                          <label className="block text-sm text-slate-600 mb-1">Telegram Bot Token</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg bg-slate-50 font-mono text-sm"
                            placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                          />
                      </div>
                      <button onClick={handleSaveTelegramToken} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          حفظ التوكن
                      </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                      يمكنك الحصول على التوكن من خلال التحدث مع @BotFather على تيليجرام.
                  </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">ربط الإدارات</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                          <thead className="bg-slate-50 text-slate-500">
                              <tr>
                                  <th className="p-3">الإدارة</th>
                                  <th className="p-3 w-96">Chat ID (معرف المجموعة/المستخدم)</th>
                                  <th className="p-3">اختبار</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {departments.map(dept => (
                                  <tr key={dept.id} className="hover:bg-slate-50">
                                      <td className="p-3 font-medium">{dept.name}</td>
                                      <td className="p-3">
                                          <input 
                                            className="w-full p-1 border rounded text-xs font-mono" 
                                            placeholder="-100123456789"
                                            value={dept.telegramChatId || ''}
                                            onChange={(e) => handleUpdateChatId(dept.id, e.target.value)}
                                          />
                                      </td>
                                      <td className="p-3">
                                          <button 
                                            onClick={() => handleTestTelegram(dept.telegramChatId || '')}
                                            className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                                          >
                                              إرسال تجربة
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg">
                      <strong>ملاحظة:</strong> لمعرفة Chat ID، قم بإضافة البوت للمجموعة ثم استخدم بوت آخر مثل @userinfobot أو @getidsbot. تأكد من إعطاء البوت صلاحية إرسال الرسائل.
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'system' && (
          <div className="space-y-6">
              {/* Backup & Restore Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                      النسخ الاحتياطي واستعادة البيانات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 mb-2">تصدير نسخة كاملة</h4>
                          <p className="text-sm text-slate-500 mb-4">
                              قم بتحميل ملف يحتوي على كافة بيانات النظام (المستخدمين، المهام، الإعدادات، السجلات) للاحتفاظ بها.
                          </p>
                          <button 
                            onClick={handleBackup}
                            className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center justify-center gap-2 shadow-sm"
                          >
                              <Download className="w-4 h-4" />
                              تحميل النسخة الاحتياطية
                          </button>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 relative">
                          <h4 className="font-bold text-slate-800 mb-2">استعادة النظام</h4>
                          <p className="text-sm text-slate-500 mb-4">
                              استرجع البيانات من ملف نسخة احتياطية سابق. <span className="text-red-500 font-bold">سيتم استبدال البيانات الحالية.</span>
                          </p>
                          <div className="relative">
                              <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm pointer-events-none">
                                  <Upload className="w-4 h-4" />
                                  رفع ملف النسخة الاحتياطية
                              </button>
                              <input 
                                type="file" 
                                accept=".json"
                                onChange={handleRestore}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                          </div>
                      </div>
                  </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4 text-red-600 mb-4">
                      <div className="p-3 bg-red-100 rounded-full">
                          <Shield className="w-6 h-6" />
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-slate-800">منطقة الخطر</h3>
                          <p className="text-slate-500 text-sm">الإجراءات هنا لا يمكن التراجع عنها</p>
                      </div>
                  </div>
                  
                  <div className="border-t pt-4">
                      <div className="flex justify-between items-center bg-red-50 p-4 rounded-lg border border-red-100">
                          <div>
                              <h4 className="font-bold text-red-900 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  إعادة ضبط المصنع
                              </h4>
                              <p className="text-sm text-red-700 mt-1">حذف جميع البيانات واستعادة الإعدادات الافتراضية</p>
                          </div>
                          <button 
                            onClick={handleResetSystem}
                            className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-bold text-sm"
                          >
                              تنفيذ إعادة التعيين
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};