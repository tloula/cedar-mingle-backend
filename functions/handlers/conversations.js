// Helpers
const { admin, db } = require("../util/admin");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  let conversations = [];
  db.collection(`conversations`)
    .where("users.uids", "array-contains", req.user.uid)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        let user =
          doc.data().users.names[0] === req.user.uid
            ? doc.data().users.names[1]
            : doc.data().users.names[0];
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
      const data = {
        messages: doc.data().messages,
        users: doc.data().users.names,
      };
      return res.status(200).json({ data });
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
    read: true,
  };
  const receiver = {
    name: req.body.name,
    uid: req.body.uid,
    read: false,
  };
  const message = {
    body: req.body.body,
    created: new Date().toISOString(),
    sender: sender.uid,
    receiver: receiver.uid,
  };

  // Greater UID is first
  const first = sender.uid > receiver.uid ? sender : receiver;
  const second = sender.uid < receiver.uid ? sender : receiver;

  // Check if there is an existing conversation
  db.collection("conversations")
    .where("users.uids", "==", [first.uid, second.uid])
    .limit(1)
    .get()
    .then((docs) => {
      let doc = docs.docs[0];
      if (!doc) {
        // Doc doesn't exist, create conversation
        db.collection("conversations")
          .add({
            users: {
              uids: [first.uid, second.uid],
              names: [
                { uid: first.uid, name: first.name },
                { uid: second.uid, name: second.name },
              ],
              read: [
                { uid: first.uid, read: first.read },
                { uid: second.uid, read: second.read },
              ],
            },
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
