const express = require("express");
const controller = require("../controllers/agent/controller");
const validate = require("../middlewares/validate");
const { agentValidation } = require("../validations");
const { auth } = require("../middlewares/auth");
const { ROLE } = require("../utils/constant");

const router = express.Router();

// update profile
router.put("/update-profile", auth({ usersAllowed: [ROLE.AGENT] }), validate(agentValidation.updateProfile), controller.updateProfile);

// get profile
router.get("/profile", auth({ usersAllowed: [ROLE.AGENT] }), controller.getProfile);

// add currency rate
router.post("/currency-rate", auth({ usersAllowed: [ROLE.AGENT] }), validate(agentValidation.addCurrencyRate), controller.addCurrencyRate);

// update currency rate
router.put("/currency-rate", auth({ usersAllowed: [ROLE.AGENT] }), validate(agentValidation.updateCurrencyRate), controller.updateCurrencyRate);

// get my single currency rate
router.get("/currency-rate", auth({ usersAllowed: [ROLE.AGENT] }), controller.getMyCurrencyRate);

// get my currency rates
router.get("/currency", auth({ usersAllowed: [ROLE.AGENT] }), validate(agentValidation.getMyCurrencyRates), controller.getMyCurrencyRates);

// closed chat when deal is completed
router.post("/deal", auth({ usersAllowed: [ROLE.AGENT] }), controller.dealDone);

// // currency dropdown
// router.get("/currency-dropdown", auth({ usersAllowed: [ROLE.AGENT] }), controller.getCurrencyDropdown);

module.exports = router;
