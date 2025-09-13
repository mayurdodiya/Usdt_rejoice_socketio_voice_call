// validations/socketValidation.js
const Joi = require("joi");
const { CHAT_MSG_TYPE } = require("../utils/constant");
const objectId = Joi.string().length(24).hex().trim().message("id must be a valid MongoDB ObjectId");

const createRoom = Joi.object({
  receiverId: objectId.required(),
});

const chatHistory = Joi.object({
  chatRoomId: objectId.required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).default(10),
});

const sendMessage = Joi.object({
  chatRoomId: objectId.required(),
  message: Joi.string().min(1).trim().optional().allow(""),
  type: Joi.string().trim().valid("single", "group").default("single"),
  replyTo: objectId.optional(),
  msgType: Joi.string().trim().valid(CHAT_MSG_TYPE.TEXT, CHAT_MSG_TYPE.IMAGE, CHAT_MSG_TYPE.VIDEO, CHAT_MSG_TYPE.AUDIO, CHAT_MSG_TYPE.FILE, CHAT_MSG_TYPE.VOICE_CALL).required(),
});

const sendCall = Joi.object({
  receiverId: objectId.required(),
  chatRoomId: objectId.required(),
});

const receiveCall = Joi.object({
  senderId: objectId.required(),
  chatRoomId: objectId.required(),
});

const endCall = Joi.object({
  senderId: objectId.required(),
  receiverId: objectId.required(),
});

const leaveRoom = Joi.object({
  chatRoomId: objectId.required(),
});

const chatRoomList = Joi.object({
  search: Joi.string().trim().optional().allow(""),
});

module.exports = {
  createRoom,
  chatHistory,
  sendMessage,
  sendCall,
  receiveCall,
  leaveRoom,
  endCall,
  chatRoomList,
};
