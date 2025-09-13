const messages = require("../utils/message");
const DB = require("../models");
const jwt = require("jsonwebtoken");
const { sendNotification } = require("../services/send-noification");
const message = require("../utils/message");
const User = require("../models/user.model");
const ObjectId = require("mongoose").Types.ObjectId;
const validateSocket = require("../middlewares/validateSocket");
const { socketValidation } = require("../validations");
const { CHAT_MSG_TYPE } = require("./constant");

module.exports = {
  init(io) {
    console.log("socket initilized----------------1");

    io.use(async (socket, next) => {
      const token = socket.handshake.headers["x-auth-token"];
      console.log(token, "-------------------token");

      // if (!token) {
      //   const err = new Error("TOKEN_REQUIRED");
      //   err.data = { code: 401, message: "TOKEN_REQUIRED" }; // attach extra info
      //   return next(err);
      // }
      if (!token) return next(new Error(messages.TOKEN_REQUIRED));

      try {
        var user;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded, "-------------decode 2");
        user = await DB.UserModel.findByIdAndUpdate(decoded.userId, { socketId: socket.id, onlineStatus: 1, lastSeen: null }, { new: true });
        console.log(user, "-------------user 3");
        const chatUpdate = await DB.ChatModel.updateMany(
          {
            chatRoomId: { $ne: null },
            receiver: { $in: [user._id] },
            read: { $nin: [user._id] },
            // sender: { $ne: user._id },
            deliverd: { $nin: [user._id] },
          },
          { $addToSet: { deliverd: user._id } }
        );
        if (chatUpdate.modifiedCount != 0) {
          const findchatRoom = await DB.ChatRoomModel.find({
            participants: { $in: [user._id] },
          }).lean();
          await Promise.all(
            findchatRoom.map(async (room) => {
              const chatHistory = await DB.ChatModel.find({
                chatRoomId: room._id,
                receiver: { $in: [user._id] },
              })
                .populate("sender", "firstName lastName profilePicture")
                .populate("receiver", "firstName lastName profilePicture")
                .populate("replyTo", "message type")
                .populate("read", "firstName lastName profilePicture")
                .populate("deliverd", "firstName lastName profilePicture")
                .sort({ createdAt: -1 })
                .lean();
              await Promise.all(
                chatHistory.map(async (c) => {
                  let isRead = false;
                  let isDelivered = false;

                  if (c.read && c.read.length == c.receiver.length) {
                    isRead = true;
                  }
                  if (c.deliverd && c.deliverd.length == c.receiver.length) {
                    isDelivered = true;
                  }
                  c.isRead = isRead;
                  c.isDelivered = isDelivered;
                })
              );
              const reciverUser = room.participants.filter((p) => p.toString() != user._id.toString());
              const response = {
                sender: user._id.toString(),
                reciver: reciverUser,
                success: true,
                messages: messages.SUCCESS,
                data: chatHistory,
                chatRoomId: room._id.toString(),
              };

              io.to(room._id.toString()).emit("chat-history", response);
            })
          );
        }
      } catch (error) {
        console.log(error);
        return next(new Error(messages.INVALID_TOKEN));
      }

      console.log(user, "------------------user 11111111111");
      socket.user = user;
      console.log("DETECTED IN MIDDLAWERE");
      next();
    });
    console.log("=========================================================================");
    console.log("SETUP :- Socket Loading...");

    io.on("connection", async (socket) => {
      console.log("socket id while connection", `"socketId":${socket.id}, userId:${socket.user._id}`);
      socket.join(socket.user._id.toString());

      // fetch chat room automatically for a once
      // chatRoomList();
      chatRoomList(socket.user._id);

      // chat room list
      // async function chatRoomList() {
      //   try {
      //     const chatRooms = await DB.ChatRoomModel.find({
      //       participants: { $in: [socket.user._id] },
      //     })
      //       .populate("participants", "firstName lastName profilePicture onlineStatus userType uniqName")
      //       .populate("lastMessageBy", "firstName lastName")
      //       .sort({ updatedAt: -1 })
      //       .lean();

      //     console.log(chatRooms, "---------------chatRoomList 2");

      //     // filter all chat room (groups or single chat)
      //     let chatRoomList = await Promise.all(
      //       chatRooms.map(async (room) => {
      //         try {
      //           let name;
      //           const unreadCount = await DB.ChatModel.find({
      //             $and: [{ receiver: { $in: [socket.user._id] } }, { read: { $nin: [socket.user._id] } }, { chatRoomId: room._id }],
      //           });
      //           const MsgType = await DB.ChatModel.findOne({
      //             chatRoomId: new ObjectId(room._id),
      //             receiver: new ObjectId(socket.user._id),
      //           })
      //             .populate("sender", "firstName lastName uniqName")
      //             .sort({ createdAt: -1 })
      //             .limit(1);

      //           if (room.type === "group") {
      //             return {
      //               roomId: room._id,
      //               groupName: room.groupName,
      //               group_description: room.group_description,
      //               lastMessage: MsgType ? MsgType?.message || "" : null,
      //               lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
      //               lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
      //               unreadCount: unreadCount.length,
      //               lastMessageType: MsgType ? MsgType.type || "" : "",
      //               isRoomActive: true,
      //               isDealCompleted: room?.isDealCompleted || false,
      //               userType: room?.type || "group",
      //             };
      //           } else {
      //             const userData = room.participants.find((p) => p._id.toString() !== socket.user._id.toString());
      //             if (!MsgType) {
      //               return;
      //             }
      //             console.log(userData, "----------------------------- single");
      //             return {
      //               roomId: room._id,
      //               name: `${userData?.firstName || ""} ${userData?.lastName || ""}`,
      //               profileImage: userData?.profilePicture || "",
      //               onlineStatus: userData?.onlineStatus,
      //               unreadCount: unreadCount?.length,
      //               lastMessageType: MsgType ? MsgType?.type || "" : "",
      //               lastMessage: MsgType ? MsgType?.message || "" : null,
      //               // lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
      //               lastMessageBy: MsgType ? `${MsgType.sender?.uniqName || ""}` : null,
      //               lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
      //               userType: room?.type || "single",
      //               isRoomActive: room.isRoomActive,
      //               isDealCompleted: room?.isDealCompleted || false,
      //               uniqName: userData?.uniqName || "",
      //             };
      //           }
      //         } catch (error) {
      //           console.error("Error processing room:", room._id, error);
      //           // Decide what to do with the error, e.g., return a default value or rethrow it
      //           throw error; // Rethrow to propagate the error to the outer scope
      //         }
      //       })
      //     );
      //     chatRoomList = await chatRoomList.filter((room) => room != null);

      //     // send chatRoomList to the client
      //     io.to(socket.user._id.toString()).emit("chatRoomList", chatRoomList);
      //   } catch (error) {
      //     console.error(error);
      //   }
      // }
      async function chatRoomList(userId) {
        try {
          const chatRooms = await DB.ChatRoomModel.find({
            participants: { $in: [userId] },
          })
            .populate("participants", "firstName lastName profilePicture onlineStatus userType uniqName")
            .populate("lastMessageBy", "firstName lastName")
            .sort({ updatedAt: -1 })
            .lean();

          console.log(chatRooms, "---------------chatRoomList 2");

          // filter all chat room (groups or single chat)
          let chatRoomList = await Promise.all(
            chatRooms.map(async (room) => {
              try {
                let name;
                const unreadCount = await DB.ChatModel.find({
                  $and: [{ receiver: { $in: [userId] } }, { read: { $nin: [userId] } }, { chatRoomId: room._id }],
                });
                const MsgType = await DB.ChatModel.findOne({
                  chatRoomId: new ObjectId(room._id),
                  receiver: new ObjectId(userId),
                })
                  .populate("sender", "firstName lastName uniqName")
                  .sort({ createdAt: -1 })
                  .limit(1);

                if (room.type === "group") {
                  return {
                    roomId: room._id,
                    groupName: room.groupName,
                    group_description: room.group_description,
                    lastMessage: MsgType ? MsgType?.message || "" : null,
                    lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
                    lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
                    unreadCount: unreadCount.length,
                    lastMessageType: MsgType ? MsgType.type || "" : "",
                    isRoomActive: true,
                    isDealCompleted: room?.isDealCompleted || false,
                    userType: room?.type || "group",
                  };
                } else {
                  const userData = room.participants.find((p) => p._id.toString() !== userId.toString());
                  if (!MsgType) {
                    return;
                  }
                  console.log(userData, "----------------------------- single");
                  return {
                    roomId: room._id,
                    name: `${userData?.firstName || ""} ${userData?.lastName || ""}`,
                    profileImage: userData?.profilePicture || "",
                    onlineStatus: userData?.onlineStatus,
                    unreadCount: unreadCount?.length,
                    lastMessageType: MsgType ? MsgType?.type || "" : "",
                    lastMessage: MsgType ? MsgType?.message || "" : null,
                    // lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
                    lastMessageBy: MsgType ? `${MsgType.sender?.uniqName || ""}` : null,
                    lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
                    userType: room?.type || "single",
                    isRoomActive: room.isRoomActive,
                    isDealCompleted: room?.isDealCompleted || false,
                    uniqName: userData?.uniqName || "",
                  };
                }
              } catch (error) {
                console.error("Error processing room:", room._id, error);
                // Decide what to do with the error, e.g., return a default value or rethrow it
                throw error; // Rethrow to propagate the error to the outer scope
              }
            })
          );
          chatRoomList = await chatRoomList.filter((room) => room != null);

          // send chatRoomList to the client
          io.to(userId.toString()).emit("chat-room-list", chatRoomList);
        } catch (error) {
          console.error(error);
        }
      }

      // chat history load of one chat room
      async function chatHistoryReload(chatRoomId, userIds, page, limit) {
        const userId = userIds || socket.user._id;

        console.log(chatRoomId, "------------------qqqqqq 0");
        console.log(chatRoomId, userIds, page, limit, "------------------qqqqqq 1");
        console.log(userId, "------------------qqqqqq 2");
        // return

        // Determine pagination values. Defaults: page 1, limit 10
        const pageValue = page ? (parseInt(page) > 0 ? parseInt(page) : 1) : 1;
        const limitValue = limit ? (parseInt(limit) > 0 ? parseInt(limit) : 10) : 10;
        const skipValue = (pageValue - 1) * limitValue;

        // const chatHistory = await DB.ChatModel.find({
        //   chatRoomId: new ObjectId(chatRoomId),
        //   receiver: { $in: [userId] },
        // })
        //   .populate("sender", "firstName lastName profilePicture uniqName")
        //   .populate("receiver", "firstName lastName profilePicture uniqName")
        //   .populate("replyTo", "message type")
        //   .populate("read", "firstName lastName profilePicture uniqName")
        //   .populate("deliverd", "firstName lastName profilePicture uniqName")
        //   .sort({ createdAt: -1 })
        //   .skip(skipValue)
        //   .limit(limitValue)
        //   .lean();

        // const totalCount = await DB.ChatModel.countDocuments({
        //   chatRoomId: new ObjectId(chatRoomId),
        //   receiver: { $in: [userId] },
        // });

        const [chatHistory, totalCount, room] = await Promise.all([
          DB.ChatModel.find({
            chatRoomId: new ObjectId(chatRoomId),
            receiver: { $in: [userId] },
          })
            .populate("sender", "firstName lastName profilePicture uniqName")
            .populate("receiver", "firstName lastName profilePicture uniqName")
            .populate("replyTo", "message type")
            .populate("read", "firstName lastName profilePicture uniqName")
            .populate("deliverd", "firstName lastName profilePicture uniqName")
            .sort({ createdAt: -1 })
            .skip(skipValue)
            .limit(limitValue)
            .lean(),
          DB.ChatModel.countDocuments({
            chatRoomId: new ObjectId(chatRoomId),
            receiver: { $in: [userId] },
          }),
          DB.ChatRoomModel.findById({
            _id: new ObjectId(chatRoomId),
          }).lean(),
        ]);

        console.log(totalCount, skipValue, limitValue, "-------------------------totalCount, skipValue, limitValue 3");

        await Promise.all(
          chatHistory.map(async (c) => {
            let isRead = false;
            let isDelivered = false;

            if (c.read && c.read.length == c.receiver.length) {
              isRead = true;
            }
            if (c.deliverd && c.deliverd.length == c.receiver.length) {
              isDelivered = true;
            }
            c.isRead = isRead;
            c.isDelivered = isDelivered;
          })
        );
        // const room = await DB.ChatRoomModel.findById({
        //   _id: new ObjectId(chatRoomId),
        // }).lean();

        const receiver = room.participants.filter((p) => p.toString() != userId.toString());
        const response = {
          reciver: receiver,
          sender: socket.user._id.toString(),
          success: true,
          messages: messages.SUCCESS,
          data: chatHistory,
          chatRoomId: chatRoomId.toString(),
          currentPage: pageValue,
          totalPages: Math.ceil(totalCount / limitValue),
          totalRecords: totalCount,
        };
        return io.to(userId.toString()).emit("chat-history", response);
      }

      // last message response
      async function lastMessageResponse(room, chat) {
        const userId = socket.user._id;
        const chatHistory = await DB.ChatModel.findOne({
          _id: chat._id,
          chatRoomId: new ObjectId(room._id),
          //  receiver: { $in: [userId] },
        })
          .populate("sender", "firstName lastName profilePicture uniqName")
          .populate("receiver", "firstName lastName profilePicture uniqName")
          .populate("replyTo", "message type")
          .populate("read", "firstName lastName profilePicture uniqName")
          .populate("deliverd", "firstName lastName profilePicture uniqName")
          //  .sort({ createdAt: -1 })
          .lean();

        console.log(chatHistory, "-------------------------lastMessageResponse 1");

        let isRead = false;
        let isDelivered = false;

        if (chatHistory.read && chatHistory.read.length == chatHistory.receiver.length) {
          isRead = true;
        }
        if (chatHistory.deliverd && chatHistory.deliverd.length == chatHistory.receiver.length) {
          isDelivered = true;
        }
        chatHistory.isRead = isRead;
        chatHistory.isDelivered = isDelivered;

        const receiver = await room.participants.filter((p) => p.toString() != userId.toString());
        const response = {
          reciver: receiver,
          sender: socket.user._id.toString(),
          data: chatHistory,
          chatRoomId: room._id.toString(),
        };
        console.log(response, "-------------------------lastMessageResponse 2");
        return response;
      }

      // fetch chat rooms list
      // socket.on("chat-room-list", async () =>
      // {
      //   console.log(socket.user._id, "---------------chatRoomList 1");

      //   try {
      //     const chatRooms = await DB.ChatRoomModel.find({
      //       participants: { $in: [socket.user._id] },
      //     })
      //       .populate("participants", "firstName lastName profilePicture onlineStatus userType uniqName")
      //       .populate("lastMessageBy", "firstName lastName")
      //       .sort({ updatedAt: -1 })
      //       .lean();

      //     console.log(chatRooms, "---------------chatRoomList 22");

      //     // filter all chat room (groups or single chat)
      //     let chatRoomList = await Promise.all(
      //       chatRooms.map(async (room) => {
      //         try {
      //           let name;
      //           const unreadCount = await DB.ChatModel.find({
      //             $and: [{ receiver: { $in: [socket.user._id] } }, { read: { $nin: [socket.user._id] } }, { chatRoomId: room._id }],
      //           });
      //           const MsgType = await DB.ChatModel.findOne({
      //             chatRoomId: new ObjectId(room._id),
      //             receiver: new ObjectId(socket.user._id),
      //           })
      //             .populate("sender", "firstName lastName uniqName")
      //             .sort({ createdAt: -1 })
      //             .limit(1);
      //           console.log(MsgType, "hi i am ----------------------------- MsgType");

      //           if (room.type === "group") {
      //             return {
      //               roomId: room._id,
      //               groupName: room.groupName,
      //               group_description: room.group_description,
      //               lastMessage: MsgType ? MsgType?.message || "" : null,
      //               lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
      //               lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
      //               unreadCount: unreadCount.length,
      //               lastMessageType: MsgType ? MsgType.type || "" : "",
      //               userType: room?.type || "group",
      //               isRoomActive: true,
      //               isDealCompleted: room?.isDealCompleted || false,
      //             };
      //           } else {
      //             const userData = room.participants.find((p) => p._id.toString() !== socket.user._id.toString());
      //             if (!MsgType) {
      //               return;
      //             }
      //             console.log(userData, "hi i am ----------------------------- single");
      //             return {
      //               roomId: room._id,
      //               name: `${userData?.firstName || ""} ${userData?.lastName || ""}`,
      //               profileImage: userData?.profilePicture || "",
      //               onlineStatus: userData?.onlineStatus,
      //               unreadCount: unreadCount?.length,
      //               lastMessageType: MsgType ? MsgType?.type || "" : "",
      //               lastMessage: MsgType ? MsgType?.message || "" : null,
      //               // lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
      //               lastMessageBy: MsgType ? `${MsgType.sender?.uniqName || ""}` : null,
      //               lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
      //               userType: room?.type || "single",
      //               isRoomActive: room.isRoomActive,
      //               uniqName: userData?.uniqName || "",
      //               isDealCompleted: room?.isDealCompleted || false,
      //             };
      //           }
      //         } catch (error) {
      //           console.error("Error processing room:", room._id, error);
      //           // Decide what to do with the error, e.g., return a default value or rethrow it
      //           throw error; // Rethrow to propagate the error to the outer scope
      //         }
      //       })
      //     );
      //     chatRoomList = await chatRoomList.filter((room) => room != null);

      //     // search chat room by uniq name of oppenent user
      //     console.log(chatRoomList, "------------------chatRoomList 3");

      //     // send chatRoomList to the client
      //     io.to(socket.user._id.toString()).emit("chat-room-list", chatRoomList);
      //   } catch (error) {
      //     console.error(error);
      //   }
      // });

      socket.on("chat-room-list", async (data = {}) => {
        const result = validateSocket(socketValidation.chatRoomList)(data);
        if (!result.success) {
          return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
        }
        const { search } = data;

        try {
          // let chatRooms = await DB.ChatRoomModel.find({
          //   participants: { $in: [socket.user._id] },
          // })
          //   .populate({
          //     path: "participants",
          //     select: "firstName lastName profilePicture onlineStatus userType uniqName",
          //   })
          //   .populate("lastMessageBy", "firstName lastName")
          //   .sort({ updatedAt: -1 })
          //   .lean();
          // if (search) {
          //   chatRooms = chatRooms.filter((room) => room.participants.some((p) => p.uniqName?.toLowerCase().includes(search.toLowerCase())));
          // }

          let pipeline = [
            {
              $match: {
                participants: socket.user._id,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "participants",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "lastMessageBy",
                foreignField: "_id",
                as: "lastMessageBy",
              },
            },
            { $unwind: { path: "$lastMessageBy", preserveNullAndEmptyArrays: true } },
          ];

          // apply search
          if (search) {
            pipeline.push({
              $match: {
                "participants.uniqName": { $regex: search, $options: "i" },
              },
            });
          }
          // apply sorting after searching condition 
          pipeline.push({ $sort: { updatedAt: -1 } });
          let chatRooms = await DB.ChatRoomModel.aggregate(pipeline);

          // filter all chat room (groups or single chat)
          let chatRoomList = await Promise.all(
            chatRooms.map(async (room) => {
              try {
                let name;
                const unreadCount = await DB.ChatModel.find({
                  $and: [{ receiver: { $in: [socket.user._id] } }, { read: { $nin: [socket.user._id] } }, { chatRoomId: room._id }],
                });
                const MsgType = await DB.ChatModel.findOne({
                  chatRoomId: new ObjectId(room._id),
                  receiver: new ObjectId(socket.user._id),
                })
                  .populate("sender", "firstName lastName uniqName")
                  .sort({ createdAt: -1 })
                  .limit(1);
                console.log(MsgType, "hi i am ----------------------------- MsgType");

                if (room.type === "group") {
                  return {
                    roomId: room._id,
                    groupName: room.groupName,
                    group_description: room.group_description,
                    lastMessage: MsgType ? MsgType?.message || "" : null,
                    lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
                    lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
                    unreadCount: unreadCount.length,
                    lastMessageType: MsgType ? MsgType.type || "" : "",
                    userType: room?.type || "group",
                    isRoomActive: true,
                    isDealCompleted: room?.isDealCompleted || false,
                  };
                } else {
                  const userData = room.participants.find((p) => p._id.toString() !== socket.user._id.toString());
                  if (!MsgType) {
                    return;
                  }
                  console.log(userData, "hi i am ----------------------------- single");
                  return {
                    roomId: room._id,
                    name: `${userData?.firstName || ""} ${userData?.lastName || ""}`,
                    profileImage: userData?.profilePicture || "",
                    onlineStatus: userData?.onlineStatus,
                    unreadCount: unreadCount?.length,
                    lastMessageType: MsgType ? MsgType?.type || "" : "",
                    lastMessage: MsgType ? MsgType?.message || "" : null,
                    // lastMessageBy: MsgType ? `${MsgType.sender?.firstName || ""} ${MsgType.sender?.lastName || ""}` : null,
                    lastMessageBy: MsgType ? `${MsgType.sender?.uniqName || ""}` : null,
                    lastMessageAt: MsgType ? MsgType.createdAt || "" : null,
                    userType: room?.type || "single",
                    isRoomActive: room.isRoomActive,
                    uniqName: userData?.uniqName || "",
                    isDealCompleted: room?.isDealCompleted || false,
                  };
                }
              } catch (error) {
                console.error("Error processing room:", room._id, error);
                // Decide what to do with the error, e.g., return a default value or rethrow it
                throw error; // Rethrow to propagate the error to the outer scope
              }
            })
          );
          chatRoomList = await chatRoomList.filter((room) => room != null);

          // search chat room by uniq name of oppenent user
          console.log(chatRoomList, "------------------chatRoomList 3");

          // send chatRoomList to the client
          io.to(socket.user._id.toString()).emit("chat-room-list", chatRoomList);
        } catch (error) {
          console.error(error);
        }
      });

      // create/get existing chat room
      socket.on("create-room", async (data) => {
        const result = validateSocket(socketValidation.createRoom)(data);
        if (!result.success) {
          return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
        }

        const { receiverId } = data;
        const userId = socket.user._id;

        const findChatRoom = await DB.ChatRoomModel.findOne({
          type: "single",
          participants: { $all: [userId, receiverId] },
          isDealCompleted: false,
        });

        let chatRoomId = "";
        if (findChatRoom) {
          chatRoomId = findChatRoom._id;
        } else {
          const chatRoom = await DB.ChatRoomModel.create({
            participants: [userId, receiverId],
            type: "single",
            // createdBy: userId,
          });
          console.log(chatRoom, "------------------chatRoom 1");
          chatRoomId = chatRoom._id;
        }

        io.to(userId.toString()).emit("get-one-room", {
          success: true,
          messages: messages.SUCCESS,
          data: chatRoomId,
        });
      });

      // fetch chat history of one chat room
      socket.on("chat-history", async (data) => {
        try {
          const result = validateSocket(socketValidation.chatHistory)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }

          const userId = socket.user._id;
          console.log(userId, "---------------userId chat-history 1");

          const { chatRoomId, page, limit } = data;

          // find chat room by id
          const roomData = await DB.ChatRoomModel.findById({
            _id: new ObjectId(chatRoomId),
          }).lean();

          if (!roomData) return socket.emit("error", "Room not found");

          socket.join(roomData._id.toString());

          // set user is online and add socketId to that user
          await DB.UserModel.findByIdAndUpdate(userId, { socketId: socket.id, onlineStatus: 1 }, { new: true });

          // Determine pagination values. Defaults: page 1, limit 10
          // const pageValue = parseInt(page) > 0 ? parseInt(page) : 1;
          // const limitValue = parseInt(limit) > 0 ? parseInt(limit) : 10;
          // const skipValue = (pageValue - 1) * limitValue;

          const room = io.sockets.adapter.rooms.get(roomData._id.toString());

          const recivedUserId = [socket.user._id];
          // find all delivered user ids
          const deliverd = await DB.UserModel.find({
            _id: { $in: roomData.participants },
            onlineStatus: 1,
            deletedAt: null,
          }).distinct("_id");

          // const deliverd = []
          if (room) {
            for (const socketId of room) {
              const socketData = io.sockets.sockets.get(socketId);
              const roomUserId = await DB.UserModel.findOne({ socketId: socketData.id }, { _id: 1 }).lean();
              if (!roomUserId || roomUserId?._id.toString() == socket.user?._id.toString()) {
                continue;
              }
              recivedUserId.push(roomUserId._id.toString());
            }
          }

          // const participants = roomData.participants.filter((p) => p.toString() != socket.user._id.toString());

          const chatUpdate = await DB.ChatModel.updateMany(
            {
              chatRoomId: new ObjectId(roomData._id),
              receiver: userId,
              read: { $nin: [userId] },
            },
            {
              $addToSet: {
                // read: recivedUserId,
                read: userId,
                deliverd,
              },
            }
          );

          console.log(chatUpdate, "----------------------------- chatUpdate 11111");

          if (chatUpdate?.modifiedCount > 0) {
            const onlineUser = await DB.UserModel.find({
              _id: { $in: roomData.participants },
              onlineStatus: 1,
              deletedAt: null,
              isActive: true,
            }).distinct("_id");

            onlineUser.map((p) => {
              chatHistoryReload(roomData._id, p);
            });
          }
          roomData.participants.map((p) => {
            io.to(p.toString()).emit("reload-chat-list", {
              success: true,
              messages: messages.SUCCESS,
            });
          });
          chatHistoryReload(roomData._id, null, page, limit);
        } catch (error) {
          console.log(`chat - history error: ${error} `);
          socket.emit("error", messages.FAILED);
        }
      });

      // send message to other user
      socket.on("send-message", async (data) => {
        try {
          const result = validateSocket(socketValidation.sendMessage)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }

          console.log(data, "---------------send-message 1");
          const { chatRoomId, message, replyTo, type = "single", msgType } = data;
          console.log(chatRoomId, message, replyTo, type, "-----------------------send-message 1");

          const roomData = await DB.ChatRoomModel.findById(chatRoomId).lean();
          if (!roomData) return socket.emit("error", "Room not found");

          socket.join(roomData._id.toString());

          const userId = socket.user.id;
          console.log(userId, "-----------------------user");

          const senderData = await DB.UserModel.findByIdAndUpdate(userId, { socketId: socket.id, onlineStatus: 1 }, { new: true });

          const room = io.sockets.adapter.rooms.get(roomData._id.toString());

          const recivedUserId = [socket.user._id];
          const deliverd = await DB.UserModel.find({
            _id: { $in: roomData.participants },
            onlineStatus: 1,
            deletedAt: null,
          });
          // .distinct("_id");  // get unique ids nor duplicates

          if (room) {
            for (const socketId of room) {
              // Get the socket object using the socket ID
              const socketData = io.sockets.sockets.get(socketId);

              const userId = await DB.UserModel.findOne({ socketId: socketData.id }, { _id: 1 }).lean();

              if (!userId || userId?._id.toString() == socket.user?._id.toString()) {
                continue;
              }

              recivedUserId.push(userId._id.toString());
            }
          }
          const chatUpdate = await DB.ChatModel.updateMany(
            {
              $and: [{ chatRoomId: roomData._id }, { receiver: userId }, { read: { $nin: userId } }],
            },
            {
              $addToSet: {
                read: recivedUserId,
                deliverd,
              },
            }
          );

          // const offlineUser = await DB.UserModel.find({
          //   onlineStatus: 0,
          //   _id: { $in: roomData.participants },
          //   fcmToken: { $ne: null },
          //   // userType: "user",
          //   deletedAt: null,
          // });

          // if (offlineUser.length) {
          //   await Promise.all(
          //     offlineUser.map(async (user) => {
          //       const title = roomData.type === "group" ? roomData.groupName : `${socket.user.firstName || ""} ${socket.user.lastName}`;

          //       if (user.fcmToken && user.fcmToken !== "") {
          //         await sendNotification(user.fcmToken, title, message, title, roomData._id.toString(), roomData.type);
          //       }
          //     })
          //   );
          // }
          const chat = await DB.ChatModel.create({
            sender: socket.user._id,
            receiver: roomData.participants,
            chatRoomId: roomData._id,
            message,
            replyTo: replyTo || null,
            read: recivedUserId,
            deliverd,
            type: type || "single",
            msgType: msgType || "text",
          });

          const chatRoom = await DB.ChatRoomModel.findByIdAndUpdate(roomData._id, {
            lastMessage: message,
            lastMessageBy: socket.user._id,
            lastMessageAt: new Date(),
          });

          console.log(deliverd, "------------------------deliverd 1");
          console.log(socket.user._id.toString(), "------------------------socket user id 2");

          deliverd.map(async (p) => {
            if (p.id.toString() !== socket.user._id.toString()) {
              console.log(p.id, "----------------------------- other user chat reload 3");

              chatHistoryReload(chatRoomId, p.id);
              chatRoomList(p.id);
              console.log(socket.user._id.toString(), "----------------------------- socketId 45");

              // send push notification to receiver
              if (p.fcmToken && p.fcmToken !== "") {
                await sendNotification(
                  p.fcmToken,
                  `new msg received from ${senderData.uniqName}`,
                  message,

                  chatRoomId,
                  msgType,
                  // "name",
                );
              }
            } else if (p.id.toString() == socket.user._id.toString()) {
              chatRoomList(p.id);
              const singleMesRes = await lastMessageResponse(chatRoom, chat);
              io.to(userId).emit("reload-chat-list", {
                success: true,
                messages: messages.SUCCESS,
                data: singleMesRes, // sender response, receiver response
              });
            }
          });
        } catch (error) {
          console.log(`send - message error: ${error} `);
          socket.emit("error", messages.FAILED);
        }
      });

      // send voice call
      socket.on("send-call", async (data) => {
        try {
          const result = validateSocket(socketValidation.sendCall)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }

          const { receiverId, chatRoomId } = data;
          const userId = socket.user._id;
          console.log(receiverId, chatRoomId, "-----------------------send-call 1");

          const [room, sender, receiver] = await Promise.all([DB.ChatRoomModel.findById(chatRoomId).lean(), DB.UserModel.findById(userId).lean(), DB.UserModel.findById(receiverId).lean()]);

          if (!room) return socket.emit("error", "Room not found");
          if (!receiver) return socket.emit("error", "Receiver not found");

          if (!receiver.onlineStatus) {
            return socket.emit("error", messages.OFFLINE(receiver.uniqName));
          }

          if (receiver.hasActiveVoiceCall) {
            return socket.emit("error", messages.CALL_BUSY(receiver.uniqName));
          }

          // update both user voice call status
          await DB.UserModel.updateMany({ _id: { $in: [userId, receiverId] } }, { $set: { hasActiveVoiceCall: true } });

          const response = {
            roomId: room._id,
            profileImage: receiver?.profilePicture || "",
            onlineStatus: receiver?.onlineStatus,
            isRoomActive: room.isRoomActive,
            isDealCompleted: room?.isDealCompleted || false,
            sender: {
              _id: sender._id,
              firstName: sender?.firstName,
              lastName: sender?.lastName,
              profileImage: sender?.profilePicture || "",
              onlineStatus: sender?.onlineStatus || false,
              uniqName: sender?.uniqName || "",
            },
            receiver: {
              _id: receiver._id,
              firstName: receiver?.firstName,
              lastName: receiver?.lastName,
              profileImage: receiver?.profilePicture || "",
              onlineStatus: receiver?.onlineStatus || false,
              uniqName: receiver?.uniqName || "",
            },
          };

          io.to(receiverId).emit("incoming-call", {
            success: true,
            messages: messages.SUCCESS,
            data: response,
          });

          // new push notification to call receiver
          if (receiver.fcmToken && receiver.fcmToken !== "") {
            await sendNotification(
              receiver.fcmToken,
              `Incoming voice call from ${sender.uniqName}`,
              "Tap to join the call",

              chatRoomId,
              CHAT_MSG_TYPE.VOICE_CALL
              // "type"
            );
          }
        } catch (error) {
          console.log(`leave - room error: ${error} `);
          return socket.emit("error", messages.FAILED);
        }
      });

      // receive voice call
      socket.on("receive-call", async (data) => {
        try {
          const result = validateSocket(socketValidation.receiveCall)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }

          const { chatRoomId, senderId } = data;
          const userId = socket.user._id;

          const [room, senderData] = await Promise.all([DB.ChatRoomModel.findById(chatRoomId).lean(), DB.UserModel.findById(senderId).lean()]);

          if (!room) return socket.emit("error", "Room not found");
          if (!senderData) return socket.emit("error", "Sender not found");

          // update both user voice call status
          await DB.UserModel.findByIdAndUpdate({ _id: userId }, { $set: { hasActiveVoiceCall: true } });

          // const response = {
          //   roomId: chatRoomId,
          //   name: `${senderData?.firstName || ""} ${senderData?.lastName || ""}`,
          //   profileImage: senderData?.profilePicture || "",
          //   // onlineStatus: senderData?.onlineStatus || false,
          //   isRoomActive: room.isRoomActive,
          //   isDealCompleted: room?.isDealCompleted || false,
          //   uniqName: senderData?.uniqName || "",
          // };

          // io.to(socket.id).emit("receive-call", {
          //   success: true,
          //   messages: messages.SUCCESS,
          //   data: response,
          // });

          // send notification to the sender (that his call is answered)
        } catch (error) {
          console.log(`receive - call error: ${error} `);
          return socket.emit("error", messages.FAILED);
        }
      });

      // end voice call
      socket.on("end-call", async (data) => {
        try {
          const result = validateSocket(socketValidation.endCall)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }

          const { chatRoomId, senderId, receiverId } = data;

          // fetch updated sender & receiver data
          const [sender, receiver] = await Promise.all([DB.UserModel.findById(senderId), DB.UserModel.findById(receiverId)]);

          if (!receiver) return socket.emit("error", "Receiver not found");
          if (!sender) return socket.emit("error", "Sender not found");

          await DB.UserModel.updateMany({ _id: { $in: [senderId, receiverId] } }, { $set: { hasActiveVoiceCall: false } });

          // push notification to both user that call is ended
          // helper to send call end notification
          async function sendCallEndNotification(fcmToken, otherUser, roomId, type) {
            await sendNotification(
              fcmToken,
              `Call with ${otherUser.uniqName} has ended`,
              "The call is over",

              "name",
              "roomId",
              "type"
            );
          }

          // call end push notification to both users
          await Promise.all([sendCallEndNotification(receiver.fcmToken, sender, "roomId", "type"), sendCallEndNotification(sender.fcmToken, receiver, "roomId", "type")]);
        } catch (error) {
          console.log(`end - call error: ${error} `);
          return socket.emit("error", messages.FAILED);
        }
      });

      // leave socket room
      socket.on("leave-room", async (data) => {
        try {
          const result = validateSocket(socketValidation.leaveRoom)(data);
          if (!result.success) {
            return socket.emit("error", result.errors || messages.REQUIRED_FIELDS);
          }
          socket.leave(data.chatRoomId.toString());
          // await DB.UserModel.findByIdAndUpdate(socket.user._id, { socketId: socket.id }, { new: true });
        } catch (error) {
          console.log(`leave - room error: ${error} `);
          return socket.emit("error", messages.FAILED);
        }
      });

      socket.on("disconnect", async () => {
        try {
          console.log("User disconnected------------------ 111111111", socket.user._id);
          await DB.UserModel.findByIdAndUpdate(socket.user._id, { socketId: null, onlineStatus: 0, lastSeen: new Date() }, { new: true });
        } catch (error) {
          console.log(`disconnect error: ${error} `);
        }
      });

      // pending for integration
      socket.on("deleteForMe", async (data) => {
        const { chatId, chatRoomId } = data;
        if (!chatId) return socket.emit("error", messages.REQUIRED_FIELDS);
        const chat = await DB.ChatModel.find({ _id: { $in: chatId } }).lean();
        if (!chat.length) {
          return socket.emit("error", "Chat not found");
        }

        chat.map(async (c) => {
          await DB.ChatModel.findOneAndUpdate(
            { _id: new ObjectId(c._id) },
            {
              $pull: {
                receiver: socket.user._id,
                read: socket.user._id,
                deliverd: socket.user._id,
              },
            }
          );
        });

        // find roomData
        const roomData = await DB.ChatRoomModel.findOne({
          _id: new ObjectId(chatRoomId),
        });

        // find participants
        const participants = await DB.UserModel.find({
          _id: { $in: roomData.participants },
          onlineStatus: 1,
          deletedAt: null,
        }).distinct("_id");

        participants.map((p) => {
          chatHistoryReload(roomData._id, p);
          io.to(p.toString()).emit("reload-chat-list", {
            success: true,
            messages: messages.SUCCESS,
          });
        });

        // chatHistoryReload(chatRoomId);
        //         io.to(socket.user._id.toString()).emit("reload-chat-list", {
        //           success: true,
        //           messages: messages.SUCCESS,
        //         });
      });

      // pending for integration
      socket.on("deleteForAll", async (data) => {
        const { chatId, chatRoomId } = data;
        if (!chatId) return socket.emit("error", messages.REQUIRED_FIELDS);
        // const chatRemove = await DB.ChatModel.deleteMany({ _id: { $in: chatId } });
        const chatUpdate = await DB.ChatModel.updateMany({ _id: { $in: chatId } }, { $unset: { receiver: "" } });
        // let roomData = await DB.ChatRoomModel.findById({_id:new ObjectId(chatRoomId)}).lean();

        // if (chatUpdate?.modifiedCount > 0) {
        //   socket.join(roomData._id.toString());
        //   io.to(roomData._id.toString()).emit("reloadChatHistory", {
        //     success: true,
        //     messages: messages.SUCCESS,
        //   });
        //   const deliverd = await DB.UserModel.find({
        //     _id: { $in: roomData.participants },
        //     onlineStatus: 1,
        //     deletedAt: null,
        //   }).distinct("_id");
        //   deliverd.map((p) => {
        //     chatHistoryReload(roomData._id, p);
        //   });
        // } else {
        //   return socket.emit("error", "Chat not found");
        // }

        // find roomData
        const roomData = await DB.ChatRoomModel.findOne({
          _id: new ObjectId(chatRoomId),
        });

        // find participants
        const participants = await DB.UserModel.find({
          _id: { $in: roomData.participants },
          onlineStatus: 1,
          deletedAt: null,
        }).distinct("_id");

        participants.map((p) => {
          chatHistoryReload(roomData._id, p);
          io.to(p.toString()).emit("reload-chat-list", {
            success: true,
            messages: messages.SUCCESS,
          });
        });
      });

      //
    });
    return {
      emit({ event, data, room }) {
        try {
          if (!event) throw new Error("Event is required");
          if (!data) throw new Error("Data is required");

          if (room) {
            io.to(room).emit(event, data);
          } else {
            io.emit(event, data);
          }
        } catch (error) {
          console.log("socket emit error: ", error);
        }
      },
    };
  },
};
