'use client'
import React from 'react'

const A4 = { wpx: 794, hpx: 1123 }
const SCALE = 0.55

export default function PreviewFrame({ htmlDoc }) {
  const iframeStyle = {
    width: A4.wpx,
    height: A4.hpx,
    border: 0,
    background: 'transparent',
    transform: `scale(${SCALE})`,
    transformOrigin: 'top left'
  }
  const wrapperStyle = {
    width: A4.wpx * SCALE,
    height: A4.hpx * SCALE,
    overflow: 'hidden'
  }
  return (
    <div style={wrapperStyle}>
      <iframe style={iframeStyle} srcDoc={htmlDoc} />
    </div>
  )
}
