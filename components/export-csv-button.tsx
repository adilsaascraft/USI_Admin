'use client'

import { Button } from '@/components/ui/button'
import { exportToCsv } from '@/lib/exportCsv'

type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

interface ExportCsvButtonProps<T> {
  fileName: string
  data: T[]
  columns: CsvColumn<T>[]
  disabled?: boolean
}

export function ExportCsvButton<T>({
  fileName,
  data,
  columns,
  disabled,
}: ExportCsvButtonProps<T>) {
  return (
    <Button
      variant="outline"
      disabled={disabled || !data.length}
      onClick={() =>
        exportToCsv({
          fileName,
          data,
          columns,
        })
      }
    >
      Export CSV
    </Button>
  )
}
