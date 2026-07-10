import mongoose, { Schema, type Document } from 'mongoose';

export interface INote extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  page: number;
  location: string;
  text: string;
  content: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  page: { type: Number, default: 1 },
  location: { type: String, default: '' },
  text: { type: String, default: '' },
  content: { type: String, required: true },
  color: { type: String, default: '#fef08a' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Note = mongoose.model<INote>('Note', noteSchema);
