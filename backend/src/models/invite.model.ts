import mongoose from "mongoose";

interface IInvite {
  code: string;
  used: boolean;
  description?: string;
}
const inviteSchema = new mongoose.Schema<IInvite>({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: false,
  },
});

export const Invite = mongoose.model<IInvite>("Invite", inviteSchema);
