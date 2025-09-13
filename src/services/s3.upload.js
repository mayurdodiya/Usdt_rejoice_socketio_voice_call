const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const s3 = new aws.S3();

const fileFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|mp4|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (extname && mimetype) {
    cb(null, true);
  } else {
    return cb(new Error("Only JPEG, JPG, PNG, MP4, MOV, AVI, and MKV files are allowed"));
  }
};

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.BUCKET,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.originalname });
//     },
//     key: function (req, file, cb) {
//       cb(null, "/upload" + "-" + Math.floor(Math.random() * 1000) + "." + file.mimetype.split("/")[1]);
//     },
//   }),
//   fileFilter,
//   limits: {
//     files: 10,
//     fileSize: 2 * 1024 * 1024, // 2MB limit
//   },
// });

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.originalname });
    },
    key: function (req, file, cb) {
      cb(null, "upload-" + Date.now() + "-" + Math.floor(Math.random() * 1000) + path.extname(file.originalname).toLowerCase());
    },
  }),
  fileFilter,
  limits: {
    files: 10,
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const localUpload = multer({ storage: storage });

module.exports = { upload, localUpload };
