const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { default: helmet } = require("helmet");
const connectDB = require("./db/dbConnection");
const { Server } = require("socket.io");
const http = require("http");

const routes = require("./routes");
const logger = require("./config/logger");
const message = require("./utils/message");
const morgan = require("./config/morgan");
const multer = require("multer");
const setSocket = require("./utils/socket");
const apiResponse = require("./utils/api.response");
const seeder = require("./seeder/index");

const app = express();
app.use(express.json());

const server = http.createServer(app);
// const io = new Server(server);

// Db connection.
connectDB()
  .then(() => {
    server.listen(process.env.PORT ?? 3000, "0.0.0.0", () => {
      logger.info(`Server is running on: http://localhost:${process.env.PORT ?? 3000}`);
    });
  })
  .catch((error) => {
    console.log(`error`, error);
  });

// seeder
// seeder();

// socket implementation
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
setSocket.init(io);
app.use(express.static(__dirname + "/views"));

app.options("*", cors());
app.use(cors({ origin: "*" }));
app.use(helmet());

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

app.use("/api/v1", routes);

app.use((err, req, res, next) => {
  console.log(err, "-----err", new Date());
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return apiResponse.PAYLOAD_TOO_LARGE({ res, message: "Size should not exceed 2MB" });
    }
  }

  if (err.message === "File too large") {
    return apiResponse.PAYLOAD_TOO_LARGE({ res, message: "Size should not exceed 2MB." });
  }

  // other errors
  return apiResponse.CATCH_ERROR({ res, message: "Internal Server Error", error: err.message });
});

app.use((req, res, next) => {
  return apiResponse.NOT_FOUND({ res, message: message.ROUTE_NOT_FOUND });
});
