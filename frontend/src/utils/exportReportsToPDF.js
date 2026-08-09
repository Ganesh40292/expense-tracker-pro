import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const DEFAULT_OPTIONS = {
  margin: 12,
  filename: 'expense-tracker-report.pdf',
  imageType: 'image/png',
  imageQuality: 1,
  scale: 2,
}

/**
 * Exports the given DOM node to PDF using html2canvas + jsPDF.
 *
 * @param {HTMLElement} node
 * @param {object} options
 */
export async function exportNodeToPDF(node, options = {}) {
  if (!node) throw new Error('exportNodeToPDF: node is required')

  const { margin, filename, scale, imageType } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  // Render node to a canvas
  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    backgroundColor: '#0b0f1a',
  })

  const imgData = canvas.toDataURL(imageType)

  // Create PDF sized for A4
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Scale image to fit page width
  const imgProps = pdf.getImageProperties(imgData)
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width

  // If it overflows, we add pages by slicing vertically
  const totalHeight = imgHeight
  const remainingHeight = totalHeight

  if (remainingHeight <= pageHeight - margin * 2) {
    pdf.addImage(
      imgData,
      imageType,
      margin,
      margin,
      imgWidth,
      imgHeight,
    )
    pdf.save(filename)
    return
  }

  // Multi-page: draw the same image with vertical offsets.
  // We do this by creating a temp canvas slice.
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height

  const pageImageHeight = Math.floor(
    ((pageHeight - margin * 2) / imgHeight) * canvasHeight,
  )

  let y = 0
  let pageIndex = 0

  while (y < canvasHeight) {
    pageIndex += 1

    const sliceHeight = Math.min(pageImageHeight, canvasHeight - y)

    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvasWidth
    sliceCanvas.height = sliceHeight

    const ctx = sliceCanvas.getContext('2d')
    ctx.drawImage(
      canvas,
      0,
      y,
      canvasWidth,
      sliceHeight,
      0,
      0,
      canvasWidth,
      sliceHeight,
    )

    const sliceData = sliceCanvas.toDataURL(imageType)

    const sliceImgHeight = (sliceHeight * imgWidth) / canvasWidth

    if (pageIndex > 1) pdf.addPage()

    pdf.addImage(
      sliceData,
      imageType,
      margin,
      margin,
      imgWidth,
      sliceImgHeight,
    )

    y += sliceHeight
  }

  pdf.save(filename)
}

