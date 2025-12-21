'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import 'react-quill-new/dist/quill.snow.css'

// 👇 Updated import
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: string
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Type details here...',
  height = '300px',
}: RichTextEditorProps) {
  const [content, setContent] = useState(value)

  useEffect(() => setContent(value), [value])

  const handleChange = (html: string) => {
    setContent(html)
    onChange?.(html)
  }

  // Full-featured toolbar
  const modules = {
    toolbar: [
      [{ font: [] }], // font family
      [{ size: ['small', false, 'large', 'huge'] }], // font size
      [{ header: [1, 2, 3, 4, 5, 6, false] }], // headers
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code'], // text styles
      [{ color: [] }, { background: [] }], // text color & background
      [{ align: [] }], // alignment
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ], // lists & indentation
    ],
  }

  const formats = [
    'font',
    'size',
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'formula',
    'emoji',
    'highlight',
  ]

  return (
    <div
      className="custom-quill rounded-lg bg-background dark:bg-gray-900"
      style={{ height }}
    >
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-full"
      />
    </div>
  )
}
