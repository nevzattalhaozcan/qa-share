import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    tags: [{ type: String }],
    additionalInfo: { type: String },
    attachments: [{ type: String }],
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Task = mongoose.model('Task', taskSchema);
