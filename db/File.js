import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  chatId: { type: String, required: true },
  messageId: { type: Number, required: true },
  uploaderId: { type: Number },
  fileName: { type: String },
  caption: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model("File", fileSchema);
export default File;