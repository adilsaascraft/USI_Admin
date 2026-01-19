'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Copy, Share2, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicQuestionSharePage() {
  const { webinarId } = useParams()

  if (!webinarId || Array.isArray(webinarId)) return null

  const shareUrl = `${window.location.origin}/${webinarId}/question-asked-by-users`

  const [webinarName, setWebinarName] = useState<string | null>(null)

  /* ================= FETCH WEBINAR NAME ================= */
 useEffect(() => {
   const loadWebinar = async () => {
     try {
       const res = await fetch(
         `${process.env.NEXT_PUBLIC_API_URL}/api/webinars`
       )
       const result = await res.json()

       const webinar = result.data.find((w: any) => w._id === webinarId)

       setWebinarName(webinar?.name || 'Webinar')
     } catch {
       setWebinarName('Webinar')
     }
   }

   loadWebinar()
 }, [webinarId])


  /* ================= COPY ================= */

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }

  /* ================= SHARE LINKS ================= */

  const whatsappText = `Questions asked by users in "${webinarName}"

${shareUrl}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`


  const gmailUrl = `mailto:?subject=${encodeURIComponent(
    `Questions from ${webinarName}`
  )}&body=${encodeURIComponent(shareUrl)}`

  const messageUrl = `sms:?body=${encodeURIComponent(shareUrl)}`

  /* ================= LOADING ================= */

  if (!webinarName) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Skeleton className="h-6 w-1/2 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-md text-sky-800 hover:text-sky-900 font-semibold">{webinarName}</h2>
        <p className="text-muted-foreground">
          Questions asked by users in this webinar. Share this public link with
          speakers or faculty.
        </p>
      </div>

      {/* Share Link */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Shareable link</label>

        <div className="flex gap-2">
          <Input readOnly value={shareUrl} />
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Share via</p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(gmailUrl, '_blank')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Gmail
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(messageUrl, '_blank')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </div>
    </div>
  )
}
