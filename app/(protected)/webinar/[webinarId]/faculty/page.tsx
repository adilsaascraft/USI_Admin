// Faculty Page
"use client";

import { useParams } from "next/navigation";
import FacultyClient from "@/components/clients/webinar/FacultyClient";

export default function FacultyPage() {
  const { webinarId } = useParams();
  if (!webinarId || Array.isArray(webinarId)) return null;

  return (
    <div className="p-4">
      <FacultyClient webinarId={webinarId} />
    </div>
  );
}

