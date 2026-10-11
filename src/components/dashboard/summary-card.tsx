import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

interface SummaryCardProps {
  label: string
  value: number
  unit: string
  icon: LucideIcon
  highlight?: boolean
}

export function SummaryCard({
  label,
  value,
  unit,
  icon: Icon,
  highlight,
}: SummaryCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon
          className={
            highlight && value > 0
              ? "size-5 text-destructive"
              : "size-5 text-primary"
          }
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </Card>
  )
}
