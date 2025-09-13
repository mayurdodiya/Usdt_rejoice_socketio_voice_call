const { UserModel, CurrencyModel, CurrencyRateModel } = require("../../models");
const apiResponse = require("../../utils/api.response");
const logger = require("../../config/logger");
const { getPagination, pagingData, generateUniqueName } = require("../../utils/utils");
const { ROLE } = require("../../utils/constant");
const sendEmail = require("../../services/sendgrid");
const { sendAgentCredentials } = require("../../templates/emailTemplate");
const message = require("../../utils/message");
const response = require("./response");

module.exports = {
  // create agent
  createAgent: async (req, res) => {
    try {
      const reqBody = req.body;
      reqBody.role = ROLE.AGENT;

      const agentExist = await UserModel.findOne({ email: reqBody.email, deletedAt: null });
      if (agentExist) {
        return apiResponse.BAD_REQUEST({ res, message: message.DATA_EXIST("This email") });
      }

      // generate fake name
      reqBody.uniqName = await generateUniqueName(UserModel);

      const agent = await UserModel.create(reqBody);
      if (!agent) {
        return apiResponse.BAD_REQUEST({ res, message: message.SOMETHING_WENT_WRONG });
      }

      // send email to agent
      await sendEmail({
        to: agent.email,
        subject: "Agent account credentials",
        text: ``,
        html: sendAgentCredentials(reqBody.firstName, reqBody.email, reqBody.password),
      });

      return apiResponse.OK({ res, message: message.ADD_DATA("Agent") });
    } catch (err) {
      logger.error("error createAgent", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // update agent
  updateAgent: async (req, res) => {
    try {
      const reqBody = req.body;
      const userId = req.params.id;

      const emailExist = await UserModel.findOne({ email: reqBody.email, _id: { $ne: userId }, deletedAt: null });
      if (emailExist) {
        return apiResponse.BAD_REQUEST({ res, message: message.DATA_EXIST("This email") });
      }

      const agentData = { ...reqBody };

      const agent = await UserModel.findOneAndUpdate({ _id: userId, deletedAt: null }, { $set: agentData }, { new: true });

      if (!agent) {
        return apiResponse.BAD_REQUEST({ res, message: message.SOMETHING_WENT_WRONG });
      }

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Agent") });
    } catch (err) {
      logger.error("error updateAgent", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get agent list
  getAgentList: async (req, res) => {
    try {
      const { search = "", status } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.size) || 10;
      const { skip, limit: pageLimit } = getPagination(page, limit);

      let DataObj = { role: ROLE.AGENT, deletedAt: null };

      if (search) {
        const searchStr = String(search);
        const orConditions = [{ firstName: { $regex: searchStr, $options: "i" } }, { lastName: { $regex: searchStr, $options: "i" } }, { email: { $regex: searchStr, $options: "i" } }, { uniqName: { $regex: searchStr, $options: "i" } }, { countryCode: { $regex: searchStr, $options: "i" } }, { phone: { $regex: searchStr, $options: "i" } }];

        if (["true", "false"].includes(search.toLowerCase())) {
          orConditions.push({
            isActive: search.toLowerCase() === "true",
          });
        }
        DataObj = { ...DataObj, $or: orConditions };
      }

      if (status) {
        DataObj = { ...DataObj, isActive: status };
      }

      let [total, agentList] = await Promise.all([
        UserModel.countDocuments(DataObj),
        UserModel.find(DataObj)
          .skip(skip)
          .limit(pageLimit)
          .sort({ createdAt: -1 })
          .select("-password -deletedAt -updatedAt")
          .populate({
            path: "currencyRates",
            match: { userId: req.user._id },
            select: "-deletedAt -createdAt -updatedAt -isActive",
            populate: { path: "currencyId", select: "_id currencyName" },
          }),
      ]);

      const responseData = pagingData({ data: agentList, total: total, page, limit: pageLimit });

      return apiResponse.OK({ res, message: message.GET_LIST("Agent"), data: responseData });
    } catch (err) {
      logger.error("error getAgentList", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get agent by id
  getAgentById: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await UserModel.findOne({ _id: id, role: ROLE.AGENT, deletedAt: null })
        .select("-password -deletedAt -__v -updatedAt")
        .populate({
          path: "currencyRates",
          match: { userId: req.user._id },
          select: "-deletedAt -__v -createdAt -updatedAt -isActive",
          populate: { path: "currencyId", select: "-deletedAt -__v -createdAt -updatedAt" },
        });
      if (!agent) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Agent") });
      }
      return apiResponse.OK({ res, message: message.GET_DATA("Agent"), data: agent });
    } catch (err) {
      logger.error("error getAgentById", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // active/inactive to all roles
  activeDeactiveAgent: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await UserModel.findOne({ _id: id, deletedAt: null });
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("User") });
      }

      user.isActive = !user.isActive;
      await user.save();

      return apiResponse.OK({ res, message: message.UPDATE_DATA("User"), data: { isActive: user.isActive } });
    } catch (err) {
      logger.error("error activeDeactiveAgent", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // user listing
  getUserList: async (req, res) => {
    try {
      const { search = "", status } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.size) || 10;
      const { skip, limit: pageLimit } = getPagination(page, limit);

      let DataObj = { role: ROLE.USER, deletedAt: null };

      if (search) {
        const searchStr = String(search);
        const orConditions = [{ firstName: { $regex: searchStr, $options: "i" } }, { lastName: { $regex: searchStr, $options: "i" } }, { email: { $regex: searchStr, $options: "i" } }, { uniqName: { $regex: searchStr, $options: "i" } }, { countryCode: { $regex: searchStr, $options: "i" } }, { phone: { $regex: searchStr, $options: "i" } }];

        if (["true", "false"].includes(search.toLowerCase())) {
          orConditions.push({
            isActive: search.toLowerCase() === "true",
          });
        }
        DataObj = { ...DataObj, $or: orConditions };
      }

      if (status) {
        DataObj = { ...DataObj, isActive: status };
      }

      let [total, userList] = await Promise.all([UserModel.countDocuments(DataObj), UserModel.find(DataObj).skip(skip).limit(pageLimit).sort({ createdAt: -1 }).select("-password -deletedAt -__v -updatedAt")]);

      const response = pagingData({ data: userList, total: total, page, limit: pageLimit });

      return apiResponse.OK({ res, message: message.GET_LIST("User"), data: response });
    } catch (err) {
      logger.error("error getUserList", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await UserModel.findOne({ _id: id, deletedAt: null }).select("-password -deletedAt -__v -updatedAt");
      if (!user) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("User") });
      }
      return apiResponse.OK({ res, message: message.GET_DATA("User"), data: user });
    } catch (err) {
      logger.error("error getUserById", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // currency module
  // create currency
  createCurrency: async (req, res) => {
    try {
      const reqBody = req.body;
      const currencyExist = await CurrencyModel.findOne({ currencyName: reqBody.currencyName, deletedAt: null });
      if (currencyExist) {
        return apiResponse.BAD_REQUEST({ res, message: message.DATA_EXIST("Currency") });
      }

      let currency = await CurrencyModel.create({ ...reqBody });

      // currency = currency.toObject();
      // delete currency.deletedAt;
      // delete currency.updatedAt;

      return apiResponse.OK({ res, message: message.ADD_DATA("Currency"), data: currency });
    } catch (err) {
      logger.error("error createCurrency", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // update currency
  updateCurrency: async (req, res) => {
    try {
      const reqBody = req.body;
      const currencyName = process.env.SINGLE_CURRENCY;

      await Promise.all([CurrencyModel.findOneAndUpdate({ currencyName: currencyName, deletedAt: null }, { $set: reqBody })]);

      return apiResponse.OK({ res, message: message.UPDATE_DATA("Currency") });
    } catch (err) {
      logger.error("error updateCurrency", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get currency list
  getMyCurrencyList: async (req, res) => {
    try {
      const { search = "" } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.size) || 10;
      const { skip, limit: pageLimit } = getPagination(page, limit);

      let DataObj = { deletedAt: null };

      if (search) {
        const searchStr = String(search);
        const orConditions = [{ currencyName: { $regex: searchStr, $options: "i" } }];
        DataObj = { ...DataObj, $or: orConditions };
      }

      let [total, currencyList] = await Promise.all([
        CurrencyModel.countDocuments(DataObj),
        CurrencyModel.find(DataObj)
          .skip(skip)
          .limit(pageLimit)
          .sort({ createdAt: -1 })
          .select("-deletedAt -__v -updatedAt")
          .populate({ path: "currencyRates", match: { userId: req.user._id }, select: "-deletedAt -__v -createdAt -updatedAt -isActive" })
          .lean(),
      ]);

      const responseData = pagingData({ data: currencyList, total: total, page, limit: pageLimit });
      const modifyResponse = response.getMyCurrencyListRes(responseData);

      return apiResponse.OK({ res, message: message.GET_LIST("Currency"), data: modifyResponse });
    } catch (err) {
      logger.error("error getMyCurrencyList", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get currency by id
  getCurrencyById: async (req, res) => {
    try {
      const { id } = req.params;
      const currency = await CurrencyModel.findOne({ _id: id, deletedAt: null })
        .select("-deletedAt -__v -updatedAt")
        .populate({ path: "currencyRates", match: { userId: req.user._id }, select: "-deletedAt -__v -createdAt -updatedAt -isActive" })
        .lean();
      if (!currency) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Currency") });
      }
      const modifyResponse = response.getCurrencyByIdRes(currency);
      return apiResponse.OK({ res, message: message.GET_DATA("Currency"), data: modifyResponse });
    } catch (err) {
      logger.error("error getCurrencyById", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // get single currency
  getSingleCurrency: async (req, res) => {
    try {
      const currency = await CurrencyModel.findOne({ /* currencyName:reqBody.currencyName, */ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(1)
        .select("-deletedAt -updatedAt")
        .populate({
          path: "currencyRates",
          match: { deletedAt: null },
          select: "-deletedAt -createdAt -updatedAt -isActive",
          populate: {
            path: "userId",
            select: "-deletedAt -createdAt -updatedAt -isActive -password",
            match: { deletedAt: null, role: ROLE.AGENT },
          },
        })
        .lean();
      if (!currency) {
        return apiResponse.NOT_FOUND({ res, message: message.NO_DATA("Currency") });
      }
      // const modifyResponse = response.getCurrencyByIdRes(currency);
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

  // delete currency
  deleteCurrency: async (req, res) => {
    try {
      const { id } = req.params;
      await Promise.all([CurrencyModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }), CurrencyRateModel.findOneAndUpdate({ currencyId: id, deletedAt: null }, { $set: { deletedAt: new Date() } })]);
      return apiResponse.OK({ res, message: message.DELETE_DATA("Currency") });
    } catch (err) {
      logger.error("error deleteCurrency", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },

  // dashboard
  getDashboardData: async (req, res) => {
    try {
      const [totalUsers, totalAgents, currency] = await Promise.all([UserModel.countDocuments({ role: ROLE.USER, deletedAt: null }), UserModel.countDocuments({ role: ROLE.AGENT, deletedAt: null }), CurrencyModel.findOne({ currencyName: process.env.SINGLE_CURRENCY, deletedAt: null }).select("_id currencyName buyRate sellRate logo")]);

      return apiResponse.OK({ res, message: message.GET_DATA("Dashboard Data"), data: { totalUsers, totalAgents, currency } });
    } catch (err) {
      logger.error("error getDashboardData", err);
      return apiResponse.CATCH_ERROR({ res, message: message.SOMETHING_WENT_WRONG });
    }
  },
};
