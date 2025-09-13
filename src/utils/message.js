module.exports = {
  NO_DATA: (str) => `${str} does not exist.`,
  DATA_EXIST: (str) => `${str} already exists.`,
  REQUIRED: (str) => `${str} is required.`,
  CALL_BUSY: (str) => `${str} is currently on another call.`,
  CALL_ENDED: "Call has been ended.",
  CALL_REJECTED: "Call has been rejected.",
  OFFLINE: (str) => `${str} is currently offline.`,

  GET_LIST: (str) => `${str} list retrieved successfully.`,
  GET_DATA: (str) => `${str} data retrieved successfully.`,

  LOGIN_SUCCESS: "Logged in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  SIGNUP_SUCCESS: "Signed up successfully.",

  VERIFIED: (str) => `${str} verified successfully.`,

  ADD_DATA: (str) => `${str} data added successfully.`,
  CREATED: (str) => `${str} created successfully.`,
  ADD_DATA_FAILED: (str) => `Failed to add ${str} data.`,

  UPDATE_DATA: (str) => `${str} data updated successfully.`,
  UPDATE_FAILED: (str) => `Failed to update ${str} data.`,

  DELETE_PROFILE: (str) => `${str} deleted successfully.`,

  SENT_EMAIL: (str) => `${str} has been sent to your registered email.`,

  INVALID: (str) => `${str} is invalid.`,
  EXPIRED: (str) => `${str} has expired.`,
  NOT_VERIFIED: (str) => `${str} is not verified.`,

  INVALID_CREDENTIALS: "Invalid credentials.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
  SERVER_IS_HEALTHY_AND_RUNNING: "Server is healthy and running.",
  UNAUTHORIZED: "Unauthorized access.",
  INVALID_TOKEN: "Invalid token.",
  ROUTE_NOT_FOUND: "Route not found.",
  TOKEN_REQUIRED: "Authentication token is required.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  FAILED: "Failed.",
  REQUIRED_FIELDS: "Required fields missing.",
  SUCCESS: "Success.",
  INVALID_FILE: "File upload error.",
  FILE_UPLOADED: "File uploaded successfully",
  IMAGE_REQUIRED: "Image required",
  FAILED_TO_GENERATE_AGORA_TOKEN: "Failed to generate Agora token.",
  ADD_CURRENCYRATE_FIRST: "Please add your first currency rate.",
  DEACTIVATED: "Your account has been deactivated. Please contact the administrator.",
};
