
"use client";

import { useParams } from "next/navigation";
import HallClient from "@/components/clients/conference/HallClient";

export default function HallPage() {
  const { conferenceId } = useParams();
  if (!conferenceId || Array.isArray(conferenceId)) return null;

  return (
    <div className="p-4">
      <HallClient conferenceId={conferenceId} />
    </div>
  );
}

