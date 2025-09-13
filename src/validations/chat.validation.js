const Joi = require("joi");
const { search } = require("../routes");
const { CURRENCY_RATE_TYPE } = require("../utils/constant");

// createChatRoom.
const createChatRoom = {
  body: Joi.object().keys({
    receiverId: Joi.string().trim().required().messages({
      "any.required": "Receiver Id is required.",
    }),
  }),
};

const getAgoraCallToken = {
  body: Joi.object().keys({
    channelName: Joi.string().trim().required().messages({
      "any.required": "Channel Name is required.",
    }),
    uid: Joi.number().required(),
    // recivedId: Joi.string().trim().required().messages({
    //   "any.required": "Receiver Id is required.",
    // }),
  }),
};

// all auth validations are exported from here
module.exports = {
  createChatRoom,
  getAgoraCallToken,
};
