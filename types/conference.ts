// types/conference.ts

export type ConferenceType = {
  _id: string

  name: string
  image: string
  description: string
  conferenceType: string

  startDate: string      // DD/MM/YYYY
  endDate: string        // DD/MM/YYYY

  timeZone: string       // e.g. Asia/Kolkata

  registrationType: "paid" | "free"
  amount: number

  status: "Active" | "Inactive"

  createdAt: string
  updatedAt: string
}
