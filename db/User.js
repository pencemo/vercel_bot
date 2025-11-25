import mongoose from "mongoose";

// Define a schema for storing users
const UserSchema = new mongoose.Schema({
    chatId: { type: Number, required: true, unique: true },
    username: { type: String },
    firstName: String,
    lastName: String,
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isBan: { type: Boolean, default: false },
    mode: {type: String, default: "filter"},
  });
  
  const User = mongoose.model("User", UserSchema);

  export default User;