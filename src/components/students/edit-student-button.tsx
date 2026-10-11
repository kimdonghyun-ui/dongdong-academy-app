"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/students/student-form"
import { useStudentStore } from "@/store/studentStore"
import type { Student } from "@/type"

export function EditStudentButton({ student }: { student: Student }) {
  const [open, setOpen] = useState(false)
  const updateStudent = useStudentStore((s) => s.updateStudent)

  return (
    <>
      <Button variant="outline" className="h-10 px-4" onClick={() => setOpen(true)}>
        <Pencil />
        수정
      </Button>
      <StudentForm
        open={open}
        onOpenChange={setOpen}
        initial={student}
        onSubmit={async (next) => {
          await updateStudent(next)
          setOpen(false)
        }}
      />
    </>
  )
}
