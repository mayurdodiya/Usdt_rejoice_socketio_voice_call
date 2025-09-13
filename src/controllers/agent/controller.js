const { UserModel, CurrencyModel, CurrencyRateModel, ChatRoomModel, ChatModel } = require("../../models");
const { hashPassword, pagingData, getPagination } = require("../../utils/utils");
const { sendNotification } = require("../../services/send-noification");
const apiResponse = require("../../utils/api.response");
const logger = require("../../config/logger");
const message = require("../../utils/message");
const { getCurrencyDropdownRes } = require("./response");

module.exports = {
  // update profile
  updateProfile: async (req, res) => {
    try {
      const reqBody = req.body;
      const userId = req.user._id;
      let hashPwd = null;
      const agentData = { ...reqBody };

      if (reqBody.password) {
        hashPwd = await hashPassword({ password: reqBody.password });
        agentData.password = hashPwd;
      }

      const agent = await UserModel.findOneAndUpdate({ _id: userId, deletedAt: null }, { $set: agentData }, { new: true });

      if (!agent) {
        return apiResponse.BAD_REQUEST({ res, message: message.SOMETHING_WENT_WRONG });
      }

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Profile") });
    } catch (err) {
      logger.error("error updateAgent", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get profile
  getProfile: async (req, res) => {
    try {
      delete req.user.password;
      const currencyRate = await CurrencyRateModel.findOne({ userId: req.user._id, deletedAt: null }).select("buyRate sellRate").populate("currencyId", "currencyName");
      return apiResponse.OK({ res, message: message.GET_DATA("Profile"), data: { ...req.user, currencyRate } });
    } catch (err) {
      logger.error("error getProfile", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // currency dropdown wth admin rates
  getCurrencyDropdown: async (req, res) => {
    try {
      const admin = await UserModel.findOne({ email: process.env.ADMIN_EMAIL, deletedAt: null });

      const currencyList = await CurrencyModel.find({ deletedAt: null })
        .select("-deletedAt -createdAt -updatedAt")
        .populate({
          path: "currencyRates",
          match: { userId: admin._id },
          select: "-deletedAt -createdAt -updatedAt -isActive",
        })
        .lean();

      const modifyRes = getCurrencyDropdownRes(currencyList);
      return apiResponse.OK({ res, message: message.GET_DATA("Currency Dropdown"), data: modifyRes });
    } catch (err) {
      logger.error("error getCurrencyDropdown", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // add currency rate
  addCurrencyRate: async (req, res) => {
    try {
      const reqBody = req.body;
      const userId = req.user._id;
      const currencyName = process.env.SINGLE_CURRENCY;

      const currency = await CurrencyModel.findOne({ currencyName, deletedAt: null });
      if (!currency) {
        return apiResponse.BAD_REQUEST({ res, message: message.NO_DATA("This currency") });
      }

      const rateExist = await CurrencyRateModel.findOne({ currencyId: currency._id, userId, deletedAt: null });
      if (rateExist) {
        return apiResponse.BAD_REQUEST({ res, message: message.DATA_EXIST("Currency rate") });
      }

      const currencyRate = await CurrencyRateModel.create({ ...reqBody, currencyId: currency._id, userId });
      return apiResponse.OK({ res, message: message.ADD_DATA("Currency Rate"), data: currencyRate });
    } catch (err) {
      logger.error("error addCurrencyRate", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // update currency rate
  updateCurrencyRate: async (req, res) => {
    try {
      const reqBody = req.body;
      const userId = req.user._id;
      const currencyName = process.env.SINGLE_CURRENCY;

      const currency = await CurrencyModel.findOne({ currencyName, deletedAt: null });
      if (!currency) {
        return apiResponse.BAD_REQUEST({ res, message: message.NO_DATA("Currency") });
      }

      const rateExist = await CurrencyRateModel.findOne({ currencyId: currency._id, userId, deletedAt: null });
      if (!rateExist) {
        return apiResponse.BAD_REQUEST({ res, message: message.ADD_CURRENCYRATE_FIRST });
      }

      await CurrencyRateModel.findOneAndUpdate({ currencyId: currency._id, userId, deletedAt: null }, { $set: reqBody }, { new: true });

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Currency Rate") });
    } catch (err) {
      logger.error("error updateCurrencyRate:", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get my currency rates
  getMyCurrencyRates: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.size) || 10;
      const userId = req.user._id;
      const { skip, limit: pageLimit } = getPagination(page, limit);

      let query = { userId, deletedAt: null };

      let currencyMatch = {};
      if (search) {
        const regex = { $regex: search, $options: "i" };
        currencyMatch.$or = [{ currencyName: regex }, { symbol: regex }];
      }

      let currencyList = await CurrencyRateModel.find(query)
        .skip(skip)
        .limit(pageLimit)
        .sort({ createdAt: -1 })
        .select("-deletedAt -createdAt -updatedAt -isActive")
        .populate({
          path: "currencyId",
          select: "-deletedAt -createdAt -updatedAt -isActive",
          match: currencyMatch,
        })
        .lean();

      currencyList = currencyList.filter((c) => c.currencyId);

      const total = await CurrencyRateModel.countDocuments(query);
      const filteredTotal = search ? currencyList.length : total;

      const responseData = pagingData({
        data: currencyList,
        total: filteredTotal,
        page,
        limit: pageLimit,
      });

      return apiResponse.OK({
        res,
        message: message.GET_DATA("Currency Rates"),
        data: responseData,
      });
    } catch (err) {
      logger.error("error getMyCurrencyRates:", err);
      return apiResponse.CATCH_ERROR({
        res,
        message: message.SOMETHING_WENT_WRONG,
      });
    }
  },

  // get my single currency
  getMyCurrencyRate: async (req, res) => {
    try {
      const currency = await CurrencyModel.findOne({ currencyName: process.env.SINGLE_CURRENCY, deletedAt: null }).select("-deletedAt -createdAt -updatedAt -isActive");
      if (!currency) {
        return apiResponse.BAD_REQUEST({ res, message: message.NO_DATA("Currency") });
      }

      const currencyRate = await CurrencyRateModel.findOne({ currencyId: currency._id, userId: req.user._id, deletedAt: null });
      //   .populate({
      //   path: "currencyId",
      //   select: "-deletedAt -createdAt -updatedAt -isActive",
      // });

      return apiResponse.OK({ res, message: message.GET_DATA("Currency Rate"), data: { currency: currency, currencyRate: currencyRate } });
    } catch (err) {
      logger.error("error getCurrencyRateById:", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // closed chat when deal is completed
  dealDone: async (req, res) => {
    try {
      const userId = req.user._id;
      const chatId = req.query.id;

      // Find the chat and mark it as completed
      const chat = await ChatRoomModel.findOneAndUpdate({ _id: chatId }, { isDealCompleted: true }, { new: true });

      if (!chat) {
        return apiResponse.BAD_REQUEST({ res, message: message.NO_DATA("Chat") });
      }

      // soft delete all messages in the chat
      await ChatModel.updateMany({ chatRoomId: chatId }, { $set: { deletedAt: new Date() } });

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Deal"), data: chat });
    } catch (err) {
      logger.error("error dealDone:", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },
};

// workable
async function notifyUser(email, message) {
  try {
    const user = await UserModel.findOne({ email: email });
    console.log(user);
    if (!user) {
      return apiResponse.BAD_REQUEST({ res, message: message.NO_DATA("User") });
    }

    // Send notification
    await sendNotification(user.fcmToken, "new msg title", message, "name", "roomId", "type");
    // Send notification logic here
    console.log(`Sending notification to ${user.email}: ${message}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
// notifyUser("mark111@yopmail.com", "testing msg from nodejs app!");
