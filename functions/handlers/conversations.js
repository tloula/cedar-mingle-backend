// Helpers
const { admin, db } = require("../util/admin");
const { config, storageBase, storageBucket } = require("../util/config");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  db.collection(`conversations`)
    .where("uids", "array-contains", req.user.uid)
    .get()
    .then((docs) => {
      conversations = [];
      docs.forEach((doc) => {
        let names = doc.data().names;
        let uids = doc.data().uids;
        let name;
        let uid;

        if (names[0] === req.user.name) name = names[1];
        else name = names[0];

        if (uids[0] === req.user.uid) uid = uids[0];
        else uid = uids[0];

        conversations.push({
          name: name,
          uid: uid,
        });
      });
      return res.status(200).json({ conversations });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Internal error retrieving conversations" });
    });
};

// Get Specific Conversation Route
exports.getConversation = (req, res) => {
  return res.status(200).json({ message: "Success" });
};

// Message User Route
exports.sendMessage = (req, res) => {
  return res.status(200).json({ message: "Success" });
};
