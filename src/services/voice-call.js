const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const generateAgoraToken = (uid, channelName) => {
  // If you set PUBLISHER → the user can speak in the call.
  // If you set SUBSCRIBER → the user can only listen/watch.
  const role = RtcRole.PUBLISHER;

  // Token expiry (e.g., 1 hour)
  const expireTime = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  // Generate the token
  const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);

  return token;
};

module.exports = { generateAgoraToken };
