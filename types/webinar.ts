// types/webinar.ts

export type WebinarType = {
  _id: string

  webinarName: string
  webinarImage: string

  startDate: string      // DD/MM/YYYY
  endDate: string        // DD/MM/YYYY
  startTime: string      // hh:mm A
  endTime: string        // hh:mm A
  timeZone: string       // e.g. Asia/Kolkata

  registrationType: "paid" | "free"
  amount: number

  status: "Active" | "Inactive"

  streamLink: string

  dynamicStatus: "Live" | "Running" | "Past"

  createdAt: string
  updatedAt: string
}
