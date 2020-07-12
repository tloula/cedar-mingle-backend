// Helpers
const { admin, db } = require("../util/admin");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  let conversations = [];
  db.collection(`conversations`)
    .where("users.0.uid", "==", req.user.uid)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        let user =
          doc.data().users[0].uid === req.user.uid ? doc.data().users[1] : doc.data().users[0];
        let message = doc.data().messages[doc.data().messages.length - 1];

        conversations.push({
          cid: doc.id,
          name: user.name,
          uid: user.uid,
          latest: message,
        });
      });
      return db.collection(`conversations`).where("users.1.uid", "==", req.user.uid).get();
    })
    .then((docs) => {
      docs.forEach((doc) => {
        let user =
          doc.data().users[0].uid === req.user.uid ? doc.data().users[1] : doc.data().users[0];
        let message = doc.data().messages[doc.data().messages.length - 1];

        conversations.push({
          cid: doc.id,
          name: user.name,
          uid: user.uid,
          latest: message,
        });
      });
      return res.status(200).json({ conversations });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Specific Conversation Route
exports.getConversation = (req, res) => {
  db.doc(`/conversations/${req.params.cid}`)
    .get()
    .then((doc) => {
      if (!doc) return res.status(404).json({ error: "Conversation not found" });
      return res.status(200).json({ conversation: doc.data() });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Message User Route
exports.sendMessage = (req, res) => {
  const sender = {
    name: req.user.name,
    uid: req.user.uid,
  };
  const receiver = {
    name: req.body.name,
    uid: req.body.uid,
  };
  const message = {
    body: req.body.body,
    created: new Date().toISOString(),
    sender: sender.uid,
    receiver: receiver.uid,
  };

  // Always put greater uid first
  const first = sender.uid > receiver.uid ? sender : receiver;
  const second = sender.uid < receiver.uid ? sender : receiver;

  // Check if there is an existing conversation
  db.collection("conversations")
    .where("users.0.uid", "==", first.uid)
    .where("users.1.uid", "==", second.uid)
    .limit(1)
    .get()
    .then((docs) => {
      let doc = docs.docs[0];
      if (!doc) {
        // Doc doesn't exist, create conversation
        db.collection("conversations")
          .add({
            users: { 0: first, 1: second },
            messages: [message],
          })
          .then(() => {
            return res.status(200).json({ message: "Conversation created, message sent" });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err.code });
          });
      } else {
        // Doc exists, append message
        db.doc(`/conversations/${doc.id}`)
          .update({
            messages: admin.firestore.FieldValue.arrayUnion(message),
          })
          .then(() => {
            return res.status(200).json({ message: "Message sent" });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({ error: err.code });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
