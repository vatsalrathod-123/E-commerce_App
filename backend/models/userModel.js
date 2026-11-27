import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Optional. Only set when the user chooses one at sign up.
    // sparse: users without a username don't clash with each other.
    username: { type: String, unique: true, sparse: true, default: undefined },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    resetToken: { type: String, default: "" },
    resetTokenExpiry: { type: Number, default: 0 },
  },
  { minimize: false },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
