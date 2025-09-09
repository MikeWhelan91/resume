'use client'
import React from 'react'
export default function PreviewFrame({ htmlDoc, className }) {
  return <iframe className={className || 'A4Preview'} srcDoc={htmlDoc} />
}
