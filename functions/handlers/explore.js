// Helpers
const { admin, db } = require("../util/admin");
const { config, storageBase, storageBucket } = require("../util/config");

// Explore Route
exports.explore = (req, res) => {
  // Confirm that account is activated before sending profiles
  if (!req.user.email_verified)
    return res.status(401).json({ general: "Email has not been verified" });

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
        gender = "females";
      } else {
        gender = "males";
      }

      // Determine if user has enabled recycling
      if (doc.data().recycleProfiles === true) recycleEnabled = true;

      // Compile user's swipe history
      doc.data().likes.forEach((uid) => {
        likes.add(uid);
      });
      // Ignore dislikes if user enabled recycling
      doc.data().dislikes.forEach((uid) => {
        dislikes.add(uid);
      });

      // Get all eligible users to swipe on
      db.doc(`/groups/${gender}`)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            return res
              .status(500)
              .json({ error: "Internal Error finding available users" });
          }
          doc.data().uids.forEach((uid) => {
            pool.add(uid);
          });

          // If the authenticated user has already swiped through all other users
          // And authenticated user has enabled profile recycling
          // Recycle Profiles
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
              .where("userId", "==", found)
              .limit(1)
              .get()
              .then((docs) => {
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
exports.like = (req, res) => {};

// Pass User Route
exports.pass = (req, res) => {};
