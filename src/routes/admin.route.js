const express = require("express");
const controller = require("../controllers/admin/controller");
const validate = require("../middlewares/validate");
const { adminValidation } = require("../validations");
const { auth } = require("../middlewares/auth");
const { ROLE } = require("../utils/constant");

const router = express.Router();

// agents module
// update agent
router.put("/agent/:id", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.updateAgent), controller.updateAgent);

// get agent by id
router.get("/agent/:id", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.getAgentById), controller.getAgentById);

// create agent
router.post("/agent", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.createAgent), controller.createAgent);

// get agent list
router.get("/agent", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.getAgentList), controller.getAgentList);

// active/deactive agent
router.put("/active-deactive/:id", auth({ usersAllowed: [ROLE.ADMIN] }), controller.activeDeactiveAgent);

// users module
// get user list
router.get("/user", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.getUserList), controller.getUserList);

// get user by id
router.get("/user/:id", auth({ usersAllowed: [ROLE.ADMIN] }), controller.getUserById);

// get single currency
router.get("/currency/single", auth({ usersAllowed: [ROLE.ADMIN] }), controller.getSingleCurrency);

// listAgentsWithCurrencyRates
router.get("/agents-rates", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.listAgentsWithCurrencyRates), controller.listAgentsWithCurrencyRates);

// update currency
router.put("/currency", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.updateCurrency), controller.updateCurrency);

// dashboard
router.get("/dashboard", auth({ usersAllowed: [ROLE.ADMIN] }), controller.getDashboardData);

// currency module
// create currency
// router.post("/currency", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.createCurrency), controller.createCurrency);

// get currency list
// router.get("/currency", auth({ usersAllowed: [ROLE.ADMIN] }), validate(adminValidation.getMyCurrencyList), controller.getMyCurrencyList);


// get currency by id
// router.get("/currency/:id", auth({ usersAllowed: [ROLE.ADMIN] }), controller.getCurrencyById);

// delete currency
// router.delete("/currency/:id", auth({ usersAllowed: [ROLE.ADMIN] }), controller.deleteCurrency);




module.exports = router;
