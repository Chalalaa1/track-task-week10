import { redirect } from "next/navigation";
import { getTeamContext, getTeamMembers } from "@/lib/team";
import { bangkokDate, isOverdue, thaiDate, taskStatuses, statusLabels, type Task } from "@/lib/tasks";
import { CreateTaskForm, StatusForm } from "./task-forms";

export default async function TasksPage() {
  const { supabase, user, team } = await getTeamContext();
  if (!team) redirect("/team");
  const [members, { data, error }] = await Promise.all([
    getTeamMembers(supabase, team.id),
    supabase.from("tasks").select("id,title,description,due_date,assignee_id,status").eq("team_id", team.id).order("created_at", { ascending: false }).order("id"),
  ]);
  if (error) throw new Error("อ่านข้อมูลงานไม่สำเร็จ");
  const tasks = (data ?? []) as Task[];
  const owner = team.owner_id === user.id;
  const today = bangkokDate();
  return <main className="mx-auto w-full max-w-7xl px-4 py-10">
    <h1 className="text-2xl font-bold">งานของทีม</h1><p className="mt-2 break-words text-slate-600">{team.name}</p>
    {owner && <CreateTaskForm members={members.map(({ user_id, display_name }) => ({ user_id, display_name }))} />}
    {!tasks.length && <p role="status" className="mt-6 rounded-xl border bg-white p-6">ยังไม่มีงานในทีม</p>}
    <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">{taskStatuses.map(status => <section key={status} className="min-w-0 rounded-2xl bg-slate-100 p-4" aria-label={statusLabels[status]}>
      <h2 className="mb-4 text-lg font-semibold">{statusLabels[status]} <span className="text-slate-500">({tasks.filter(t => t.status === status).length})</span></h2>
      <div className="space-y-4">{tasks.filter(t => t.status === status).map(task => <article key={task.id} className="min-w-0 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="break-words font-semibold">{task.title}</h3>
        {task.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{task.description}</p>}
        <p className="mt-3 break-words text-sm">ผู้รับงาน: {members.find(m => m.user_id === task.assignee_id)?.display_name ?? "ไม่พบชื่อสมาชิก"}</p>
        <p className="mt-1 text-sm">กำหนดส่ง: {thaiDate(task.due_date)}</p>
        {isOverdue(task, today) && <span className="mt-3 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">เลยกำหนด</span>}
        {(owner || task.assignee_id === user.id) && <StatusForm key={`${task.id}-${task.status}`} task={task} />}
      </article>)}{!tasks.some(t => t.status === status) && <p className="text-sm text-slate-600">ไม่มีงานในสถานะนี้</p>}</div>
    </section>)}</div>
  </main>;
}
