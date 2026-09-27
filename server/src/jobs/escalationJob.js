import cron from 'node-cron';
import { Grievance } from '../models/Grievance.js';
import { logAudit } from '../services/auditService.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

export const runEscalationSweep = async () => {
  const now = new Date();
  try {
    // Find grievances that are active, past their dueAt, and not yet resolved or escalated
    const overdueGrievances = await Grievance.find({
      status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
      dueAt: { $lte: now },
    }).populate('student assignedTeacher');

    if (overdueGrievances.length === 0) {
      return { checkedAt: now, escalatedCount: 0 };
    }

    console.log(`[SLA Escalation Engine] Detected ${overdueGrievances.length} overdue grievance(s). Escalating...`);

    let escalatedCount = 0;

    for (const grievance of overdueGrievances) {
      const prevStatus = grievance.status;
      grievance.status = 'ESCALATED';
      grievance.escalatedAt = now;
      await grievance.save();
      escalatedCount++;

      // 1. Audit Log Entry
      await logAudit({
        grievanceId: grievance._id,
        role: 'system',
        action: 'AUTO_ESCALATED_24H',
        details: `Grievance ${grievance.trackingId} exceeded 24-hour resolution SLA (Due: ${grievance.dueAt.toISOString()}). Automatically escalated to administration.`,
        metadata: {
          previousStatus: prevStatus,
          dueAt: grievance.dueAt,
          escalatedAt: now,
        },
      });

      // 2. Notify Administrators
      await notifyAdmins({
        title: `SLA Escalation Alert: ${grievance.trackingId}`,
        message: `Grievance "${grievance.title}" in ${grievance.category} has breached the 24-hour SLA deadline and has been escalated for administrative intervention.`,
        type: 'ESCALATION',
        link: `/admin/grievances/${grievance._id}`,
        grievanceId: grievance._id,
      });

      // 3. Notify Student
      if (grievance.student) {
        await createNotification({
          recipientId: grievance.student._id,
          title: `Grievance Escalated to Administration`,
          message: `Your grievance "${grievance.title}" has exceeded the 24-hour handling period and has been automatically escalated to senior campus administrators for priority resolution.`,
          type: 'ESCALATION',
          link: `/student/grievances/${grievance._id}`,
          grievanceId: grievance._id,
        });
      }

      // 4. Notify Assigned Teacher if assigned
      if (grievance.assignedTeacher) {
        await createNotification({
          recipientId: grievance.assignedTeacher._id,
          title: `SLA Overdue: Grievance Escalated`,
          message: `Grievance "${grievance.title}" (${grievance.trackingId}) exceeded the 24-hour SLA deadline and has been escalated to administration.`,
          type: 'ESCALATION',
          link: `/teacher/grievances/${grievance._id}`,
          grievanceId: grievance._id,
        });
      }
    }

    return { checkedAt: now, escalatedCount };
  } catch (error) {
    console.error('[SLA Escalation Engine Error] Failed to execute escalation sweep:', error.message);
    return { checkedAt: now, error: error.message };
  }
};

/**
 * Initializes cron scheduler
 */
export const startEscalationScheduler = () => {
  const cronExpression = process.env.SLA_CHECK_CRON || '*/15 * * * *';
  console.log(`[Scheduler] Initializing 24h SLA Escalation Worker with schedule: ${cronExpression}`);

  // Run immediately on boot to handle any downtime backlog
  runEscalationSweep();

  // Schedule recurring check
  cron.schedule(cronExpression, async () => {
    console.log('[Scheduler] Executing periodic 24h SLA Escalation check...');
    await runEscalationSweep();
  });
};
