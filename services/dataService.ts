
import { Topic, Followup, Department, User, TopicStatus, UserRole } from '../types';

// Initial default departments
let departments: Department[] = [
  { id: 1, name: 'الإدارة العامة', email: 'admin@company.com' },
  { id: 2, name: 'قسم التطوير', email: 'dev@company.com' },
  { id: 3, name: 'قسم الدعم الفني', email: 'support@company.com' },
  { id: 4, name: 'الموارد البشرية', email: 'hr@company.com' },
];

// Initial Users
let users: User[] = [
  { id: 1, name: 'مدير النظام', email: 'admin@company.com', role: UserRole.Admin, isActive: true, deptId: 1 },
];

// --- LOCAL STORAGE HELPERS ---
const STORAGE_KEYS = {
  TOPICS: 'goaltrack_topics',
  FOLLOWUPS: 'goaltrack_followups',
  DEPTS: 'goaltrack_depts'
};

const loadFromStorage = (key: string, defaultVal: any[]) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const saveToStorage = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// LOAD DATA (Starts Empty if no local storage)
let topics: Topic[] = loadFromStorage(STORAGE_KEYS.TOPICS, []);
let followups: Followup[] = loadFromStorage(STORAGE_KEYS.FOLLOWUPS, []);
// Load depts from storage if exist, else use defaults
let storedDepts = localStorage.getItem(STORAGE_KEYS.DEPTS);
if (storedDepts) {
    departments = JSON.parse(storedDepts);
}

let currentUser: User = users[0];

export const DataService = {
  // --- DEPARTMENTS (Dynamic) ---
  getDepartments: () => [...departments],
  
  resolveDepartment: (name: string): number => {
      if (!name) return 1; 
      
      const normalizedInput = name.trim();
      
      const existing = departments.find(d => d.name.trim() === normalizedInput);
      if (existing) return existing.id;

      const newId = Math.max(...departments.map(d => d.id), 0) + 1;
      const newDept: Department = {
          id: newId,
          name: normalizedInput,
          email: ''
      };
      departments.push(newDept);
      saveToStorage(STORAGE_KEYS.DEPTS, departments);
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
    return newTopic;
  },

  updateTopic: (id: number, updatedData: Partial<Topic>) => {
    topics = topics.map(t => t.id === id ? { ...t, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : t);
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
  },

  deleteTopic: (id: number) => {
    topics = topics.filter(t => t.id !== id);
    followups = followups.filter(f => f.topicId !== id); 
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    saveToStorage(STORAGE_KEYS.FOLLOWUPS, followups);
  },

  updateTopicStatus: (id: number, status: TopicStatus) => {
    const updates: Partial<Topic> = { status };
    if (status === TopicStatus.Closed) {
        updates.closingDate = new Date().toISOString().split('T')[0];
    } else {
        // If moved out of closed, clear the closing date? 
        // Or keep it as history? Let's clear it to be accurate.
        updates.closingDate = undefined; 
    }
    DataService.updateTopic(id, updates);
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

    return newFollowup;
  },

  // --- USERS ---
  getUsers: () => [...users],
  
  addUser: (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Math.floor(Math.random() * 10000) };
    users = [...users, newUser];
    return newUser;
  },

  updateUser: (id: number, data: Partial<User>) => {
    users = users.map(u => u.id === id ? { ...u, ...data } : u);
  },

  deleteUser: (id: number) => {
    if (id === 1) return;
    users = users.filter(u => u.id !== id);
  },

  getCurrentUser: () => currentUser,
  
  setCurrentUser: (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) currentUser = user;
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
    // Avoid duplicates by ID if possible, or just append?
    // Let's filter out IDs that already exist to be safe
    const existingIds = new Set(topics.map(t => t.id));
    const newTopics = importedTopics.filter(t => !existingIds.has(t.id));
    
    topics = [...newTopics, ...topics];
    saveToStorage(STORAGE_KEYS.TOPICS, topics);
    return topics.length;
  },

  resetSystem: () => {
    topics = [];
    followups = [];
    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOWUPS);
    // keeping depts and users for now to avoid breaking UI completely, or reset them too?
    // Let's reset topics/followups as requested
  }
};
