import React from 'react'
import { pdf } from '@react-pdf/renderer'

export async function renderReactPdf({ module, model }){
  // module should export a function like: export const DocumentFor = (model) => <Document>...</Document>
  const Doc = module.DocumentFor || module.default
  const instance = pdf(<Doc model={model} />)
  const buf = await instance.toBuffer()
  return buf
}
