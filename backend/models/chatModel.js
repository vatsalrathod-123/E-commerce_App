import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true },
    // "user:<userId>" for logged-in users, "guest:<guestId>" for guests
    ownerKey: { type: String, required: true, index: true },
    messages: { type: [messageSchema], default: [] },
    // Document is deleted automatically once this time has passed (TTL index)
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB removes documents after expiresAt (checked about once a minute)
chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
chatSchema.index({ ownerKey: 1, updatedAt: -1 });

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema);

export default chatModel;
