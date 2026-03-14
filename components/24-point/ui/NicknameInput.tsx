'use client'

import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

interface NicknameInputProps {
  open: boolean
  onSubmit: (nickname: string) => void
  initialValue?: string
}

export default function NicknameInput({ open, onSubmit, initialValue = '' }: NicknameInputProps) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed && trimmed.length >= 1 && trimmed.length <= 12) {
      onSubmit(trimmed)
    }
  }

  return (
    <Modal open={open} title="设定你的昵称" closable={false}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-gray-500 text-sm text-center -mt-2">
          给自己取一个酷炫的昵称吧
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="请输入昵称（1-12个字符）"
          maxLength={12}
          autoFocus
          className="
            w-full px-4 py-3 rounded-xl
            bg-gray-50 border border-gray-200
            text-gray-800 text-center text-lg font-medium
            placeholder:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent
            transition-all duration-200
          "
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!value.trim() || value.trim().length > 12}
        >
          确认
        </Button>
      </form>
    </Modal>
  )
}
