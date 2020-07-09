// Helpers
const { db } = require("../util/admin");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  db.collection(`conversations`)
    .where("uids", "array-contains", req.user.uid)
    .get()
    .then((docs) => {
      let conversations = [];
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
          cid: doc.id,
          name: name,
          uid: uid,
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
  let name;
  let uid;
  conversation
    .get()
    .then((doc) => {
      let names = doc.data().names;
      let uids = doc.data().uids;

      if (names[0] === req.user.name) name = names[1];
      else name = names[0];

      if (uids[0] === req.user.uid) uid = uids[0];
      else uid = uids[0];

      return conversation.collection("messages").get();
    })
    .then((messages) => {
      let data = [];
      messages.forEach((message) => {
        data.push(message.data());
      });
      return res.status(200).json({ name, uid, messages: data });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Message User Route
exports.sendMessage = (req, res) => {
  const name = req.body.name;
  const uid = req.body.uid;
  const message = req.body.message;

  // Check if there is an existing conversation
  db.collection("conversations")
    .where("uids", "array-contains", uid)
    .get()
    .then((docs) => {
      let doc = docs.docs[0];
      if (doc.exists) {
        // Conversation exists, append message
        db.collection(`conversations/${doc.id}/messages`)
          .add({
            content: message,
            created: new Date().toISOString(),
            sender: req.user.uid,
            receiver: uid,
            cid: doc.id,
            read: false,
          })
          .then(() => {
            return res.status(200).json({ message: "Message sent", cid: doc.id });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
          });
      } else {
        // Conversation doesn't exist, create new conversation document
        db.collection("conversations")
          .add({
            names: [name, req.user.name],
            uids: [uid, req.user.uid],
          })
          .then((doc) => {
            // Create messages subcollection within conversation document
            return db.collection(`conversations/${doc.id}/messages`).add({
              content: message,
              created: new Date().toISOString(),
              sender: req.user.uid,
              receiver: uid,
            });
          })
          .then(() => {
            return res.status(200).json({
              message: "Conversation created, message sent",
              cid: doc.id,
            });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
