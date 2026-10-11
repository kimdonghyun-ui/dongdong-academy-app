"use client"

import { NoticeEditor } from "@/components/notices/notice-editor"
import { useSettingsStore } from "@/store/settingsStore"
import { useStudentStore } from "@/store/studentStore"

export default function NoticesPage() {
  const settings = useSettingsStore((s) => s.settings)
  const students = useStudentStore((s) => s.students)

  // 안내문은 수강 중 학생만 수신 대상으로 노출
  const activeStudents = students.filter((s) => s.status === "active")

  return (
    <NoticeEditor
      students={activeStudents}
      academyName={settings.academyName}
      noticeFooter={settings.noticeFooter}
    />
  )
}
