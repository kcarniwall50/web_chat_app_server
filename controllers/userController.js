const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const tokenModel = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");



const signUp = async (req, res) => {
  const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
  };

  const { name, email, password } = req.body;
  try {
    // checking if user exists
    const user = await userModel.findOne({ email: email }, { password: 0 });

    if (user) {
      return res.status(200).send("user already exist");
    }

    const newUser = {
      name,
      email,
      password,
    };
    const userCreated = await userModel.create(newUser);
    res.status(201).json(userCreated);
  } catch (e) {
    return res.status(500).send(error.message);
  }
}

const login = async (req, res) => {
  const { email, password } = req.body;

  // checking if user exists
  const user = await userModel.findOne({ email: email });

  try {
    if (!user) {
      return res.status(404).send("user does not exist");
    } else {
      const IsPasswordCorrect = await bcrypt.compare(password, user.password);
      if (IsPasswordCorrect) {
        const generateToken = (id) => {
          return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
          });
        };

        // generating token
        let userToken = generateToken(user._id);

        res.cookie("chatUserToken", userToken, {
          path: "/",
          httpOnly: true,
          expires: new Date(Date.now() + 1000 * 86400), // 1 day
          sameSite: "none",
          secure: true,
        });
        const userInfo = {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isAvatarSet: user.isAvatarSet,
        };
        res.status(200).json(userInfo);
      } else {
        return res.status(401).send("password is not correct");
      }
    }
  } catch (error) {
    console.log("err", error, ",,");
    res.status(500).send(error);
  }
}

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).json("User is not registered");
  }

  const token = await tokenModel.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // creating reset token
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // save in token model
  await new tokenModel({
    userId: user._id,
    token: hashedResetToken,
    createdAt: Date.now(),
  }).save();

  // constructing reset url
  const resetURL = `${process.env.Frontend_URL}/resetPass/${resetToken}`;

  const subject = "Password Reset Request";
  const sent_from = process.env.Email_User;
  const send_to = user.email;
  const message = `
  <h2>Hello, ${user.name}</h2>
  <p>You have requested for reset password</p>
  <p>   Below is reset password link, please update your password </p>
  <br/>
  <a href=${resetURL} backtracking=off>${resetURL}</a>
  <br/>
  <p>regards...</p>
  <p>ChatApp Team</p>
  `;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json("Password Reset Email Sent ");
  } catch (error) {
    console.log(error);
    res.status(500).json("Email not sent, Please try again");
  }
}

const resetPassword =  async (req, res) => {
  const { password } = req.body;

  const { resetToken } = req.params;
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const userToken = await tokenModel.findOne({
    token: hashedToken,
  });
  if (!userToken) {
    res.status(400).send("Invalid or expired token");
  }

  const user = await userModel.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json("Password reset successfully, Please login");
}


const getAllUsers = async (req, res) => {
  try {
    const userToken = req.cookies.chatUserToken;

    // token verify
    const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);

    const user = await userModel.findById(
      { _id: verified.id },
      { password: 0 }
    );
    if (!user) {
      return res.status(404).send("User not Found");
    }

    const allUsers = await userModel.find(
      { _id: { $ne: user._id } },
      { password: 0 }
    );
    res.status(200).json({ allUsers: allUsers, currentUser: user });
  } catch (e) {
    res.status(500).json(e.message);
    console.log(e);
  }
}

const setAvatar =  async (req, res) => {
  const url = req.body.URL;

  try {
    const userToken = req.cookies.chatUserToken;

    // token verify
    const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
    const user = await userModel.findById(verified.id);
    if (!user) {
      return res.status(404).send("User not Found");
    }
    user.avatar = url;
    user.isAvatarSet = true;

    await user.save();
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json(e.message);
    console.log(e);
  }
}

module.exports = { signUp, login, forgotPassword, resetPassword, getAllUsers, setAvatar };