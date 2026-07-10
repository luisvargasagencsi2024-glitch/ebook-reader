import mongoose, { Schema, type Document } from 'mongoose';

export interface IHighlight extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  page: number;
  location: string;
  text: string;
  color: string;
  createdAt: Date;
}

const highlightSchema = new Schema<IHighlight>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  page: { type: Number, default: 1 },
  location: { type: String, default: '' },
  text: { type: String, required: true },
  color: { type: String, default: '#fef08a' },
  createdAt: { type: Date, default: Date.now },
});

export const Highlight = mongoose.model<IHighlight>('Highlight', highlightSchema);
