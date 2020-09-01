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

// Cache-Control
app.use((req, res, next) => {
  if (req.url.match("/user/")) {
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
  }
  next();
});

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

// Update match array objects when user updates their name or images[0]
exports.updateMatchObjects = functions.firestore.document("users/{email}").onUpdate((change) => {
  if (
    (change.before.data().name != change.after.data().name ||
      change.before.data().images != change.after.data().images) &&
    change.before.data().matches.length > 0
  ) {
    change.after.data().matches.forEach((match) => {
      let oldMatch = {
        created: match.created,
        image: change.before.data().images.length > 0 ? change.before.data().images[0].src : "",
        name: change.before.data().name,
        uid: change.before.data().uid,
      };

      let newMatch = {
        created: match.created,
        image: change.after.data().images.length > 0 ? change.after.data().images[0].src : "",
        name: change.after.data().name,
        uid: change.after.data().uid,
      };

      db.collection("users")
        .where("matches", "array-contains", oldMatch)
        .limit(1)
        .get()
        .then((docs) => {
          if (docs.docs[0]) {
            let docMatches = docs.docs[0].data().matches;
            docMatches.splice(docMatches.indexOf(oldMatch), 1);
            docMatches.push(newMatch);
            docs.docs[0].ref.update({ matches: docMatches });
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }
  return true;
});

// Reset everyone who was online in the last 24 hours swipe count every day at 5 AM ET (UTC-4)
exports.resetSwipeCounts = functions.pubsub
  .schedule("00 08 * * *")
  .timeZone("America/New_York")
  .onRun((context) => {
    twentyfourHoursAge = new Date(Date.now() - 86400 * 1000).toISOString();
    let batch = db.batch();
    return db
      .collection("users")
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
/*exports.sendNotificationEmail = functions.pubsub.schedule("00 16 * * *").onRun((context) => {
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
            if (doc.data().emails.matches === true) {
              transporter
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
});*/

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
