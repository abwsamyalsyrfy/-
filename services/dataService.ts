

import { Topic, Followup, Department, User, TopicStatus, UserRole, LogEntry } from '../types';

// Initial default departments
let departments: Department[] = [
  { id: 1, name: 'الإدارة العامة', email: 'admin@company.com', telegramChatId: '' },
  { id: 2, name: 'قسم التطوير', email: 'dev@company.com', telegramChatId: '' },
  { id: 3, name: 'قسم الدعم الفني', email: 'support@company.com', telegramChatId: '' },
  { id: 4, name: 'الموارد البشرية', email: 'hr@company.com', telegramChatId: '' },
];

// Initial Users
const DEFAULT_USERS: User[] = [
  { id: 1, name: 'مدير النظام', email: 'admin@company.com', role: UserRole.Admin, isActive: true, deptId: 1 },
];
let users: User[] = [...DEFAULT_USERS];

// --- LOCAL STORAGE HELPERS ---
const STORAGE_KEYS = {
  TOPICS: 'goaltrack_topics',
  FOLLOWUPS: 'goaltrack_followups',
  DEPTS: 'goaltrack_depts',
  USERS: 'goaltrack_users',
  TELEGRAM_TOKEN: 'goaltrack_telegram_token',
  CURRENT_USER: 'goaltrack_current_user_id',
  LOGS: 'goaltrack_audit_logs'
};

const loadFromStorage = (key: string, defaultVal: any[]) => {
  const stored = localStorage.getItem(key);
  try {
      return stored ? JSON.parse(stored) : defaultVal;
  } catch (e) {
      return defaultVal;
  }
};

const saveToStorage = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// LOAD DATA
let topics: Topic[] = loadFromStorage(STORAGE_KEYS.TOPICS, []);
let followups: Followup[] = loadFromStorage(STORAGE_KEYS.FOLLOWUPS, []);
let auditLogs: LogEntry[] = loadFromStorage(STORAGE_KEYS.LOGS, []);

// Load depts
let storedDepts = localStorage.getItem(STORAGE_KEYS.DEPTS);
if (storedDepts) {
    try {
        departments = JSON.parse(storedDepts);
    } catch(e) {}
}

// Load users safely
let storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
if (storedUsers) {
    try {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            users = parsedUsers;
        }
    } catch(e) {}
}

// Load Session
let currentUser: User | null = null;
const storedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
if (storedUserId) {
    currentUser = users.find(u => u.id === parseInt(storedUserId)) || null;
}

