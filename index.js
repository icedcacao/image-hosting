import express from "express";
import multer from "multer";
import "dotenv/config";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    const saveName = (uniqueSuffix + "-" + file.originalname).replace(
      /\s/g,
      ""
    );
    cb(null, saveName);
  },
});

const whiteListMime = ["image/jpeg", "image/jpg", "image/png"];

async function fileFilter(req, file, cb) {
  if (!whiteListMime.includes(file.mimetype)) {
    return cb(new Error("Bad Request!"));
  }
  cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

const app = express();

app.use(express.json());
app.use(express.static("public"));

const authApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey != process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
  next();
};

app.post("/upload", authApiKey, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "Bad Request!" });
    }
    return res.json({ path: req.file.filename });
  });
});
app.listen(process.env.PORT, function (err) {
  if (err) console.log(err);
  console.log(`Server is running at ${process.env.PORT}`);
});
