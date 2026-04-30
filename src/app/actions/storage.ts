'use server'

import { uploadFile, generateStoragePath, StorageBucket } from '@/lib/storage'
import { getUserSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function uploadFilesAction(
  filesData: { name: string, type: string, base64: string }[],
  bucket: StorageBucket,
  module: string,
  identifier: string
) {
  try {
    const { extendedUser } = await getUserSession()
    if (!extendedUser?.company_id) throw new Error('No autorizado')

    const uploadPromises = filesData.map(async (fileData) => {
      const buffer = Buffer.from(fileData.base64.split(',')[1], 'base64')
      const blob = new Blob([buffer], { type: fileData.type })
      
      const path = generateStoragePath(
        extendedUser.company_id, 
        module, 
        identifier, 
        fileData.name
      )

      return uploadFile(blob, bucket, path)
    })

    const results = await Promise.all(uploadPromises)
    return { success: true, urls: results.map(r => r.publicUrl) }
  } catch (err: any) {
    console.error('[UPLOAD_ACTION_ERROR]:', err.message)
    return { success: false, error: err.message }
  }
}
