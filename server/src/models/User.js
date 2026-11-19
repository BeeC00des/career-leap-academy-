import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export const TRACKS = {
  data: 'Data, BI & AI Productivity',
  it: 'IT Systems Administration',
  product: 'Product, Project & Business Operations',
  marketing: 'Digital Marketing & Growth',
};

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, default: 'Task' },
  due: Date,
  done: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    track: { type: String, enum: Object.keys(TRACKS), default: 'data' },
    cohortStart: { type: Date, default: Date.now },
    durationWeeks: { type: Number, default: 16 },
    tasks: [taskSchema],
    weeklyHours: { type: [Number], default: [] },
    passwordChangedAt: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Creates a random reset token, stores only its SHA-256 hash, returns the raw token. */
userSchema.methods.createResetToken = function createResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return raw;
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    track: this.track,
    trackName: TRACKS[this.track],
    cohortStart: this.cohortStart,
    durationWeeks: this.durationWeeks,
  };
};

export default mongoose.model('User', userSchema);
