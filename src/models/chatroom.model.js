const { version } = require("chai");
const mongoose = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId;

const chatRoomSchema = mongoose.Schema(
  {
    participants: [
      {
        type: objectId,
        required: true,
        ref: "users",
      },
    ],
    type: {
      type: String,
      required: true,
      default: "single",
    },
    groupName: {
      type: String,
      default: null,
    },
    groupImage: {
      type: String,
      default: null,
    },
    groupDescription: {
      type: String,
      default: null,
    },
    lastMessage: {
      type: String,
      default: null,
      ref: "chat",
    },
    lastMessageBy: {
      type: objectId,
      ref: "users",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: objectId,
      default: null,
    },
    isRoomActive: {
      type: Boolean,
      default: true, // room active
    },
    isDealCompleted: {
      type: Boolean,
      default: false, // deal completed
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
  {
    collection: "chatRoom",
  }
);

module.exports = mongoose.model("chatRoom", chatRoomSchema);
