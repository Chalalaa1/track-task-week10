"use client";
import { useActionState } from "react";
import { createTask, updateTaskStatus } from "./actions";
import { statusLabels, taskStatuses, type Task } from "@/lib/tasks";

const fieldClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3";
function Feedback({ error, success }: { error: string; success: string }) {
  return <>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}{success && <p role="status" className="text-sm text-green-800">{success}</p>}</>;
}
export function CreateTaskForm({ members }: { members: { user_id: string; display_name: string }[] }) {
  const [state, action, pending] = useActionState(createTask, { error: "", success: "" });
  return <form action={action} className="mt-6 space-y-4 rounded-2xl border bg-white p-6">
    <h2 className="text-xl font-semibold">สร้างงาน</h2>
    <fieldset disabled={pending} className="grid min-w-0 gap-4 md:grid-cols-2">
      <label className="block md:col-span-2">ชื่องาน (จำเป็น)<input name="title" className={fieldClass} /></label>
      <label className="block md:col-span-2">รายละเอียด<textarea name="description" rows={3} className={fieldClass} /></label>
      <label className="block min-w-0">วันกำหนดส่ง<input name="due_date" type="date" className={`${fieldClass} min-w-0 max-w-full`} /></label>
      <label className="block min-w-0">ผู้รับงาน<select name="assignee_id" defaultValue="" className={fieldClass} required><option value="" disabled>เลือกสมาชิกในทีม</option>{members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label>
    </fieldset>
    <Feedback {...state} />
    <button disabled={pending || members.length === 0} className="rounded-lg bg-blue-700 px-4 py-3 text-white disabled:opacity-60">{pending ? "กำลังสร้างงาน…" : "สร้างงาน"}</button>
  </form>;
}

export function StatusForm({ task }: { task: Task }) {
  const [state, action, pending] = useActionState(updateTaskStatus, { error: "", success: "" });
  return <form action={action} className="mt-4 space-y-2 border-t pt-3">
    <input type="hidden" name="task_id" value={task.id} />
    <label className="block text-sm">สถานะงาน<select aria-label={`สถานะงาน ${task.title}`} name="status" defaultValue={task.status} disabled={pending} className={fieldClass}>{taskStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
    <button disabled={pending} className="rounded-lg border border-blue-700 px-3 py-2 text-sm text-blue-800 disabled:opacity-60">{pending ? "กำลังบันทึก…" : "บันทึกสถานะ"}</button>
    <Feedback {...state} />
  </form>;
}
