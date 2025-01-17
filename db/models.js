import mongoose from "mongoose";

const filterSchema = mongoose.Schema({
  name : {
    type: [String],
    required: true,
    unique: true
  },
  contant : {
    type: String,
  },
  buttons: [{}]
}, {timestamps: true});

const Filter = mongoose.model("Filter", filterSchema);

export {Filter};