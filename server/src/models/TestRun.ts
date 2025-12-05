import mongoose from 'mongoose';

const testRunSchema = new mongoose.Schema({
    runId: {
        type: String,
        required: true,
        unique: true,
    },
    testCaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestCase',
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pass', 'Fail'],
        required: true,
    },
    runDateTime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
testRunSchema.index({ testCaseId: 1, runDateTime: -1 });
testRunSchema.index({ projectId: 1 });

export const TestRun = mongoose.model('TestRun', testRunSchema);
