"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingSchema, SettingValues } from "@/validations/settingSchema";
import { toast } from "sonner";
import { getIndianFormattedDate } from "@/lib/formatIndianDate";
import { settingsList } from "@/lib/imports";

import {
  Form,
  FormControl,
  FormField,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface SettingClientProps {
  webinarId: string;
}

export default function SettingClient({ webinarId }: SettingClientProps) {
  const [settingId, setSettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<SettingValues>({
    resolver: zodResolver(SettingSchema) as unknown as Resolver<SettingValues>,
    defaultValues: {
      faculty: false,
      faq: false,
      feedback: false,
      quiz: false,
      meeting: false,
      question: false,
    },
  });

  /* =======================
     FETCH SETTINGS (GET)
  ======================= */
  const fetchSettings = async () => {
    try {
      setInitialLoading(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized! Token not found.");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch settings");
      }

      // ✅ Backend returns OBJECT or null
      if (data.data) {
        const s = data.data;

        setSettingId(s._id);
        setIsEditing(false); // view mode

        form.reset({
          faculty: s.faculty ?? false,
          faq: s.faq ?? false,
          feedback: s.feedback ?? false,
          quiz: s.quiz ?? false,
          meeting: s.meeting ?? false,
          question: s.question ?? false,
        });
      } else {
        // ✅ First-time load (no settings)
        setSettingId(null);
        setIsEditing(true); // enable form

        form.reset({
          faculty: false,
          faq: false,
          feedback: false,
          quiz: false,
          meeting: false,
          question: false,
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load settings");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (webinarId) fetchSettings();
  }, [webinarId]);

  /* =======================
     SUBMIT (POST / PUT)
  ======================= */
  const onSubmit = async (data: SettingValues) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized! Token not found.");

      const isCreate = !settingId;

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/webinars/${webinarId}/settings`;
      const method = isCreate ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to save settings");
      }

      toast.success(
        isCreate
          ? "Setting saved successfully!"
          : "Setting updated successfully!",
        { description: getIndianFormattedDate() }
      );

      await fetchSettings(); // refresh + lock form
    } catch (err: any) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SKELETON
  ======================= */
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>

      <Form {...form}>
        <form className="space-y-8">
          {/* ================= TOGGLES ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {settingsList.map(({ key, title, desc }) => (
              <FormField
                key={key}
                control={form.control}
                name={key}
                render={({ field }) => (
                  <Card
                    className={`border rounded-xl shadow-sm transition-colors ${
                      isEditing
                        ? "border-sky-500/60 bg-sky-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-semibold">{title}</h4>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <span
                          className={`font-medium ${
                            field.value
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {field.value ? "Yes" : "No"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              />
            ))}
          </div>

          {/* ================= BUTTON ================= */}
          <div className="flex justify-center">
            {!isEditing ? (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6"
              >
                Edit Setting
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading}
                onClick={form.handleSubmit(onSubmit)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {settingId ? "Update Setting" : "Save Setting"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
