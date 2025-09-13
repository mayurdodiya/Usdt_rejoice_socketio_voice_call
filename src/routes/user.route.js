const express = require("express");
const controller = require("../controllers/user/controller");
const validate = require("../middlewares/validate");
const { userValidation } = require("../validations");
const { auth } = require("../middlewares/auth");
const { ROLE } = require("../utils/constant");

const router = express.Router();

// update profile
router.put("/update-profile", auth({ usersAllowed: [ROLE.USER] }), validate(userValidation.updateProfile), controller.updateProfile);

// get profile
router.get("/profile", auth({ usersAllowed: [ROLE.USER] }), controller.getProfile);

// get currency
router.get("/currency", auth({ usersAllowed: [ROLE.USER] }), controller.getCurrency);

// list agent with currency rates
router.get("/agents-rates", auth({ usersAllowed: [ROLE.USER] }), validate(userValidation.listAgentsWithCurrencyRates), controller.listAgentsWithCurrencyRates);

// chat list
router.get("/chat-rooms", auth({ usersAllowed: [ROLE.USER] }), controller.chatRoomList);

// // currency dropdown
// router.get("/currency-dropdown", auth({ usersAllowed: [ROLE.USER] }), controller.getCurrencyDropdown);


module.exports = router;
