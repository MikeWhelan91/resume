'use client'
import React from 'react'
const A4 = { wpx: 794, hpx: 1123 }

export default function PreviewFrame({ htmlDoc }) {
  const style = {
    width: A4.wpx,
    height: A4.hpx,
    border: 0,
    background: 'transparent'
  }
  return <iframe style={style} srcDoc={htmlDoc} />
}
