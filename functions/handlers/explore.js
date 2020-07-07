// Helpers
const { admin, db } = require("../util/admin");
const { config, storageBase, storageBucket } = require("../util/config");

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
      if (doc.data().recycleProfiles === true) recycleEnabled = true;

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
      db.doc(`/groups/${gender}`)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            return res
              .status(500)
              .json({ error: "Internal Error finding available users" });
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
            db.collection(`users`)
              .where("uid", "==", found)
              .limit(1)
              .get()
              .then((docs) => {
                if (!doc.exists) {
                  return res
                    .status(500)
                    .json({ error: "Internal error retrieving users profile" });
                }
                docs.forEach((doc) => {
                  // Return profile
                  return res.status(200).json({ user: doc.data() });
                });
              })
              .catch((err) => {
                console.error(err);
                return res
                  .status(500)
                  .json({ error: "Internal error retrieving user card" });
              });
          } else {
            return res.status(404).json({ error: "No new users" });
          }
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({
            error:
              "Internal error retrieving authenticated user's swipe history",
          });
        });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ general: "Error reading available users doc" });
    });
};

// Like User Route
exports.like = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .update({
      likes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
    })
    .then(() => {
      // Check to see if liked user has also liked authenticated user
      db.collection("users")
        .where("uid", "==", req.params.uid)
        .limit(1)
        .get()
        .then((docs) => {
          docs.forEach((doc) => {
            var likes = new Set();
            if (doc.data().likes !== "") {
              doc.data().likes.forEach((uid) => {
                likes.add(uid);
              });
            }
            if (likes.has(req.user.uid)) {
              // Add match to authenticated user's match list
              db.doc(`/users/${req.user.email}`)
                .update({
                  matches: admin.firestore.FieldValue.arrayUnion(
                    req.params.uid
                  ),
                })
                .then(() => {
                  // Add match to liked user's match list
                  db.doc(`/users/${doc.data().email}`)
                    .update({
                      matches: admin.firestore.FieldValue.arrayUnion(
                        req.user.uid
                      ),
                    })
                    .then(() => {
                      res.status(200).json({
                        message: "Sucessfully liked user",
                        match: true,
                      });
                    })
                    .catch((err) => {
                      console.error(err);
                      res.status(500).json({
                        error:
                          "Error adding authenticated user to liked user's match list",
                      });
                    });
                })
                .catch((err) => {
                  console.error(err);
                  res.status(500).json({
                    error:
                      "Error adding liked user to authenticated user's match list",
                  });
                });
            } else {
              res
                .status(200)
                .json({ message: "Sucessfully liked user", match: false });
            }
          });
        })
        .catch((err) => {
          res
            .status(500)
            .json({ error: "Internal error retrieving liked users profile" });
        });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Internal error adding user to like list" });
    });
};

// Pass User Route
exports.pass = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .update({
      dislikes: admin.firestore.FieldValue.arrayUnion(req.params.uid),
    })
    .then(() => {
      res.status(200).json({ message: "Sucessfully passed user" });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: "Internal error adding user to dislike list" });
    });
};
