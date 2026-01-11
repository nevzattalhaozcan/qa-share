import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    stepsToReproduce: {
        type: String,
        required: function (this: any) {
            return this.status !== 'Draft';
        }
    },
    testData: { type: String },
    expectedResult: { type: String },
    actualResult: { type: String },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: { type: String, enum: ['Draft', 'Opened', 'Fixed', 'Closed'], default: 'Draft' },
    tags: [{ type: String }],
    linkedTestCaseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }],
    linkedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    attachments: [{ type: String }],
    friendlyId: { type: String },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Bug = mongoose.model('Bug', bugSchema);
