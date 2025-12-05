import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    preconditions: { type: String },
    steps: { 
        type: String, 
        required: function(this: any) {
            return this.status !== 'Draft';
        }
    },
    expectedResult: { 
        type: String, 
        required: function(this: any) {
            return this.status !== 'Draft';
        }
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Draft', 'Todo', 'In Progress', 'Pass', 'Fail'], default: 'Draft' },
    tags: [{ type: String }],
    friendlyId: { type: String },
    linkedBugIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bug' }],
    createdBy: { type: String }, // Storing ID or Name
    createdAt: { type: Date, default: Date.now },
});

export const TestCase = mongoose.model('TestCase', testCaseSchema);
