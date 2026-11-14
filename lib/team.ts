import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getTeamContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership, error } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("อ่านข้อมูลทีมไม่สำเร็จ กรุณาตรวจการติดตั้งฐานข้อมูล US-2");
  if (!membership) return { supabase, user, team: null };
  const { data: team, error: teamError } = await supabase.from("teams").select("id,name,owner_id,invite_code").eq("id", membership.team_id).single();
  if (teamError) throw new Error("อ่านข้อมูลทีมไม่สำเร็จ");
  return { supabase, user, team: team as { id: string; name: string; owner_id: string; invite_code: string } };
}
export type Member = { user_id: string; display_name: string; email: string };
export async function getTeamMembers(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string): Promise<Member[]> {
  const { data: memberships, error } = await supabase.from("team_members").select("user_id").eq("team_id", teamId);
  if (error) throw new Error("อ่านรายชื่อสมาชิกไม่สำเร็จ");
  if (!memberships?.length) return [];
  const { data, error: profileError } = await supabase.from("profiles").select("user_id,display_name,email").in("user_id", memberships.map(m => m.user_id)).order("created_at");
  if (profileError) throw new Error("อ่านรายชื่อสมาชิกไม่สำเร็จ");
  return data ?? [];
}
