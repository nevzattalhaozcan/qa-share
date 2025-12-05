import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    type: { type: String, enum: ['simple', 'kv'], required: true },
    label: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Note = mongoose.model('Note', noteSchema);
