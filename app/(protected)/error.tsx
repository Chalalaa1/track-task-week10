"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl p-6"><h1 className="text-xl font-bold">โหลดข้อมูลไม่สำเร็จ</h1><p className="my-4">กรุณาตรวจการเชื่อมต่อแล้วลองใหม่</p><button onClick={reset} className="rounded-lg bg-blue-700 px-4 py-2 text-white">ลองใหม่</button></main>;
}
