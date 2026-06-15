import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useSupabase = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

// Polyfill WebSocket for Node.js environments (like Node 20) where it's not defined globally by default,
// to prevent Supabase's Realtime client initialization from throwing an error.
if (useSupabase && typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = class {};
}

const supabase = useSupabase
  ? createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
  : null;

// Use process.cwd()-relative path (/app/backend/uploads) — has write permission in Docker.
// For production persistence, configure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars on Render.
export const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function uploadFile(
  userId: string,
  taskId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const fileExt = path.extname(fileName);
  const uniqueName = `${randomUUID()}${fileExt}`;
  const storagePath = `${userId}/${taskId}/${uniqueName}`;

  if (useSupabase && supabase) {
    const { error } = await supabase.storage
      .from("task-attachments")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("task-attachments")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } else {
    // Local fallback storage
    const taskDir = path.join(LOCAL_UPLOADS_DIR, userId, taskId);
    await fs.mkdir(taskDir, { recursive: true });

    const localFilePath = path.join(taskDir, uniqueName);
    await fs.writeFile(localFilePath, fileBuffer);

    // Return custom local path link
    return `/api/v1/uploads/${userId}/${taskId}/${uniqueName}`;
  }
}
