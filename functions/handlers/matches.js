// Helpers
const { admin, db } = require("../util/admin");

// Get Authenticated User's Matches
exports.getMatches = (req, res) => {
  db.doc(`/users/${req.user.email}`)
    .get()
    .then((doc) => {
      return res.status(200).json({ matches: doc.data().matches });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Unmatch User Route
exports.unmatchUser = (req, res) => {
  let matchToRemove;
  let userToUnmatch;
  db.doc(`/users/${req.user.email}`)
    .update({ matches: admin.firestore.FieldValue.arrayRemove(req.body) })
    .then(() => {
      return db.collection(`users`).where("uid", "==", req.body.uid).limit(1).get();
    })
    .then((docs) => {
      userToUnmatch = docs.docs[0].data().email;
      // Lookup array object to remove
      return db.doc(`/users/${userToUnmatch}`).get();
    })
    .then((doc) => {
      // Get all of other user's matches
      usersMatches = doc.data().matches;
      // Find match object
      usersMatches.forEach((match) => {
        if (match.uid === req.user.uid) matchToRemove = match;
      });
      return db.doc(`/users/${userToUnmatch}`).update({
        matches: admin.firestore.FieldValue.arrayRemove(matchToRemove),
      });
    })
    .then(() => {
      return res.status(200).json({ message: "Sucessfully unmatched user" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
