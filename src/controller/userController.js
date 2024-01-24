const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const auth = require("../common/auth");
const jwtSecret = process.env.JWT_SECRET;
var Cookies = require("cookies");

async function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}
const logout = async (req, res) => {
  res.cookie("token", "", { sameSite: "none", secure: true }).json("ok");
};

const registerUser = async (req, res) => {
  const { userName, password } = req.body;
  try {
    const hashedPassword = await auth.hashPassword(req.body.password);
    const createdUser = await userModel.create({
      userName,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createdUser._id, userName },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;

        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const loginUser = async (req, res) => {
  try {
    let user = await userModel.findOne({ userName: req.body.userName });
    console.log(user);
    if (user) {
      let passCheck = await auth.hashCompare(req.body.password, user.password);
      console.log("passCheck=======> ", passCheck);
      if (passCheck) {
        res.status(200).send({
          message: "login Successful",
        });
      } else {
        res.status(500).send({
          message: "Invalid Password",
        });
      }
    } else {
      res.status(400).send({
        message: `Account with ${req.body.userName} does not exist`,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const profile = async (req, res) => {
  const token = req.cookies?.token;
  try {
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        res.json(userData);
      });
    } else {
      res.status(401).send({
        message: "No token",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const userMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("userId------>", userId);
    const userData = await getUserDataFromReq(req);
    console.log("userData------>", userData);
    const ourUserId = userData.userId;
    console.log("ourUserId------>", ourUserId);
    const mesaages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    console.log("mesaages------>", mesaages);
    res.json(mesaages);
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const people = async (req, res) => {
  try {
    const users = await userModel.find({}, { _id: 1,userName:1 });
    res.json(users);
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  profile,
  userMessages,
  logout,
  people,
};
