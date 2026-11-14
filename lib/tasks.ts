export const taskStatuses = ["todo", "doing", "done"] as const;
export type TaskStatus = typeof taskStatuses[number];
export const statusLabels: Record<TaskStatus, string> = { todo: "ยังไม่เริ่ม", doing: "กำลังทำ", done: "เสร็จแล้ว" };
export type Task = { id: string; title: string; description: string | null; due_date: string | null; assignee_id: string; status: TaskStatus };

export function bangkokDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function isOverdue(task: Pick<Task, "due_date" | "status">, today: string) {
  return Boolean(task.due_date && task.due_date < today && task.status !== "done");
}
export function thaiDate(date: string | null) {
  return date ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(`${date}T00:00:00+07:00`)) : "ไม่มีกำหนด";
}
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
