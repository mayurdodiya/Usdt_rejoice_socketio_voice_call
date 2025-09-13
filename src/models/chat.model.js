const mongoose = require("mongoose");
const { CHAT_MSG_TYPE } = require("../utils/constant");
const objectId = mongoose.Schema.Types.ObjectId;
const chatSchema = mongoose.Schema(
  {
    sender: {
      type: objectId,
      required: true,
      ref: "users",
    },
    receiver: [
      {
        type: objectId,
        required: true,
        ref: "users",
      },
    ],
    chatRoomId: {
      type: objectId,
      required: true,
      ref: "chatrooms",
    },
    message: {
      type: String, // text message and urls
      required: true,
    },
    deliverd: [
      {
        type: objectId,
        default: [],
        ref: "users",
      },
    ],
    read: [
      {
        type: objectId,
        ref: "users",
        default: [],
      },
    ],
    type: {
      type: String,
      default: "single",
    },
    msgType: {
      type: String,
      enum: [CHAT_MSG_TYPE.TEXT, CHAT_MSG_TYPE.IMAGE, CHAT_MSG_TYPE.VIDEO, CHAT_MSG_TYPE.AUDIO, CHAT_MSG_TYPE.FILE, CHAT_MSG_TYPE.VOICE_CALL],
      default: CHAT_MSG_TYPE.TEXT,
    },
    replyTo: {
      type: objectId,
      ref: "chat",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
  {
    collection: "chat",
  }
);

module.exports = mongoose.model("chat", chatSchema);
