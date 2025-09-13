const express = require("express");
const message = require("../utils/message");

const router = express.Router();

router.get("/health", (req, res) => {
  return res.send(message.SERVER_IS_HEALTHY_AND_RUNNING);
});

// auth routes
router.use("/auth", require("./auth.route"));

// admin routes
router.use("/admin", require("./admin.route"));

// agent routes
router.use("/agent", require("./agent.route"));

// user routes
router.use("/user", require("./user.route"));

// chat routes
router.use("/chat", require("./chat.route"));

module.exports = router;
