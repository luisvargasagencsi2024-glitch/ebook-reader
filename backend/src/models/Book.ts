import mongoose, { Schema, type Document } from 'mongoose';

export interface IBook extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  fileUrl: string;
  format: 'epub' | 'pdf';
  createdAt: Date;
}

const bookSchema = new Schema<IBook>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  author: { type: String, default: '' },
  description: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  format: { type: String, enum: ['epub', 'pdf'], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Book = mongoose.model<IBook>('Book', bookSchema);
