"use client";

import { refreshTokenClient } from "./refreshTokenClient";

export async function fetchClient(
  url: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // 🔁 Try refresh on 401
  if (response.status === 401) {
    const refreshed = await refreshTokenClient();
    if (refreshed) {
      const newToken = localStorage.getItem("token");
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
      }

      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Request failed");
  }

  return response;
}
