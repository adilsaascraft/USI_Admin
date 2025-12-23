// types/course.ts

export type CourseType = {
  _id: string

  /* ================= CORE ================= */
  courseName: string
  courseImage: string
  description?: string

  /* ================= DATE & TIME ================= */
  startDate: string // DD/MM/YYYY
  endDate: string // DD/MM/YYYY
  startTime: string // hh:mm A
  endTime: string // hh:mm A
  timeZone: string // e.g. Asia/Kolkata

  /* ================= REGISTRATION ================= */
  registrationType: 'paid' | 'free'
  amount: number

  /* ================= STATUS ================= */
  status: 'Active' | 'Inactive'

  /* ================= STREAM ================= */
  streamLink: string

  /* ================= META ================= */
  createdAt: string
  updatedAt: string
}
