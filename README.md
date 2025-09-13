📌 USDT Agent Chat & Voice Project
🚀 About the Project

This project allows users to buy and sell USDT through agents, with real-time communication features:

Buy/Sell USDT with agents.

Real-time chat between users and agents.

Voice calls between users and agents using Agora, without exposing phone numbers.
1. user can buy and sell usdt to agent project
2. user call chat with agent
3. user can voice call without number to the agent

# functionality
1. socket io for chat
    added joi validation for all socket event
    added fcm push notification for all new message
2. agora voice call in app(by internet)

🔧 Functionality
💬 Chat System (Socket.IO)

Real-time chat using Socket.IO.

Joi validation added for all socket events.

FCM push notifications for all new messages.

🔹 Socket.IO Basics

Socket (single client):

socket.emit → Send msg to current client (sender).

socket.on → Listen for event from client.

socket.to(room).emit / socket.in(room).emit → Send msg to all in room (except sender).

socket.join(room) → Add client to room.

socket.leave(room) → Remove client from room.

socket.timeout(ms).emit → Send msg with ack timeout.

IO (server / all clients):

io.emit → Send msg to all clients.

io.to(room).emit / io.in(room).emit → Send msg to all in room (including sender).

io.of(namespace) → Create/use namespace (separate channel).

io.use(middleware) → Add middleware (e.g., auth).

io.on("connection") → Listen for new client connections.

io.handshake → Access client connection details.

io.engine → Low-level Engine.IO access.

Token Handling:

Get token from:

socket.handshake.auth.token


Verify token → attach user to socket (socket.user = user).

📌 Socket Events
🔹 Necessary Events (Backend on listeners):

chatRoomList

chatHistoryReload

lastMessageResponse

chat-room-list

create-room

chat-history

send-message

leave-room

disconnect

🔹 Backend emit events:

emit("chat-room-list", chatRoomList)

emit("chat-history", response)

emit("error", result.errors || messages.REQUIRED_FIELDS)

emit("get-one-room")

emit("reload-chat-list")

⚙️ Socket Implementation Flow

(Reference: USDT Rejoice Project)

Authentication & Connection

Client connects with token (socket.handshake.auth.token).

Verify token and set socket.user.

Mark user as online in DB.

On connect → update all chatroom messages for that user as delivered.

Emit chatRoomList to client with updated chatroom list.

Chat Room List

Create chatRoomList event with search + pagination.

Return unread count, latest message first.

For one-to-one chat → display opponent username.

On connect → mark all messages as delivered.

Create Chat Room

Event: create-room.

If chat room exists → return existing ID.

Else → create new chatroom and return new ID.

Get Chat History

Event: chat-history.

Fetch messages for room ID.

When user opens chat → mark messages as read.

Emit update to opponent (blue tick).

Send Message

Event: send-message.

On new msg → reload chatroom list for both users.

Update unread count for others.

Deliver/seen (blue tick) flow management.

Push notification via FCM.

Leave Room

Event: leave-room.

Remove user from chatroom socket.

Disconnect

Event: disconnect.

Mark user as offline in DB.

📞 Voice Call (Agora)

Integrated Agora SDK for voice calling.

Calls between user ↔ agent without exposing phone numbers.

Secure real-time audio channel.

✅ Summary

USDT Trade between users and agents.

Real-time chat with delivery/read status.

Push notifications for new messages.

Agora voice calls without phone numbers.

Secure token-based authentication for sockets.