// Core
const functions = require("firebase-functions");
const app = require("express")();

// Cors
const cors = require("cors");
app.use(cors());

// Nodemailer
const { transporter, reportMail, messageMail, matchMail } = require("./util/nodemailer");

// Moderation
const { moderateMessage } = require("./util/moderation");

// Helpers
const { admin, db } = require("./util/admin");
const FBAuth = require("./util/FBAuth");

// Route Handlers
const { signup, login, resendVerificationEmail, changePassword } = require("./handlers/auth");
const { explore, like, pass } = require("./handlers/explore");
const {
  uploadImage,
  removeImage,
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
app.post("/resendVerification", FBAuth, resendVerificationEmail);
app.post("/password", FBAuth, changePassword);

// Explore Routes
app.get("/explore", FBAuth, explore);
app.get("/explore/:uid/like", FBAuth, like);
app.get("/explore/:uid/pass", FBAuth, pass);

// User Routes
app.post("/user/photo", FBAuth, uploadImage);
app.post("/user/photo/delete", FBAuth, removeImage);
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

// Reset everyone who was online in the last 24 hours swipe count every day at 5 AM ET (UTC-4)
exports.resetSwipeCounts = functions.pubsub.schedule("00 09 * * *").onRun((context) => {
  twentyfourHoursAge = new Date(Date.now() - 86400 * 1000).toISOString();
  let batch = db.batch();
  db.collection("users")
    .where("online", ">", twentyfourHoursAge)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        batch.update(doc.ref, { count: 0 });
      });
      batch.commit();
    })
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.error(err);
    });
});

// Send admin email when new report is created
exports.emailAdminOnReport = functions.firestore.document(`reports/{id}`).onCreate((snap) => {
  let details = {
    created: new Date(snap.data().created),
    reason: snap.data().reason,
    description: snap.data().description,
    reported: {
      name: snap.data().reported.name,
      email: snap.data().reported.email,
      uid: snap.data().reported.uid,
    },
    reporter: {
      name: snap.data().reporter.name,
      email: snap.data().reporter.email,
      uid: snap.data().reporter.uid,
    },
  };
  return transporter
    .sendMail(reportMail(details))
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.error(err);
    });
});

// Email user at 7:00 PM ET (UTC-4) when they have unread notifications or messages
exports.sendNotificationEmail = functions.pubsub.schedule("00 23 * * *").onRun((context) => {
  let usersToEmail = new Map();
  db.collection("notifications")
    .where("read", "==", false)
    .where("type", "==", "match")
    .get()
    .then((docs) => {
      // Count numer of matches each user has
      docs.forEach((doc) => {
        let key = doc.data().receiver.uid;
        if (usersToEmail.has(key)) {
          let value = usersToEmail.get(key);
          usersToEmail.set(key, ++value);
        } else {
          usersToEmail.set(key, 1);
        }
      });

      // Send each user their matches
      usersToEmail.forEach((count, uid) => {
        console.log("UID:", uid, "Count:", count);
        db.collection("users")
          .where("uid", "==", uid)
          .limit(1)
          .get()
          .then((docs) => {
            let doc = docs.docs[0];
            if (!doc) {
              console.error("Notified user's profile doc not found");
            }
            if (doc.data().emails.matches === false) {
              return transporter
                .sendMail(matchMail(count, doc.data().name, doc.data().email))
                .catch((err) => {
                  console.error(err);
                });
            }
          });
      });
    })
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.error(err);
    });
});

// Email user when they receive a new message
exports.sendMessageEmail = functions.firestore
  .document("conversations/{conversationId}/messages/{messageId}")
  .onCreate((snap) => {
    let details = {
      text: snap.data().text,
      sender: snap.data().sender,
      receiver: snap.data().receiver,
    };

    // Get messaged user's email
    db.collection("users")
      .where("uid", "==", snap.data().receiver.uid)
      .limit(1)
      .get()
      .then((docs) => {
        let doc = docs.docs[0];
        if (!doc) {
          console.error("Messaged user's profile doc not found");
          return false;
        }
        if (doc.data().emails.messages === false) return false;
        details.receiver.email = doc.data().email;
        return transporter.sendMail(messageMail(details));
      })
      .then(() => {
        return true;
      })
      .catch((err) => {
        console.error(err);
      });
  });

// Moderate messages
exports.moderator = functions.firestore
  .document("conversations/{conversationId}/messages/{messageId}")
  .onCreate((snap) => {
    const message = snap.data();

    if (message && !message.sanitized) {
      // Retrieved the message values.
      console.log("Retrieved message content: ", message);

      // Run moderation checks on on the message and moderate if needed.
      const moderatedMessage = moderateMessage(message.text);

      // Update the Firebase DB with checked message.
      console.log("Message has been moderated. Saving to DB: ", moderatedMessage);
      return snap.ref.update({
        text: moderatedMessage,
        sanitized: true,
        moderated: message.text !== moderatedMessage,
      });
    }
  });
