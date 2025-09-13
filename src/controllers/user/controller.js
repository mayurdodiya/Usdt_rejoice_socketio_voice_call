const { UserModel, CurrencyModel, CurrencyRateModel, ChatRoomModel } = require("../../models");
const apiResponse = require("../../utils/api.response");
const logger = require("../../config/logger");
const { hashPassword, pagingData, getPagination } = require("../../utils/utils");
const message = require("../../utils/message");
const { getCurrencyDropdownRes } = require("./response");
const { ROLE } = require("../../utils/constant");

module.exports = {
  // update profile
  updateProfile: async (req, res) => {
    try {
      const reqBody = req.body;
      const userId = req.user._id;
      let hashPwd = null;
      const userData = { ...reqBody };

      if (reqBody.password) {
        hashPwd = await hashPassword({ password: reqBody.password });
        userData.password = hashPwd;
      }

      const user = await UserModel.findOneAndUpdate({ _id: userId, deletedAt: null }, { $set: userData }, { new: true });

      if (!user) {
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
      return apiResponse.OK({ res, message: message.GET_DATA("Profile"), data: req.user });
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
        // .populate({
        //   path: "currencyRates",
        //   match: { userId: admin._id },
        //   select: "-deletedAt -createdAt -updatedAt -isActive",
        // })
        .lean();

      const modifyRes = getCurrencyDropdownRes(currencyList);
      return apiResponse.OK({ res, message: message.GET_DATA("Currency Dropdown"), data: modifyRes });
    } catch (err) {
      logger.error("error getCurrencyDropdown", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get currency by id
  getCurrencyByIdOLD: async (req, res) => {
    try {
      const currencyId = req.params.id;
      const admin = await UserModel.findOne({ email: process.env.ADMIN_EMAIL, deletedAt: null });
      const currency = await CurrencyModel.findOne({ _id: currencyId, deletedAt: null }).populate({
        path: "currencyRates",
        match: { userId: { $ne: admin._id } },
        options: { sort: { createdAt: -1 } },
        select: "-deletedAt -createdAt -updatedAt -isActive",
        populate: {
          path: "userId",
          select: "-deletedAt -createdAt -updatedAt -isActive -password",
        },
      });
      return apiResponse.OK({ res, message: message.GET_DATA("Currency"), data: currency });
    } catch (err) {
      logger.error("error getCurrencyById", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get currency
  getCurrency: async (req, res) => {
    try {
      const currencyName = process.env.SINGLE_CURRENCY;
      const currency = await CurrencyModel.findOne({ currencyName, deletedAt: null });
      //   .populate({
      //   path: "currencyRates",
      //   options: { sort: { createdAt: -1 } },
      //   select: "-deletedAt -createdAt -updatedAt -isActive",
      //   populate: {
      //     path: "userId",
      //     select: "uniqName _id",
      //   },
      // });
      return apiResponse.OK({ res, message: message.GET_DATA("Currency"), data: currency });
    } catch (err) {
      logger.error("error getCurrencyById", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  listAgentsWithCurrencyRates: async (req, res) => {
    try {
      const { type, search = "" } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.size) || 10;

      // Pagination calculation
      const { skip, limit: limitNum } = getPagination(page, limit);

      // Build search condition
      let searchQuery = {};
      if (search) {
        searchQuery = {
          $or: [{ uniqName: { $regex: search, $options: "i" } }],
        };
      }

      const [result, currency] = await Promise.all([
        UserModel.aggregate([
          {
            $match: {
              role: ROLE.AGENT,
              isActive: true,
              deletedAt: null,
              ...searchQuery,
            },
          },
          {
            $lookup: {
              from: "currencyrates",
              localField: "_id",
              foreignField: "userId",
              as: "currencyRates",
              pipeline: [
                { $match: { deletedAt: null, isActive: true } },
                {
                  $project: {
                    [type]: 1, // only include requested field
                    currency: { _id: 1, code: 1, name: 1 },
                  },
                },
                {
                  $match: { [type]: { $gt: 0 } }, // only keep > 0 values
                },
              ],
            },
          },
          {
            $match: { "currencyRates.0": { $exists: true } }, // only agents with valid rates
          },
          {
            $project: {
              _id: 1,
              role: 1,
              isActive: 1,
              uniqName: 1,
              currencyRate: { $arrayElemAt: ["$currencyRates", 0] },
            },
          },
          {
            $facet: {
              data: [{ $skip: skip }, { $limit: limitNum }],
              total: [{ $count: "count" }],
            },
          },
        ]),
        CurrencyModel.findOne({ currencyName: process.env.SINGLE_CURRENCY, deletedAt: null }).select("_id currencyName buyRate sellRate logo "),
      ]);

      const agents = result[0]?.data || [];
      const total = result[0]?.total[0]?.count || 0;
      const finalData = pagingData({ data: agents, total, page, limit });

      const obj = { currency: currency, agents: finalData };

      return apiResponse.OK({ res, message: message.GET_DATA("Agents with Currency Rates"), data: obj });
    } catch (err) {
      logger.error("error listAgentsWithCurrencyRates", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },


  // chat listing
  chatRoomList: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log(userId,'----------------')
      return
      const chatRooms = await ChatRoomModel.find({ participants: userId }).populate("participants");
      return apiResponse.OK({ res, message: message.GET_DATA("Chat Rooms"), data: chatRooms });
    } catch (err) {
      logger.error("error chatRoomList", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  }
};
