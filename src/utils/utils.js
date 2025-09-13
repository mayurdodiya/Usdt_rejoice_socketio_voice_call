const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { faker } = require("@faker-js/faker");

module.exports = {
  hashPassword: async ({ password }) => {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  },

  generateToken: (data) => {
    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    return token;
  },

  decodeToken: ({ token }) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  },

  comparePassword: async ({ password, hash }) => {
    const isPasswordMatch = await bcrypt.compare(password, hash);
    return isPasswordMatch;
  },

  generateUniqId: () => {
    const uniqId = crypto.randomBytes(4).toString("hex").toUpperCase();
    return uniqId;
  },

  getPagination: (page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    return { skip, limit: limitNum };
  },

  pagingData: ({ data = [], total = 0, page = 1, limit = 10 }) => {
    const totalPages = Math.ceil(total / limit);
    return {
      totalRecords: total,
      currentPage: parseInt(page),
      totalPages,
      pageSize: data.length,
      data,
    };
  },

  generateUniqueName: async (UserModel) => {
    let name;
    let exists = true;

    while (exists) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      name = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

      // check in DB if name already exists
      exists = await UserModel.exists({ uniqName: name });
    }

    return name;
  },

  //   sendNotification: async (fcmToken, title, body, type = "message") => {
  //   let payload = {
  //     notification: {
  //       title: title,
  //       body: body,
  //     },
  //     data: {
  //       type,
  //       isNavigate: "true",
  //     },
  //   };

  //   const notiRes = await sendNotificationObject(fcmToken, payload);
  //   return notiRes;
  // }
};
