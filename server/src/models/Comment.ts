import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    resolved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const Comment = mongoose.model('Comment', commentSchema);
