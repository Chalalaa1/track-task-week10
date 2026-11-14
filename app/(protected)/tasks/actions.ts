"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidDate, taskStatuses, type TaskStatus } from "@/lib/tasks";

export type TaskFormState = { error: string; success: string };
const fail = (error: string): TaskFormState => ({ error, success: "" });

export async function createTask(_: TaskFormState, form: FormData): Promise<TaskFormState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail("กรุณาเข้าสู่ระบบใหม่");
    const { data: membership, error: memberError } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (memberError) return fail("อ่านข้อมูลทีมไม่สำเร็จ กรุณาลองใหม่");
    if (!membership) return fail("กรุณาสร้างหรือเข้าร่วมทีมก่อน");
    const { data: team } = await supabase.from("teams").select("owner_id").eq("id", membership.team_id).single();
    if (!team || team.owner_id !== user.id) return fail("เฉพาะหัวหน้าทีมเท่านั้นที่สร้างงานได้");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const dueDate = String(form.get("due_date") ?? "").trim();
    const assigneeId = String(form.get("assignee_id") ?? "");
    if (!title) return fail("กรุณากรอกชื่องาน");
    if (dueDate && !isValidDate(dueDate)) return fail("กรุณาระบุวันกำหนดส่งให้ถูกต้อง");
    const { data: assignee, error: assigneeError } = await supabase.from("team_members").select("user_id").eq("team_id", membership.team_id).eq("user_id", assigneeId).maybeSingle();
    if (assigneeError || !assignee) return fail("กรุณาเลือกผู้รับงานที่เป็นสมาชิกในทีมเท่านั้น");
    const { error } = await supabase.from("tasks").insert({ team_id: membership.team_id, title, description: description || null, due_date: dueDate || null, assignee_id: assigneeId, created_by: user.id });
    if (error) return fail(error.code === "23503" ? "กรุณาเลือกผู้รับงานที่เป็นสมาชิกในทีมเท่านั้น" : "สร้างงานไม่สำเร็จ กรุณาลองใหม่");
  } catch {
    return fail("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่");
  }
  revalidatePath("/tasks");
  return { error: "", success: "สร้างงานสำเร็จ" };
}

export async function updateTaskStatus(_: TaskFormState, form: FormData): Promise<TaskFormState> {
  const status = String(form.get("status") ?? "");
  const taskId = String(form.get("task_id") ?? "");
  if (!taskStatuses.includes(status as TaskStatus)) return fail("สถานะงานไม่ถูกต้อง");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail("กรุณาเข้าสู่ระบบใหม่");
    // RLS checks team and role; selecting the result detects a denied zero-row update.
    const { data, error } = await supabase.from("tasks").update({ status }).eq("id", taskId).select("id");
    if (error || !data?.length) return fail("บันทึกไม่สำเร็จ คุณอาจไม่มีสิทธิ์เปลี่ยนสถานะงานนี้ กรุณาโหลดหน้าใหม่");
  } catch {
    return fail("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่");
  }
  revalidatePath("/tasks");
  return { error: "", success: "อัปเดตสถานะสำเร็จ" };
}