export const DataService = {
  // --- LOGGING ---
  logAction: (action: string, details: string) => {
      const entry: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          action,
          details,
          userId: currentUser ? currentUser.id : 0,
          userName: currentUser ? currentUser.name : 'System',
          timestamp: new Date().toISOString()
      };
      // Keep only last 500 logs to save space
      auditLogs = [entry, ...auditLogs].slice(0, 500);
      saveToStorage(STORAGE_KEYS.LOGS, auditLogs);
  },

  getLogs: () => [...auditLogs],
  
  clearLogs: () => {
      auditLogs = [];
      saveToStorage(STORAGE_KEYS.LOGS, []);
  },

  // --- AUTHENTICATION ---
  isAuthenticated: () => !!currentUser,

  login: (userId: number): boolean => {
      const user = users.find(u => u.id === userId);
      if (user) {
          currentUser = user;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId.toString());
          DataService.logAction('تسجيل دخول', `المستخدم: ${user.name}`);
          return true;
      }
      return false;
  },

  logout: () => {
      if (currentUser) {
          DataService.logAction('تسجيل خروج', `المستخدم: ${currentUser.name}`);
      }
      currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User => {
      return currentUser || users[0];
  },

  // --- TELEGRAM SETTINGS ---
  getTelegramToken: () => localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || '',
  
  setTelegramToken: (token: string) => {
      localStorage.setItem(STORAGE_KEYS.TELEGRAM_TOKEN, token);
      DataService.logAction('تحديث إعدادات', 'تم تحديث توكن تيليجرام');
  },

  // --- DEPARTMENTS (Dynamic) ---
  getDepartments: () => [...departments],
  
  updateDepartment: (id: number, data: Partial<Department>) => {
      departments = departments.map(d => d.id === id ? { ...d, ...data } : d);
      saveToStorage(STORAGE_KEYS.DEPTS, departments);
      DataService.logAction('تحديث إدارة', `تحديث بيانات الإدارة رقم ${id}`);
  },
  
  resolveDepartment: (name: string): number => {
      if (!name) return 1; 
      
      const normalizedInput = name.trim();
      
      const existing = departments.find(d => d.name.trim().toLowerCase() === normalizedInput.toLowerCase());
      if (existing) return existing.id;

      const newId = Math.max(...departments.map(d => d.id), 0) + 1;
      const newDept: Department = {
          id: newId,
          name: normalizedInput,
          email: ''
      };
      departments.push(newDept);
      saveToStorage(STORAGE_KEYS.DEPTS, departments);
      DataService.logAction('إضافة إدارة', `إضافة إدارة جديدة: ${normalizedInput}`);
      return newId;
  },

  // --- TOPICS ---
  getTopics: () => [...topics],
  
  getTopicById: (id: number) => topics.find(t => t.id === id),
  
  addTopic: (topic: Omit<Topic, 'id' | 'lastUpdated'>) => {
    const newTopic: Topic = {
      ...topic,
      id: Math.floor(Math.random() * 100000) + 1000,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    topics = [newTopic, ...topics];
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    DataService.logAction('إضافة مهمة', `تم إضافة المهمة: ${newTopic.title}`);
    return newTopic;
  },

  updateTopic: (id: number, updatedData: Partial<Topic>) => {
    const oldTopic = topics.find(t => t.id === id);
    topics = topics.map(t => t.id === id ? { ...t, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : t);
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    DataService.logAction('تحديث مهمة', `تعديل المهمة #${id} - ${oldTopic?.title || ''}`);
  },

  deleteTopic: (id: number) => {
    const t = topics.find(x => x.id === id);
    topics = topics.filter(t => t.id !== id);
    followups = followups.filter(f => f.topicId !== id); 
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    saveToStorage(STORAGE_KEYS.FOLLOWUPS, followups);
    DataService.logAction('حذف مهمة', `تم حذف المهمة: ${t?.title || id}`);
  },

  updateTopicStatus: (id: number, status: TopicStatus) => {
    const updates: Partial<Topic> = { status };
    if (status === TopicStatus.Closed) {
        updates.closingDate = new Date().toISOString().split('T')[0];
    } else {
        updates.closingDate = undefined; 
    }
    DataService.updateTopic(id, updates);
    DataService.logAction('تغيير حالة', `تغيير حالة المهمة #${id} إلى ${status}`);
  },

  // --- FOLLOWUPS ---
  getFollowups: (topicId?: number) => {
      if (topicId) return followups.filter(f => f.topicId === topicId);
      return followups;
  },
  
  getFollowupsByDate: (date: string) => {
      return followups.filter(f => f.date === date);
  },

  addFollowup: (followup: Omit<Followup, 'id'>) => {
    const newFollowup = {
      ...followup,
      id: Math.floor(Math.random() * 100000)
    };
    followups = [newFollowup, ...followups];
    saveToStorage(STORAGE_KEYS.FOLLOWUPS, followups);
    
    // Auto status update logic based on result text
    const topic = topics.find(t => t.id === followup.topicId);
    if (topic) {
      const isCompleted = 
        followup.resultText.includes('انجز') || 
        followup.resultText.includes('منجز') || 
        followup.resultText.includes('مكتمل') || 
        followup.resultText.includes('تم');

      let newStatus = topic.status;
      
      if (['ممتاز', 'جيد جدا', 'جيد', 'مقبول'].includes(followup.progressLevel)) {
         newStatus = isCompleted ? TopicStatus.Closed : TopicStatus.Ongoing;
      } else if (['ضعيف', 'سيئ'].includes(followup.progressLevel)) {
         newStatus = TopicStatus.Pending; 
      } else if (followup.progressLevel === 'ملغي') {
         newStatus = TopicStatus.Cancelled;
      } else if (followup.progressLevel === 'متوقف' || followup.progressLevel === 'توقف') {
         newStatus = TopicStatus.Stalled;
      }

      if (isCompleted) newStatus = TopicStatus.Closed;

      DataService.updateTopicStatus(topic.id, newStatus);
    }
    
    DataService.logAction('إضافة متابعة', `متابعة للمهمة #${followup.topicId}`);
    return newFollowup;
  },

  // --- USERS ---
  getUsers: () => {
      if (users.length === 0) {
          users = [...DEFAULT_USERS];
          saveToStorage(STORAGE_KEYS.USERS, users);
      }
      return [...users];
  },
  
  addUser: (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Math.floor(Math.random() * 10000) };
    users = [...users, newUser];
    saveToStorage(STORAGE_KEYS.USERS, users);
    DataService.logAction('إضافة مستخدم', `تم إضافة المستخدم: ${user.name}`);
    return newUser;
  },

  updateUser: (id: number, data: Partial<User>) => {
    users = users.map(u => u.id === id ? { ...u, ...data } : u);
    saveToStorage(STORAGE_KEYS.USERS, users);
    DataService.logAction('تحديث مستخدم', `تحديث بيانات المستخدم #${id}`);
  },

  deleteUser: (id: number) => {
    if (id === 1) return;
    const u = users.find(x => x.id === id);
    users = users.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, users);
    DataService.logAction('حذف مستخدم', `تم حذف المستخدم: ${u?.name || id}`);
  },

  // --- SYSTEM BACKUP & RESTORE ---
  exportFullSystem: () => {
    DataService.logAction('نسخ احتياطي', 'تم تصدير نسخة احتياطية للنظام');
    return {
      topics,
      followups,
      departments,
      users,
      auditLogs, // Include logs in backup
      telegramToken: DataService.getTelegramToken(),
      timestamp: new Date().toISOString(),
      version: '2.1'
    };
  },

  importFullSystem: (data: any) => {
    if (!data || !data.topics || !data.users) return false;
    
    // Validate basic structure
    if (!Array.isArray(data.topics) || !Array.isArray(data.users)) return false;

    // Apply data
    topics = data.topics;
    followups = data.followups || [];
    departments = data.departments || departments;
    users = data.users;
    auditLogs = data.auditLogs || [];
    
    if (data.telegramToken) {
        DataService.setTelegramToken(data.telegramToken);
    }

    // Persist
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    saveToStorage(STORAGE_KEYS.FOLLOWUPS, followups);
    saveToStorage(STORAGE_KEYS.DEPTS, departments);
    saveToStorage(STORAGE_KEYS.USERS, users);
    saveToStorage(STORAGE_KEYS.LOGS, auditLogs);
    
    DataService.logAction('استعادة نظام', 'تم استعادة النظام من نسخة احتياطية');
    return true;
  },

  // --- UTILS ---
  getOverdueTopics: () => {
    const today = new Date().toISOString().split('T')[0];
    return topics.filter(t => 
      t.status === TopicStatus.Overdue || 
      (t.dueDate < today && t.status !== TopicStatus.Closed && t.status !== TopicStatus.Cancelled && t.status !== TopicStatus.Phased && t.status !== TopicStatus.Stalled)
    );
  },

  getStats: () => {
    const total = topics.length;
    const completed = topics.filter(t => t.status === TopicStatus.Closed).length;
    const ongoing = topics.filter(t => t.status === TopicStatus.Ongoing || t.status === TopicStatus.Pending).length;
    const overdue = DataService.getOverdueTopics().length;
    return { total, completed, pending: ongoing, overdue };
  },

  importData: (importedTopics: Topic[]) => {
    const existingIds = new Set(topics.map(t => t.id));
    const newTopics = importedTopics.filter(t => !existingIds.has(t.id));
    
    topics = [...newTopics, ...topics];
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    DataService.logAction('استيراد بيانات', `تم استيراد ${newTopics.length} مهمة من ملف خارجي`);
    return topics.length;
  },

  resetSystem: () => {
    DataService.logAction('إعادة ضبط', 'تم إعادة ضبط النظام للمصنع');
    topics = [];
    followups = [];
    departments = [
      { id: 1, name: 'الإدارة العامة', email: 'admin@company.com', telegramChatId: '' },
      { id: 2, name: 'قسم التطوير', email: 'dev@company.com', telegramChatId: '' },
      { id: 3, name: 'قسم الدعم الفني', email: 'support@company.com', telegramChatId: '' },
      { id: 4, name: 'الموارد البشرية', email: 'hr@company.com', telegramChatId: '' },
    ];
    // Reset to just the admin user
    users = [...DEFAULT_USERS];
    auditLogs = [];

    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOWUPS);
    localStorage.removeItem(STORAGE_KEYS.DEPTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }
};