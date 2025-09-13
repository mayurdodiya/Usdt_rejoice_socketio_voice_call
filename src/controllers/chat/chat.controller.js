const DB = require("../../models");
const messages = require("../../utils/message");
const apiResponse = require("../../utils/api.response");
const { generateAgoraToken } = require("../../services/voice-call");
const message = require("../../utils/message");
const logger = require("../../config/logger");



module.exports = {
  uploadImageAndVideo: async (req, res) => {
    try {
      console.log("---------------------------1");
      if (req.files.length === 0) return apiResponse.BAD_REQUEST({ res, message: messages.IMAGE_REQUIRED });

      const response = [];
      for (let value of req.files) {
        console.log(value, "---------------------------image 2");
        if (value.contentType.includes("image")) {
          response.push({
            location: value.location,
            contentType: "image",
          });
        } else if (value.contentType.includes("video") || value.mimetype.includes("video")) {
          console.log(value, "---------------------------video 2");
          response.push({
            location: value.location,
            contentType: "video",
          });
        }
      }

      console.log(response, "-------------------------------response 3");
      return apiResponse.OK({ res, message: messages.FILE_UPLOADED, data: response });
    } catch (error) {
      logger.error("error uploadImageAndVideo", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR, data: error });
    }
  },

  createChatRoom: async (req, res) => {
    try {
      const userId = req.user._id;
      const { receiverId } = req.body;

      if (!receiverId) {
        return apiResponse.BAD_REQUEST({ res, message: "Receiver Id is required" });
      }

      const findChatRoom = await DB.ChatRoomModel.findOne({
        type: "single",
        participants: { $all: [userId, receiverId] },
      });

      if (findChatRoom) {
        return apiResponse.OK({ res, message: message.DATA_EXIST("Chat Room"), data: findChatRoom._id });
      }

      const chatRoom = await DB.ChatRoomModel.create({
        participants: [userId, receiverId],
        type: "single",
        // createdBy: userId,
      });

      return apiResponse.OK({ res, message: message.CREATED("Chat Room"), data: chatRoom._id });
    } catch (error) {
      logger.error("error createChatRoom", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR, data: error });
    }
  },

  getAgoraCallToken: async (req, res) => {
    try {
      const { channelName, /* recivedId, */ uid } = req.body;
      // const user = req.user;

      // const receiver = await DB.UserModel.findById(recivedId);
      // if (!receiver) {
      //   return apiResponse.BAD_REQUEST({ res, message: messages.NO_DATA("Receiver") });
      // }
      // if (receiver?.hasActiveVoiceCall) {
      //   return apiResponse.BAD_REQUEST({ res, message: messages.CALL_BUSY("Receiver") });
      // }

      const token = await generateAgoraToken(uid, channelName);

      return apiResponse.OK({ res, message: message.CREATED("Agora Token"), data: { token: token, uid: uid } });
    } catch (error) {
      logger.error("error getAgoraCallToken", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.FAILED_TO_GENERATE_AGORA_TOKEN, data: error });
    }
  },
};
