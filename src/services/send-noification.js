const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("../json/firebaseConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = (fcmToken, title, message, chatRoomId, msgType = "text" /* , name */) => {
  const payload = {
    notification: {
      title: title,
      body: message,
    },
    data: {
      chatRoomId: chatRoomId,
      msgType: msgType,
      // name: senderData.uniqName,
    },
    token: fcmToken,
  };

  // Send the notification
  return admin
    .messaging()
    .send(payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error.message);
    });
};

module.exports = { sendNotification };
