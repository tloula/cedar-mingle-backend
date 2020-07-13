// Helpers
const { admin, db } = require("../util/admin");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  let conversations = [];
  db.collection(`conversations`)
    .where("uids", "array-contains", req.user.uid)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        let user =
          doc.data().names[0].uid === req.user.uid ? doc.data().names[1] : doc.data().names[0];

        conversations.push({
          cid: doc.id,
          name: user.name,
          uid: user.uid,
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
  const conversation = db.doc(`/conversations/${req.params.cid}`);
  let user,
    messages = [];
  conversation
    .get()
    .then((doc) => {
      if (!doc) return res.status(404).json({ error: "Conversation not found" });
      user = doc.data().names[0].uid === req.user.uid ? doc.data().names[1] : doc.data().names[0];
      return conversation.collection("messages").limit(50).get();
    })
    .then((docs) => {
      docs.forEach((message) => {
        messages.push(message.data());
      });
      return res.status(200).json({ user, messages });
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
    text: req.body.text,
    created: new Date().toISOString(),
    sender: sender.uid,
    receiver: receiver.uid,
    read: false,
  };

  // Greater UID is first
  const first = sender.uid > receiver.uid ? sender : receiver;
  const second = sender.uid < receiver.uid ? sender : receiver;

  // Check if there is an existing conversation
  db.collection("conversations")
    .where("uids", "==", [first.uid, second.uid])
    .limit(1)
    .get()
    .then((docs) => {
      let doc = docs.docs[0];
      if (!doc) {
        // Doc doesn't exist, create conversation
        db.collection("conversations")
          .add({
            uids: [first.uid, second.uid],
            names: [
              { uid: first.uid, name: first.name },
              { uid: second.uid, name: second.name },
            ],
          })
          .then((doc) => {
            // Create messages subcollection within conversation document
            return db.collection(`conversations/${doc.id}/messages`).add({
              text: message.text,
              cid: doc.id,
              created: message.created,
              read: message.read,
              receiver: message.receiver,
              sender: message.sender,
            });
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
        db.collection(`conversations/${doc.id}/messages`)
          .add({
            text: message.text,
            cid: doc.id,
            created: message.created,
            read: message.read,
            receiver: message.receiver,
            sender: message.sender,
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
