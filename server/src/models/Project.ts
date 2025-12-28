import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User collection
    name: { type: String, required: true },
    username: { type: String },
    password: { type: String }, // Optional - only needed for generated team members
    role: { type: String, enum: ['QA', 'DEV'], required: true },
});

const projectPermissionsSchema = new mongoose.Schema({
    devCanViewTestCases: { type: Boolean, default: true },
    devCanCreateTestCases: { type: Boolean, default: false },
    devCanEditTestCases: { type: Boolean, default: false },
    devCanViewBugs: { type: Boolean, default: true },
    devCanCreateBugs: { type: Boolean, default: false },
    devCanEditBugs: { type: Boolean, default: false },
    devCanEditBugStatusOnly: { type: Boolean, default: true },
    devCanViewNotes: { type: Boolean, default: false },
    devCanViewTasks: { type: Boolean, default: true },
    devCanCreateTasks: { type: Boolean, default: false },
    devCanEditTasks: { type: Boolean, default: false },
});

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [teamMemberSchema],
    permissions: { type: projectPermissionsSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
});

export const Project = mongoose.model('Project', projectSchema);
