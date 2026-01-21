"use client";

import { useParams } from "next/navigation";
import SettingClient from "@/components/clients/webinar/SettingClient";

export default function SettingPage() {
  const { webinarId } = useParams();

  if (!webinarId || Array.isArray(webinarId)) return null;

  return (
    <div className="p-4">
      <SettingClient webinarId={webinarId} />
    </div>
  );
}
