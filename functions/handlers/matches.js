// Helpers
const { admin, db } = require("../util/admin");
//const { config, storageBase, storageBucket } = require("../util/config");

// Get Authenticated User's Matches
exports.getMatches = (req, res) => {
  console.log("HERE");
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      console.log("HERE");
      return res.status(200).json({ matches: doc.data().matches });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Internal error retrieving user's matches" });
    });
};

// Message User Route
exports.messageUser = (req, res) => {
  console.log("HERE");
  return res.status(200);
};

// Unmatch User Route
exports.unmatchUser = (req, res) => {
  console.log("HERE");
  return res.status(200);
};
