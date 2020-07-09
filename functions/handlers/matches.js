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
  db.doc(`/users/${req.user.email}`)
    .update({ matches: admin.firestore.FieldValue.arrayRemove(req.params.uid) })
    .then(() => {
      return db.collection(`users`).where("uid", "==", req.params.uid).limit(1).get();
    })
    .then((docs) => {
      let userToUnmatch = docs.docs[0].data().email;
      return db.doc(`/users/${userToUnmatch}`).update({
        matches: admin.firestore.FieldValue.arrayRemove(req.user.uid),
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
