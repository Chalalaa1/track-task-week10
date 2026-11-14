"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TeamFormState = { error: string; success: string };
export async function saveTeam(_: TeamFormState, form: FormData): Promise<TeamFormState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "กรุณาเข้าสู่ระบบใหม่", success: "" };
    const mode = form.get("mode");
    const value = String(form.get("value") ?? "").trim();
    if (mode !== "create" && mode !== "join") return { error: "คำขอไม่ถูกต้อง", success: "" };
    const { error } = mode === "create"
      ? await supabase.rpc("create_team", { team_name: value })
      : await supabase.rpc("join_team", { code: value });
    if (error) {
      const messages: Record<string, string> = { ALREADY_IN_TEAM: "คุณมีทีมอยู่แล้ว", TEAM_NAME_REQUIRED: "กรุณากรอกชื่อทีม", INVITE_NOT_FOUND: "ไม่พบทีมจากรหัสนี้" };
      return { error: messages[error.message] ?? "ทำรายการไม่สำเร็จ กรุณาตรวจการเชื่อมต่อและลองใหม่", success: "" };
    }
  } catch {
    return { error: "เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่", success: "" };
  }
  revalidatePath("/team");
  revalidatePath("/tasks");
  return { error: "", success: "บันทึกทีมสำเร็จ" };
}
