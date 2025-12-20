import { fillerWords } from "@/lib/fillerWords"

export function generateShortName(eventName: string): string {
  if (!eventName.trim()) return ""

  const words = eventName.trim().split(/\s+/)

  const acronym = words
    .filter(
      (w) =>
        w.toLowerCase() !== "aig" && // skip "AIG" if included
        !fillerWords.includes(w.toLowerCase()) && // skip filler words
        !/^\d{4}$/.test(w) // skip year numbers
    )
    .map((w) => w[0].toLowerCase())
    .join("")

  const currentYear = new Date().getFullYear()

  return `aig${acronym}${currentYear}`
}
