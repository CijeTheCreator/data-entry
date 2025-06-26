import crypto from 'crypto'

export function generateDataHash(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

export function logOperation(operation: string, message: string, metadata?: any) {
  console.log(`[${operation}] ${message}`, metadata ? JSON.stringify(metadata) : '')
}

export function logError(operation: string, error: any, metadata?: any) {
  console.error(`[${operation}] Error:`, error)
  
  // Store in database
  prisma.errorLog.create({
    data: {
      operation,
      error: error.message || String(error),
      metadata: metadata || null,
    },
  }).catch(console.error)
}