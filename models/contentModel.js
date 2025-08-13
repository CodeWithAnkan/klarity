const mongoose = require('mongoose')

const contentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Space',
    },
    url: { type: String, required: true },
    title: { type: String },
    summary: { type: String },
    text: { type: String },
    tags: { type: [String] },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    failureReason: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Content', contentSchema)
