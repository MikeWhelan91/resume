'use client'
import React from 'react'

export default function A4Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="a4-viewport">
      <div className="a4-page">
        {children}
      </div>
    </div>
  )
}
