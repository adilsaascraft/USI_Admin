// Faculty Page
"use client";

import { useParams } from "next/navigation";
import WebinarRegistrationClient from "@/components/clients/webinar/WebinarRegistrationClient";

export default function FacultyPage() {
  const { webinarId } = useParams();
  if (!webinarId || Array.isArray(webinarId)) return null;

  return (
    <div className="p-4">
      <WebinarRegistrationClient webinarId={webinarId} />
    </div>
  );
}

