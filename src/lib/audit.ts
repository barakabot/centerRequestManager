import { db } from '@/lib/db'

export async function createAuditLog(params: {
  userId: string
  action: string
  entity: string
  entityId?: string
  details?: string
  ipAddress?: string
}) {
  return db.auditLog.create({ data: params })
}
