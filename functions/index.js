// Core
const functions = require("firebase-functions");
const app = require("express")();

// Cors
const cors = require("cors");
app.use(cors());

// Nodemailer
const { transporter, reportMail, messageMail, matchMail } = require("./util/nodemailer");

// Helpers
const { admin, db } = require("./util/admin");
const FBAuth = require("./util/FBAuth");

// Route Handlers
const {
  signup,
  login,
  token,
  resendVerificationEmail,
  changePassword,
  forgotPassword,
} = require("./handlers/auth");
const { explore, like, pass } = require("./handlers/explore");
const {
  uploadImage,
  removeImage,
  rearrangeImage,
  updateUserProfile,
  updateUserSettings,
  getAuthenticatedUserProfile,
  getAuthenticatedUserSettings,
  getUserDetails,
  getNotifications,
  markNotificationsRead,
  markMessagesRead,
} = require("./handlers/users");
const { getMatches, unmatchUser } = require("./handlers/matches");
const { getAllConversations, getConversation, sendMessage } = require("./handlers/conversations");
const { reportUser, resetSwipeCount, test } = require("./handlers/mgmt");

// Auth Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/token", token);
app.post("/resendVerification", FBAuth, resendVerificationEmail);
app.post("/password", FBAuth, changePassword);
app.post("/forgot", forgotPassword);

// Explore Routes
app.get("/explore", FBAuth, explore);
app.get("/explore/:uid/like", FBAuth, like);
app.get("/explore/:uid/pass", FBAuth, pass);

// User Routes
app.post("/user/photo", FBAuth, uploadImage);
app.post("/user/photo/delete", FBAuth, removeImage);
app.post("/user/photo/rearrange", FBAuth, rearrangeImage);
app.patch("/user", FBAuth, updateUserProfile);
app.get("/user", FBAuth, getAuthenticatedUserProfile);
app.patch("/settings", FBAuth, updateUserSettings);
app.get("/settings", FBAuth, getAuthenticatedUserSettings);
app.get("/user/:uid", FBAuth, getUserDetails);
app.get("/notifications", FBAuth, getNotifications);
app.post("/notifications", FBAuth, markNotificationsRead);
app.post("/messages", FBAuth, markMessagesRead);

// Match Routes
app.get("/matches", FBAuth, getMatches);
app.post("/matches", FBAuth, unmatchUser);

// Conversation Routes
app.get("/conversations", FBAuth, getAllConversations);
app.get("/conversations/:uid", FBAuth, getConversation);
app.post("/conversations", FBAuth, sendMessage);

// Management
app.post("/report/", FBAuth, reportUser);
app.post("/count", FBAuth, resetSwipeCount);
app.post("/test", FBAuth, test);

exports.api = functions.https.onRequest(app);
