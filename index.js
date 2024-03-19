import express from "express";
import fs from "fs";
import morgan from "morgan";
import "dotenv/config";

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.static("public"));
app.use(morgan("dev"));

const SIGNATURE = {
  iVBORw0KGgo: "png",
  "/9j/4A": "jpg",
};

function getCurrentDateTimeString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}_${minutes}_${seconds}`;
}

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function checkSignature(b64) {
  for (const sign in SIGNATURE) {
    if (b64.startsWith(sign)) {
      return SIGNATURE[sign];
    }
  }
  return "";
}

const checkApiAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey != process.env.API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const removeBase64InfoMiddleware = async (req, res, next) => {
  let info = req.body.image;
  let result = await info.split(",").pop();
  req.body.image = result;
  next();
};

const checkSignatureMiddleware = (req, res, next) => {
  let image = req.body.image;
  if (checkSignature(image) === "") {
    return res.status(400).json({ message: "Bad Request" });
  }
  next();
};

app.post(
  "/upload",
  checkApiAuthMiddleware,
  removeBase64InfoMiddleware,
  checkSignatureMiddleware,
  (req, res) => {
    let name =
      req.body.name != undefined
        ? `${req.body.name}_`
        : `${generateRandomString(10)}_`;
    let image = req.body.image;
    name += `${getCurrentDateTimeString()}`;
    let urlName = `${name}.${checkSignature(image)}`;
    fs.writeFile(`./public/${urlName}`, image, "base64", function (err) {
      console.error(err);
    });
    return res.status(200).json({
      imageUrl: urlName,
    });
  }
);

app.listen(process.env.PORT, function (err) {
  if (err) console.log(err);
  console.log(`Server is running at ${process.env.PORT}`);
});
