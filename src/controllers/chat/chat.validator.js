const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {
  uploadImageAndVideo: validator({
    params: Joi.object({
      chatRoomId: Joi.string().required(),
    }),
  }),
  createChatRoom: validator({}),
};
