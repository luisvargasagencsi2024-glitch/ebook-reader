import mongoose, { Schema, type Document } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  currentPage: number;
  totalPages: number;
  progress: number;
  location: string;
  lastReadAt: Date;
  readingTimeMinutes: number;
}

const progressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  location: { type: String, default: '' },
  lastReadAt: { type: Date, default: Date.now },
  readingTimeMinutes: { type: Number, default: 0 },
});

progressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const Progress = mongoose.model<IProgress>('Progress', progressSchema);
