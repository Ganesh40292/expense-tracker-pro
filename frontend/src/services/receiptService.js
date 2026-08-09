import api from './api'

export const uploadReceipt = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/receipts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const analyzeReceipt = async (id, rawText) => {
  const response = await api.post(`/receipts/${id}/analyze`, { rawText })
  return response.data
}

export const getReceipts = async () => {
  const response = await api.get('/receipts')
  return response.data
}

export const getReceiptById = async (id) => {
  const response = await api.get(`/receipts/${id}`)
  return response.data
}

export const deleteReceipt = async (id) => {
  const response = await api.delete(`/receipts/${id}`)
  return response.data
}

export const getReceiptImageBlob = async (id) => {
  const response = await api.get(`/receipts/${id}/image`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data)
}

export const linkReceipt = async (id, transactionId) => {
  const response = await api.post(`/receipts/${id}/link/${transactionId}`)
  return response.data
}

export const unlinkReceipt = async (id) => {
  const response = await api.post(`/receipts/${id}/unlink`)
  return response.data
}
