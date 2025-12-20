// lib/refreshTokenClient.ts
"use client";

export async function refreshTokenClient(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh-token`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json();

    if (data?.accessToken) {
      // ✅ keep token key consistent
      localStorage.setItem("token", data.accessToken);
      return true;
    }

    return false;
  } catch {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return false;
  }
}
