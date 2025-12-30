
"use client";

import { useParams } from "next/navigation";
import WeekCategoryClient from "@/components/clients/course/WeekCategoryClient";

export default function WeekCategoryPage() {
  const { courseId } = useParams();
  if (!courseId || Array.isArray(courseId)) return null;

  return (
    <div className="p-4">
      <WeekCategoryClient courseId={courseId} />
    </div>
  )
}

