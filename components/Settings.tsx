import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { User, UserRole } from '../types';
import { Trash2, Edit2, Check, X, Shield, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');
  const [users, setUsers] = useState<User[]>(DataService.getUsers());
  const [editingId, setEditingId] = useState<number | null>(null);
  const departments = DataService.getDepartments();
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.User,
    deptId: 1
  });

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">إعدادات النظام</h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'
          }`}
        >
          إدارة المستخدمين والصلاحيات
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
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

      {activeTab === 'system' && (
          <div className="space-y-6">
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
                      <div className="flex justify-between items-center">
                          <div>
                              <h4 className="font-semibold text-slate-800">إعادة ضبط المصنع</h4>
                              <p className="text-sm text-slate-500">حذف جميع البيانات المدخلة واستعادة البيانات الافتراضية</p>
                          </div>
                          <button 
                            onClick={handleResetSystem}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                              <RefreshCw className="w-4 h-4 inline-block ml-2" />
                              إعادة تعيين
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};