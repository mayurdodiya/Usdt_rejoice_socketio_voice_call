const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const controller = require("../controllers/chat/chat.controller");

const { chatValidation } = require("../validations");
const { ROLE } = require("../utils/constant");

const { upload } = require("../services/s3.upload.js");
const uploadFile = upload.array("image");

router.post("/createChatRoom", auth({ usersAllowed: [ROLE.USER, ROLE.AGENT] }), validate(chatValidation.createChatRoom), controller.createChatRoom);

router.post("/uploadImageAndVideo", auth({ usersAllowed: [ROLE.USER, ROLE.AGENT] }), uploadFile, controller.uploadImageAndVideo);

router.post("/agoraToken", auth({ usersAllowed: [ROLE.USER, ROLE.AGENT] }), validate(chatValidation.getAgoraCallToken), controller.getAgoraCallToken);

module.exports = router;
