
"use client";

import { useParams } from "next/navigation";
import FAQClient from "@/components/clients/webinar/FAQClient";

export default function FAQPage() {
  const { webinarId } = useParams();
  if (!webinarId || Array.isArray(webinarId)) return null;

  return (
    <div className="p-4">
      <FAQClient webinarId={webinarId} />
    </div>
  )
}

