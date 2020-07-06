// Core
const functions = require("firebase-functions");
const app = require("express")();

// Helpers
const { db } = require("./util/admin");
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
  markNotificationsRead,
} = require("./handlers/users");
const { getMatches, messageUser, unmatchUser } = require("./handlers/matches");
const { reportUser } = require("./handlers/mgmt");

// Auth Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/resendVerification", resendVerificationEmail);

// Explore Routes
app.get("/explore", FBAuth, explore);
app.post("/like/:userId", FBAuth, FBAuth, like);
app.post("/pass/:userId", FBAuth, pass);

// User Routes
app.post("/user/photo", FBAuth, uploadImage);
app.delete("/user/photo", FBAuth, removeImage);
app.patch("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUserDetails);
app.get("/user/:userId", FBAuth, getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

// Match Routes
app.get("/matches", FBAuth, getMatches);
app.post("/matches/:userId", FBAuth, messageUser);
app.delete("/matches/:userId", FBAuth, unmatchUser);

// Management
app.post("/report/", FBAuth, reportUser);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnLike = functions.firestore
  .document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions.firestore
  .document("/users/{userId}")
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("image has changed");
      const batch = db.batch();
      return db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions.firestore
  .document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
