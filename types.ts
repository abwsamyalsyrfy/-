
export enum TopicStatus {
  Pending = 'قيد المتابعة',
  Closed = 'مغلقة',
  Overdue = 'متأخرة',
  Ongoing = 'مستمر',
  Cancelled = 'ملغية',
  Phased = 'مرحلة',
  Postponed = 'مؤجلة',
  Stalled = 'متوقفة'
}

export enum PriorityLevel {
  Low = 'منخفض',
  Normal = 'عادي',
  High = 'مهم',
  Urgent = 'عاجل'
}

export enum UserRole {
  Admin = 'مدير النظام',
  Manager = 'مدير إدارة',
  User = 'مستخدم'
}

export interface Department {
  id: number;
  name: string;
  email: string;
  telegramChatId?: string; // New field for Telegram integration
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  deptId?: number;
  isActive: boolean;
}

export interface Topic {
  id: number;
  title: string;
  type: string;
  assignmentDate: string; // Renamed from receivedDate (تاريخ التكليف)
  sender: string;
  deptId: number;
  priority: PriorityLevel;
  dueDate: string; // ISO Date (موعد التسليم)
  details: string;
  status: TopicStatus;
  lastUpdated: string;
  createdBy: number;
  closingDate?: string; // New field (تاريخ الإغلاق)
}

export interface Followup {
  id: number;
  topicId: number;
  date: string;
  type: string;
  notes: string;
  progressLevel: string;
  evaluatorId: number;
  resultText: string;
}

export interface Attachment {
  id: number;
  topicId: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: number;
}
