
import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { LogIn, UserCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users = DataService.getUsers();
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.id || 1);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = DataService.login(Number(selectedUserId));
    if (success) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-white font-extrabold text-3xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">GoalTrack Pro</h1>
          <p className="text-blue-100 text-sm">نظام متابعة الأهداف والمهام المؤسسية</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اختر حساب المستخدم للدخول
              </label>
              <div className="relative">
                <UserCircle2 className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                <select 
                  className="w-full p-3 pr-10 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {DataService.getDepartments().find(d => d.id === user.deptId)?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <LogIn className="w-5 h-5" />
              تسجيل الدخول
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
