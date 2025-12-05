import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: { type: String, enum: ['bug_created', 'bug_status_changed', 'comment_added'], required: true },
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug' },
    bugTitle: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model('Notification', notificationSchema);
