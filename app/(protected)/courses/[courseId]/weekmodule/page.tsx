
"use client";

import { useParams } from "next/navigation";
import WeekModuleClient from "@/components/clients/course/WeekModuleClient";

export default function WeekModulePage() {
  const { courseId } = useParams();
  if (!courseId || Array.isArray(courseId)) return null;

  return (
    <div className="p-4">
      <WeekModuleClient courseId={courseId} />
    </div>
  )
}

