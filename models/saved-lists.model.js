const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const savedListSchema = new Schema(
  {
  builderList: [
    {
      product: {
        type: Schema.Types.ObjectId, 
        ref: "LGProductCollection", 
        required: false,
      },
       title: {
          type: String,
          required: false,
        }
    }],
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false, },
  listName: { type: String, required: false },
  listNotes: { type: String, required: false },
}, { timestamps: true });
module.exports = mongoose.model("Saved List", savedListSchema);




// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const savedListSchema = new Schema({
//   builderList: [
//     {
//       product: {
//         type: Schema.Types.ObjectId, 
//         ref: "LGProductCollection", 
//         required: false,
//       },
//     }],
//   userId: { type: Schema.Types.ObjectId, ref: "User", required: false, },
//   listName: { type: String, required: false },
//   listNotes: { type: String, required: false },
// }, { timestamps: true });
// module.exports = mongoose.model("Saved List", savedListSchema);
