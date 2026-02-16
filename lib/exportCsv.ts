type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

interface ExportCsvOptions<T> {
  fileName: string
  data: T[]
  columns: CsvColumn<T>[]
}

export function exportToCsv<T>({
  fileName,
  data,
  columns,
}: ExportCsvOptions<T>) {
  if (!data.length) return

  const headers = columns.map((c) => `"${c.header}"`).join(',')

  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = c.value(row)
        return `"${val ?? ''}"`
      })
      .join(','),
  )

  const csv = [headers, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}
