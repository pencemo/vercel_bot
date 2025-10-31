import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true, required: true },
  slugs: [String],
  uploaderId: Number,
  createdAt: { type: Date, default: Date.now }
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;