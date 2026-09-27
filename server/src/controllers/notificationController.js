import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '15', 10)));
  const skip = (page - 1) * limit;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    Notification.countDocuments({ recipient: req.user._id }),
  ]);

  return res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }

  notification.isRead = true;
  await notification.save();

  return res.status(200).json({
    success: true,
    notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
