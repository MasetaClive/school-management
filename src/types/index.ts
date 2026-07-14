export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';

export interface User {
  id: string;
  role: UserRole;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  class_id: string | null;
  parent_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  medical_info: Record<string, unknown>;
  admission_date: string | null;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  teacher_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  parent_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  occupation: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade_level: number;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  created_at: string;
}
