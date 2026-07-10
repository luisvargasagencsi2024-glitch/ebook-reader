import mongoose, { Schema, type Document } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  page: number;
  location: string;
  label: string;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  page: { type: Number, default: 1 },
  location: { type: String, default: '' },
  label: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
