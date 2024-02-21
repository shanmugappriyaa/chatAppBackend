const express = require("express");
// const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
const AppRoutes = require("./src/routes");
// const User = require('./models/User');
const Message = require("./src/models/Message");
const ws = require("ws");
const fs = require("fs");

dotenv.config();
// mongoose.connect(process.env.dbUrl, (err) => {
//   if (err) throw err;
// });
const Port = process.env.port;
const app = express();

const jwtSecret = process.env.JWT_SECRET;
cloudinary.config({
  cloud_name: 'dqnpuy2bs',
  api_key: '436152527162723',
  api_secret: 'BBwJHcJJIwtoSXyl6zjtjLe3syw'
});
app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// app.use("/uploads", express.static(__dirname + "/uploads"));
app.get("/uploads/:filename", (req, res) => {
  // Construct the Cloudinary URL based on the filename provided in the request
  const cloudinaryUrl = `https://res.cloudinary.com/dqnpuy2bs/image/upload/${req.params.filename}`;

  // Redirect the client to the Cloudinary URL
  res.redirect(cloudinaryUrl);
});
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use("/", AppRoutes);

// app.listen(Port, () => console.log(`server listening in  ${Port}`));
const server = app.listen(Port);

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  console.log("wss connected");

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            userName: c.userName,
          })),
        })
      );
    });
  }
  connection.setAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.setAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log("dead");
    }, 1000);
  }, 5000);
  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, userName } = userData;
          connection.userId = userId;
          connection.userName = userName;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    // console.log("messageData-------->", messageData);
    let filename = null;
    const { recipient, text, file } = messageData;
    if (file) {
      const parts = file.name.split(".");
      const ext = parts[parts.length - 1];
      filename = Date.now() + "." + ext;
      // const path = __dirname + "/uploads/" + filename;
      // console.log("path-->",path)
      // const bufferData = new Buffer(file.data.split(",")[1], "base64");
      // fs.writeFile(path, bufferData, () => {
      //   console.log("file saved:" + path);
      // });
      const bufferData = Buffer.from(file.data.split(",")[1], "base64");

      // Upload file to Cloudinary
      cloudinary.uploader.upload_stream({ resource_type: 'raw' }, (error, result) => {
        if (error) {
          console.error("Error uploading file to Cloudinary:", error);
        } else {
          console.log("File uploaded successfully to Cloudinary:", result.secure_url);
          // Here you can perform any additional actions, such as saving the Cloudinary URL to a database
        }
      }).end(bufferData);
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      // console.log("created message");
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              file: file ? filename : null,
              _id: messageDoc._id,
            })
          )
        );
    }
  });
  notifyAboutOnlinePeople();
});
