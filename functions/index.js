// Core
const functions = require("firebase-functions");
const app = require("express")();

// Helpers
const { admin, db } = require("./util/admin");
const FBAuth = require("./util/FBAuth");

// Route Handlers
const { signup, login, resendVerificationEmail } = require("./handlers/auth");
const { explore, like, pass } = require("./handlers/explore");
const {
  uploadImage,
  removeImage,
  addUserDetails,
  getAuthenticatedUserDetails,
  getUserDetails,
  getNotifications,
  markNotificationsRead,
  markMessagesRead,
} = require("./handlers/users");
const { getMatches, unmatchUser } = require("./handlers/matches");
const { getAllConversations, getConversation, sendMessage } = require("./handlers/conversations");
const { reportUser } = require("./handlers/mgmt");

// Auth Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/resendVerification", resendVerificationEmail);

// Explore Routes
app.get("/explore", FBAuth, explore);
app.post("/like/:uid", FBAuth, FBAuth, like);
app.post("/pass/:uid", FBAuth, pass);

// User Routes
app.post("/user/photo", FBAuth, uploadImage);
app.delete("/user/photo", FBAuth, removeImage);
app.patch("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUserDetails);
app.get("/user/:uid", FBAuth, getUserDetails);
app.get("/notifications", FBAuth, getNotifications);
app.post("/notifications", FBAuth, markNotificationsRead);
app.post("/messages", FBAuth, markMessagesRead);

// Match Routes
app.get("/matches", FBAuth, getMatches);
app.delete("/matches/:uid", FBAuth, unmatchUser);

// Conversation Routes
app.get("/conversations", FBAuth, getAllConversations);
app.get("/conversations/:cid", FBAuth, getConversation);
app.post("/conversations", FBAuth, sendMessage);

// Management
app.post("/report/", FBAuth, reportUser);

exports.api = functions.https.onRequest(app);

// Add or remove user from pool when they update their visibility
exports.onVisibilityChange = functions.firestore.document("users/{email}").onUpdate((change) => {
  if (change.before.data().visible === false && change.after.data().visible === true) {
    // Add user to pool
    return db
      .doc(`/groups/${change.after.data().gender}`)
      .update({
        uids: admin.firestore.FieldValue.arrayUnion(change.after.data().uid),
      })
      .catch((err) => {
        console.error(err);
      });
  } else if (change.before.data().visible === true && change.after.data().visible === false) {
    // Remove user from pool
    return db
      .doc(`/groups/${change.after.data().gender}`)
      .update({
        uids: admin.firestore.FieldValue.arrayRemove(change.after.data().uid),
      })
      .catch((err) => {
        console.error(err);
      });
  } else return true;
});
