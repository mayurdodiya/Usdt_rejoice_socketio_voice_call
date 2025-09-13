const { UserModel, OtpModel } = require("../../models");
const apiResponse = require("../../utils/api.response");
const logger = require("../../config/logger");
const { comparePassword, generateToken, hashPassword, generateUniqueName } = require("../../utils/utils");
const { ROLE } = require("../../utils/constant");
const sendEmail = require("../../services/sendgrid");
const { sendOTP } = require("../../templates/emailTemplate");
const message = require("../../utils/message");

module.exports = {
  // login
  login: async (req, res) => {
    try {
      const reqBody = req.body;
      let user = await UserModel.findOne({ email: reqBody.email, deletedAt: null }).select("-updatedAt -deletedAt");
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Email") });
      }
      if (user.role !== reqBody.role) {
        return apiResponse.BAD_REQUEST({ res, message: message.INVALID("Credentials") });
      }

      if (!user.isActive) {
        return apiResponse.BAD_REQUEST({ res, message: message.DEACTIVATED });
      }

      const pwdMatch = await comparePassword({ password: reqBody.password, hash: user.password });
      if (!pwdMatch) {
        return apiResponse.BAD_REQUEST({ res, message: message.INVALID_CREDENTIALS });
      }

      const token = generateToken({ userId: user._id, email: user.email, role: user.role });

      user = user.toObject();
      delete user.password;
      user.token = token;

      if (reqBody.fcmToken) {
        user.fcmToken = reqBody.fcmToken;
        await UserModel.findOneAndUpdate({ _id: user._id, deletedAt: null }, { $set: { fcmToken: reqBody.fcmToken } }, { new: true });
      }

      return apiResponse.OK({ res, message: message.LOGIN_SUCCESS, data: user });
    } catch (err) {
      logger.error("error generating", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // logout
  logout: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log("userId", userId);
      // return

      await UserModel.findOneAndUpdate({ _id: userId, deletedAt: null }, { $set: { fcmToken: "", onlineStatus: false } }, { new: true });

      return apiResponse.OK({ res, message: message.LOGOUT_SUCCESS });
    } catch (err) {
      logger.error("error generating", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // signup only for user
  signup: async (req, res) => {
    try {
      const reqBody = req.body;

      // check if email already exists
      const isTaken = await UserModel.isEmailTaken(reqBody.email);
      if (isTaken) {
        return apiResponse.BAD_REQUEST({ res, message: message.DATA_EXIST("Email") });
      }

      // generate fake name
      reqBody.uniqName = await generateUniqueName(UserModel);

      let user = new UserModel({
        firstName: reqBody.firstName,
        lastName: reqBody.lastName,
        email: reqBody.email,
        phone: reqBody.phone,
        countryCode: reqBody.countryCode,
        password: reqBody.password,
        role: ROLE.USER,
        uniqName: reqBody.uniqName,
        fcmToken: reqBody?.fcmToken || "",
      });

      await user.save();

      const token = generateToken({ userId: user._id, email: user.email, role: user.role });

      user = user.toObject();
      delete user.password;
      user.token = token;

      return apiResponse.OK({ res, message: message.SIGNUP_SUCCESS, data: user });
    } catch (err) {
      logger.error("error signup:", err);
      console.log(err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // send otp to email
  sendOtp: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email, deletedAt: null }).select("-password");
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Email") });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);

      await Promise.all([
        OtpModel.findOneAndUpdate({ userId: user._id, email }, { otp, expiryTime: new Date(Date.now() + 1 * 60 * 1000) }, { upsert: true, new: true }),
        sendEmail({
          to: email,
          subject: "Usdt forgot password request",
          text: `Your Otp is: ${otp}`,
          html: sendOTP(email, otp),
        }),
      ]);

      return apiResponse.OK({ res, message: message.SENT_EMAIL("Otp") });
    } catch (error) {
      logger.error("Error in forgotPassword", error);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // verify otp
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await UserModel.findOne({ email, deletedAt: null }).select("-password");
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Email") });
      }

      const otpData = await OtpModel.findOne({ userId: user._id, email });
      if (!otpData) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Otp") });
      }
      if (otpData.otp !== otp) {
        return apiResponse.BAD_REQUEST({ res, message: message.INVALID("Otp") });
      }
      if (otpData.expiryTime < new Date()) {
        return apiResponse.BAD_REQUEST({ res, message: message.EXPIRED("Otp") });
      }

      await OtpModel.findOneAndUpdate({ _id: otpData._id, deletedAt: null }, { $set: { expiryTime: new Date(), hasVerifiedOtp: true } }, { new: true });
      return apiResponse.OK({ res, message: message.VERIFIED("Otp") });
    } catch (error) {
      logger.error("error verifyOtp", error);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // change password
  changePassword: async (req, res) => {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      const user = await UserModel.findOne({ email, deletedAt: null }).populate("otps").select("-password");
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Email") });
      }
      if (!user.otps[0].hasVerifiedOtp) {
        return apiResponse.BAD_REQUEST({ res, message: message.NOT_VERIFIED("Otp") });
      }
      if (newPassword !== confirmPassword) {
        return apiResponse.BAD_REQUEST({ res, message: message.INVALID_CREDENTIALS });
      }
      const finalPassword = await hashPassword({ password: newPassword });

      await Promise.all([UserModel.findOneAndUpdate({ _id: user._id, deletedAt: null }, { $set: { password: finalPassword } }, { new: true }), OtpModel.findOneAndUpdate({ _id: user.otps[0]._id, deletedAt: null }, { $set: { hasVerifiedOtp: false } }, { new: true })]);

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Password") });
    } catch (error) {
      logger.error("error changePassword", error);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },
};
