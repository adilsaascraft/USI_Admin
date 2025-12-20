// types/event.ts

// ✅ Strongly typed Event based on your API response
export type EventType = {
  _id: string
  eventName: string
  shortName: string
  eventImage: string
  eventCode: string
  regNum: string
  organizer: {
    _id: string
    organizerName: string
    contactPersonName: string
    contactPersonMobile: string
    contactPersonEmail: string
    status: string
    createdAt: string
    updatedAt: string
  }
  department: {
    _id: string
    departmentName: string
    contactPersonName: string
    contactPersonMobile: string
    contactPersonEmail: string
    status: string
    createdAt: string
    updatedAt: string
  }
  venueName: {
    _id: string
    venueName: string
    venueAddress: string
    venueImage: string
    country: string
    state: string
    city: string
    status: string
    distanceFromAirport: string
    distanceFromRailwayStation: string
    nearestMetroStation: string
    createdAt: string
    updatedAt: string
  }
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeZone: string
  country: string
  state: string
  city: string
  eventType: string
  registrationType: string
  currencyType: string
  eventCategory: string
  isEventApp: boolean
  dynamicStatus: string   // ✅ take status directly from API
  createdAt: string
  updatedAt: string
}


