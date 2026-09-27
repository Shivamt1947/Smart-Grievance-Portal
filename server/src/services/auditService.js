import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  grievanceId = null,
  userId = null,
  role = 'system',
  action,
  details,
  metadata = {},
  ipAddress = '',
}) => {
  try {
    await AuditLog.create({
      grievance: grievanceId,
      user: userId,
      role,
      action,
      details,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error('[Audit Log Error] Failed to write audit record:', error.message);
  }
};
