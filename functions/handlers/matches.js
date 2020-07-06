// Helpers
const { admin, db } = require("../util/admin");
//const { config, storageBase, storageBucket } = require("../util/config");

// Get Authenticated User's Matches
exports.getMatches = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      return res.status(200).json({ matches: doc.data().matches });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Internal error retrieving user's matches" });
    });
};

// Unmatch User Route
exports.unmatchUser = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .update({
      matches: admin.firestore.FieldValue.arrayRemove(req.params.uid),
    })
    .then(() => {
      db.collection(`/users/`)
        .where("uid", "==", req.params.uid)
        .limit(1)
        .get()
        .then((docs) => {
          let userToUnmatch;
          docs.forEach((doc) => {
            userToUnmatch = doc.data().email;
          });
          db.doc(`/users/${userToUnmatch}`)
            .update({
              matches: admin.firestore.FieldValue.arrayRemove(req.user.uid),
            })
            .then(() => {
              return res
                .status(200)
                .json({ message: "Sucessfully unmatched user" });
            })
            .catch((err) => {
              console.error(err);
              return res.status(500).json({
                error:
                  "Internal errror removing authenticated user from requested user's match list",
              });
            });
        })
        .catch((err) => {
          console.error(err);
          return res
            .stasus(500)
            .json({ error: "Internal error retrieving requested users email" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error:
          "Internal error removing requested user from authenticated user's match list",
      });
    });
};

// Message User Route
exports.messageUser = (req, res) => {
  // Put message in database

  // Put notification in database
  return res.status(200).json({ message: "Success" });
};
