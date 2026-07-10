import mongoose, { Schema, type Document } from 'mongoose';

export type SummaryScope = 'full' | 'chapter' | 'progress';

export interface ISummary extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  scope: SummaryScope;
  content: string;
  createdAt: Date;
}

const summarySchema = new Schema<ISummary>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  scope: { type: String, enum: ['full', 'chapter', 'progress'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

summarySchema.index({ userId: 1, bookId: 1, scope: 1 });

export const Summary = mongoose.model<ISummary>('Summary', summarySchema);
