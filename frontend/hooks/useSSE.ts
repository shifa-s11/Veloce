import { useEffect } from "react";
import { useSWRConfig } from "swr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function useSSE(enabled: boolean = true) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!enabled) return;

    const eventSource = new EventSource(`${API_URL}/events`, {
      withCredentials: true,
    });

    eventSource.addEventListener("connected", (event: any) => {
      console.log("⚡ SSE connected:", event.data);
    });

    const triggerRevalidation = () => {
      // Revalidate all keys starting with /tasks or matching tasks query
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
  }, [enabled, mutate]);
}
