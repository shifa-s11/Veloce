import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { useAuthStore } from "../lib/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function useSSE(enabled: boolean = true) {
  const { mutate } = useSWRConfig();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    // EventSource can't send Authorization headers (browser limitation).
    // Passing the short-lived accessToken as a query param is the standard SSE auth pattern.
    const url = `${API_URL}/events?token=${encodeURIComponent(accessToken)}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("connected", (event: any) => {
      console.log("⚡ SSE connected:", event.data);
    });

    const triggerRevalidation = () => {
      mutate((key) => typeof key === "string" && key.startsWith("/tasks"));
    };

    eventSource.addEventListener("task:created", triggerRevalidation);
    eventSource.addEventListener("task:updated", triggerRevalidation);
    eventSource.addEventListener("task:deleted", triggerRevalidation);

    eventSource.onerror = () => {
      // EventSource handles reconnection automatically
    };

    return () => {
      eventSource.close();
    };
  }, [enabled, mutate, accessToken]);
}
