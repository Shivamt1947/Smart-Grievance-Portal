import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'ALERT',
  link,
  grievanceId = null,
}) => {
  try {
    return await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
      grievance: grievanceId,
    });
  } catch (error) {
    console.error('[Notification Error] Failed to create notification:', error.message);
    return null;
  }
};

export const notifyAdmins = async ({
  title,
  message,
  type = 'ESCALATION',
  link,
  grievanceId = null,
}) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      title,
      message,
      type,
      link,
      grievance: grievanceId,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('[Notification Error] Failed to notify admins:', error.message);
  }
};
