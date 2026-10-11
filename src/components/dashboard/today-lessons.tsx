import Link from "next/link"
import { Clock } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  exceptionTypeLabel,
  exceptionTypeVariant,
  lessonKindLabel,
} from "@/lib/format"
import { getStudentIdsForDate } from "@/lib/lessons"
import type { Lesson, Student } from "@/type"

interface TodayLessonsProps {
  lessons: Lesson[]
  studentMap: Record<string, Student>
  date: string
}

export function TodayLessons({
  lessons,
  studentMap,
  date,
}: TodayLessonsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 수업</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {lessons.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            오늘 예정된 수업이 없습니다.
          </p>
        ) : (
          lessons.map((lesson) => {
            const names = getStudentIdsForDate(lesson, date)
              .map((id) => studentMap[id]?.name)
              .filter(Boolean)
              .join(", ")
            return (
              <div
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    {lesson.kind === "exception" ? (
                      <Badge
                        variant={exceptionTypeVariant(lesson.exceptionType)}
                      >
                        {exceptionTypeLabel[lesson.exceptionType]}
                      </Badge>
                    ) : (
                      <Badge variant="muted">{lessonKindLabel.regular}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    {lesson.time || "시간 없음"}
                  </div>
                  <p className="mt-0.5 font-medium">{lesson.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {names || "배정 학생 없음"}
                  </p>
                </div>
                <Link
                  href="/attendance"
                  className={buttonVariants({
                    variant: "outline",
                    className: "h-10 px-4",
                  })}
                >
                  출석 입력
                </Link>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
