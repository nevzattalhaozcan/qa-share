import { Request, Response } from 'express';
import { Note } from '../models/Note';

export const getNotes = async (req: Request, res: Response) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const createNote = async (req: Request, res: Response) => {
    try {
        const newNote = new Note(req.body);
        const note = await newNote.save();
        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await Note.findByIdAndUpdate(id, req.body, { new: true });
        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Note.findByIdAndDelete(id);
        res.json({ msg: 'Note deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
