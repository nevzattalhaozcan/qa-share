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

const taskBoardSettingsSchema = new mongoose.Schema({
    columns: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        status: { type: String, required: true },
    }],
    visibleFields: {
        priority: { type: Boolean, default: true },
        tags: { type: Boolean, default: true },
        assignee: { type: Boolean, default: true },
        dueDate: { type: Boolean, default: true },
    }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [teamMemberSchema],
    permissions: { type: projectPermissionsSchema, default: () => ({}) },
    taskBoardSettings: {
        type: taskBoardSettingsSchema,
        default: () => ({
            columns: [
                { id: 'todo', title: 'To Do', status: 'To Do' },
                { id: 'doing', title: 'Doing', status: 'In Progress' },
                { id: 'done', title: 'Done', status: 'Done' },
            ],
            visibleFields: {
                priority: true,
                tags: true,
                assignee: true,
                dueDate: true,
            }
        })
    },
    createdAt: { type: Date, default: Date.now },
});

export const Project = mongoose.model('Project', projectSchema);
