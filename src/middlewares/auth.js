const jwt = require("jsonwebtoken");
const apiResponse = require("../utils/api.response");
const messages = require("../utils/message");
const { UserModel } = require("../models");
const { ROLE } = require("../utils/constant");

module.exports = {
  auth: ({ isTokenRequired = true, usersAllowed = [] } = {}) => {
    return async (req, res, next) => {
      const token = req.header("x-auth-token");

      if (isTokenRequired && !token) return apiResponse.UNAUTHORIZED({ res, message: messages.TOKEN_REQUIRED });
      if (!isTokenRequired && !token) return next();
      try {
        let decoded = jwt.verify(token, process.env.JWT_SECRET);
        let user = await UserModel.findOne({ _id: decoded.userId }).lean();
        if (!user) return apiResponse.UNAUTHORIZED({ res, message: messages.INVALID_TOKEN });
        if (user.isActive === false) return apiResponse.UNAUTHORIZED({ res, message: messages.DEACTIVATED });

        req.user = user;

        if (usersAllowed.length) {
          if (req.user.role === ROLE.ADMIN) return next();
          if (usersAllowed.includes("*")) return next();
          if (usersAllowed.includes(req.user.role)) return next();
          return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
        } else {
          if (req.user.role === ROLE.ADMIN) return next();

          return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
        }
      } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    };
  },
};
