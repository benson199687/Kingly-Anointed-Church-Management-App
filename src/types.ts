export type UserRole = 'member' | 'deacon' | 'elder' | 'pastor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  memberSince: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  assignedAttendanceDuty?: boolean;
  assignedFinanceDuty?: boolean;
  assignedMembersLog?: boolean;
  financeLevel?: 'none' | 'view' | 'full';
  spiritualGrowthLevel?: string;
  classEnrollment?: string;
  xp?: number;
  isMinistryVolunteer?: boolean;
  pastorType?: 'main' | 'associate';
  spiritualGrowthNote?: string;
}

export interface Church {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  denomination: string;
  color: string;
  youtubeUrl?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  status: 'active' | 'inactive';
  role: UserRole;
  attendance: number;
  groups: string[];
  assignedAttendanceDuty?: boolean;
  assignedFinanceDuty?: boolean;
  assignedMembersLog?: boolean;
  financeLevel?: 'none' | 'view' | 'full';
  spiritualGrowthLevel?: string;
  classEnrollment?: string;
  xp?: number;
  isMinistryVolunteer?: boolean;
  pastorType?: 'main' | 'associate';
  spiritualGrowthNote?: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: string;
  views: number;
  category: string;
  scripture: string;
  videoUrl?: string;
  notes?: string;
  imageUrl?: string;
  hasCustomThumbnail?: boolean;
  status?: 'approved' | 'pending';
  approvedBy?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'service' | 'youth' | 'study' | 'prayer' | 'outreach';
  attendees: number;
  capacity: number;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'General' | 'Events' | 'Prayer' | 'Urgent' | 'Youth';
  content: string;
  date: string;
  pinned: boolean;
  expires: string | null;
  likes?: string[];
  sharesCount?: number;
  comments?: Array<{
    id: string;
    author: string;
    role: string;
    content: string;
    date: string;
  }>;
}

export interface PrayerRequest {
  id: string;
  member: string;
  category: 'Health' | 'Family' | 'Work' | 'Personal' | 'Finance' | 'Other';
  request: string;
  date: string;
  status: 'active' | 'answered';
  prayers: number;
  private: boolean;
  likedBy?: { userName: string; date: string }[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  week: string;
  date: string;
  duration: number;
  participants: number;
  avgScore: number;
  status: 'active' | 'archived';
  questions: Question[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  name: string;
  submittedBy?: string;
  submittedRole?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'pending_mobile_money';
  approvedBy?: string;
  approvedDate?: string;
  reference?: string;
}

export interface AttendanceRecord {
  id?: string;
  week?: string;
  sunday?: number;
  midweek?: number;
  youth?: number;

  date?: string;
  male?: number;
  female?: number;
  kids?: number;
  total?: number;
  submittedBy?: string;
  submittedRole?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
  level?: 'Youths' | 'Elders' | 'Mixed';
  notes?: string;
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Postponed';
  isApproved: boolean;
  createdBy: string;
  approvedBy?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  syllabusId?: string;
}

export interface Syllabus {
  id: string;
  courseId: string;
  title: string;
  description: string;
}

export interface StudyModule {
  id: string;
  courseId: string;
  syllabusId: string;
  title: string;
  order: number;
  description: string;
  requiredQuizScore?: number; // e.g., 70
}

export interface LessonResource {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'document';
  url: string;
}

export interface AcademyLesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  order: number;
  introduction: string;
  notes: string;
  scriptures: string[];
  discussionQuestions: string[];
  resources?: LessonResource[];
  quizId?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number; // undefined = open-ended
  type: 'multiple-choice' | 'open-ended';
  explanation?: string;
}

export interface AcademyQuiz {
  id: string;
  title: string;
  linkedType: 'course' | 'syllabus' | 'module';
  linkedId: string;
  passingMark: number;
  timeLimit?: number; // in minutes
  attemptsAllowed: number; // 0 = unlimited
  questions: QuizQuestion[];
  isSelfAssessment: boolean;
}

export interface AcademyExam {
  id: string;
  title: string;
  linkedCourseId: string;
  linkedSyllabusId: string;
  linkedModuleIds: string[];
  startDate: string;
  endDate: string;
  passingMark: number;
  timeLimit?: number; // in minutes
  attemptsAllowed: number;
  questions: QuizQuestion[];
}

export interface StudentProgress {
  userId: string;
  completedLessons: string[];
  completedModules: string[];
  completedCourses: string[];
  quizAttempts: Record<string, { attempts: number; bestScore: number; passed: boolean; responses: any[] }>;
  examAttempts: Record<string, { attempts: number; score: number; passed: boolean; completedAt: string; responses: any[] }>;
  gradedResponses?: Record<string, { reviewer: string; grade: number; comments: string; isReviewed: boolean }>;
  certificates: { courseId: string; courseTitle: string; earnedAt: string }[];
  certificateStatus?: string;
  certificateId?: string;
  completedDate?: string;
}

export interface Group {
  id: string;
  name: string;
  leader: string;
  members: number;
  day: string;
  time: string;
  location: string;
  type?: string;
  certificateEnabled?: boolean;
  memberNames?: string[];
  bulletins?: { id: string; author: string; content: string; date: string }[];
  sharedSermons?: string[]; // IDs of shared sermons in this group
  lessons?: any[];
  liveStreamLink?: string;
  // NEW small group modules
  groupEvents?: GroupEvent[];
  courses?: Course[];
  syllabi?: Syllabus[];
  studyModules?: StudyModule[];
  academyLessons?: AcademyLesson[];
  quizzes?: AcademyQuiz[];
  exams?: AcademyExam[];
  studentProgress?: Record<string, StudentProgress>;
  signatory1?: string;
  signatory1Title?: string;
  signatory2?: string;
  signatory2Title?: string;
  status?: string;
  certificateTheme?: string;
  allowMemberDownloads?: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  due: string;
}

export interface Message {
  id: string;
  from: string;
  to?: string; // Target user name or 'all'
  groupId?: string; // Target group id (for small group discussions/bulletins)
  preview: string;
  content?: string;
  time: string;
  unread: boolean;
  attachmentType?: 'sermon' | 'prayer_thankyou';
  attachmentId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "connection_request" | "system" | "prayer_alert" | "mobile_money_pending" | "deletion_request";
  timestamp: string;
  fromUser: string;
  targetGroupId?: string;
  personName?: string;
  status: "pending" | "approved" | "dismissed";
  prayerRequestId?: string;
  targetUser?: string;
  thankYouSent?: boolean;
  transactionId?: string;
  itemType?: string;
  itemId?: string;
  parentId?: string;
  itemName?: string;
}

export interface DatabaseState {
  users?: User[];
  churches: Church[];
  members: Member[];
  events: Event[];
  sermons: Sermon[];
  prayerRequests: PrayerRequest[];
  announcements: Announcement[];
  finances: {
    income: Transaction[];
    expenses: Transaction[];
    offeringTypes?: string[];
  };
  attendance: AttendanceRecord[];
  tasks: Task[];
  quizzes: Quiz[];
  groups: Group[];
  messages?: Message[];
  notifications?: Notification[];
  dashboardStats?: {
    id: string;
    label: string;
    val: string;
    imageUrl: string;
  }[];
}
