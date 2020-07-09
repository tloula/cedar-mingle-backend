// Helpers
const { admin, db } = require("../util/admin");

// Explore Route
exports.explore = (req, res) => {
  // Confirm that the authenticated user's account is activated before proceeding
  if (!req.user.email_verified)
    return res.status(401).json({ error: "Email has not been verified" });

  // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO Finish Recycle Profiles Option

  var found = false;
  var gender;
  var recycleEnabled = false;
  var recycle = false;
  var pool = new Set();
  var likes = new Set();
  var dislikes = new Set();

  // Get authenticated user's swipe history
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        console.error(err);
        return res.status(404).json({ error: "Authenticated user not found" });
      }

      // Select gender pool to search
      if (doc.data().gender === "male") {
        gender = "female";
      } else {
        gender = "male";
      }

      // Determine if user has enabled recycling
      if (doc.data().recycle === true) recycleEnabled = true;

      // Compile user's swipe history
      if (doc.data().likes !== "") {
        doc.data().likes.forEach((uid) => {
          likes.add(uid);
        });
      }

      // Ignore dislikes if user enabled recycling
      if (doc.data().likes !== "") {
        doc.data().dislikes.forEach((uid) => {
          dislikes.add(uid);
        });
      }

      // Get all eligible users to swipe on
      return db.doc(`/groups/${gender}`).get();
    })
    .then((doc) => {
      if (!doc.exists) {
        return res.status(500).json({ error: "Internal Error finding available users" });
      }

      if (doc.data().uids !== "") {
        doc.data().uids.forEach((uid) => {
          pool.add(uid);
        });
      }

      // If the authenticated user has already swiped through all other users
      // And authenticated user has enabled profile recycling
      // Recycle Profiles
      // NOT COMPLETED, NEED RANDOM RECALL FOR THIS TO FUNCTION
      if (pool.size === likes.size + dislikes.size) recycle = true;

      // Iterate through all users and find someone not swiped on
      pool.forEach((uid) => {
        console.log(`UID: ${uid}`);
        if (!likes.has(uid) && !dislikes.has(uid)) {
          found = uid;
        }
      });

      if (found) {
        // Retrive user profile
        console.log(`RETRIEVING: ${found}`);
        return db
          .collection(`users`)
          .where("uid", "==", found)
          .limit(1)
          .get()
          .then((docs) => {
            if (!doc.exists)
              return res.status(500).json({ error: "Internal error retrieving users profile" });
            // Return profile
            return res.status(200).json({ user: docs.docs[0].data() });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: "Internal error retrieving user card" });
          });
      } else {
        return res.status(404).json({ error: "No new users" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err });
    });
};

// Like User Route
exports.like = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .update({
      likes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
      online: new Date().toISOString(),
    })
    .then(() => {
      // Check to see if liked user has also liked authenticated user
      return db.collection("users").where("uid", "==", req.params.uid).limit(1).get();
    })
    .then((docs) => {
      let doc = docs.docs[0];
      var likes = new Set();

      if (doc.data().likes !== "") {
        doc.data().likes.forEach((uid) => {
          likes.add(uid);
        });
      }

      // If there is a match
      if (likes.has(req.user.uid)) {
        // Add match to authenticated user's match list
        db.doc(`/users/${req.user.email}`)
          .update({ matches: admin.firestore.FieldValue.arrayUnion(req.params.uid) })
          .then(() => {
            // Add match to liked user's match list
            return db
              .doc(`/users/${doc.data().email}`)
              .update({ matches: admin.firestore.FieldValue.arrayUnion(req.user.uid) });
          })
          .then(() => {
            // Create notification for liked user
            return db.collection("notifications").add({
              created: new Date().toISOString(),
              sender: "Cedar Mingle",
              recipient: req.params.uid,
              content: `You matched with ${req.user.name}!`,
              type: "match",
              read: false,
            });
          })
          .then(() => {
            res.status(200).json({
              message: "Sucessfully liked user",
              match: true,
            });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
          });
      } else {
        res.status(200).json({ message: "Sucessfully liked user", match: false });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

// Pass User Route
exports.pass = (req, res) => {
  var online = new Date().toISOString();
  db.doc(`/users/${req.user.email}`)
    .update({ dislikes: admin.firestore.FieldValue.arrayUnion(req.params.uid), online })
    .then(() => {
      res.status(200).json({ message: "Sucessfully passed user" });
    })
    .catch((err) => {
      res.status(500).json({ error: "Internal error adding user to dislike list" });
    });
};
