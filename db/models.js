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
  fileId: {
    type: String,
  },
  entities: {
    type: [{}],
  },
  buttons: [{}]
}, {timestamps: true});

const Filter = mongoose.model("Filter", filterSchema);

export {Filter};