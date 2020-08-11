// Helpers
const { admin, db } = require("../util/admin");
const { getUserData } = require("../util/helpers");

// Moderation
const { moderateMessage } = require("../util/moderation");

// Get All Authenticated User's Conversations Route
exports.getAllConversations = (req, res) => {
  console.log("Get All Conversations");
  let conversations = [];
  db.collection(`conversations`)
    .where("uids", "array-contains", req.user.uid)
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        let user =
          doc.data().names[0].uid === req.user.uid ? doc.data().names[1] : doc.data().names[0];
        let data = {
          cid: doc.id,
          name: user.name,
          uid: user.uid,
        };
        // Get latest message
        var promise = db
          .doc(`/conversations/${data.cid}`)
          .collection("messages")
          .orderBy("created", "DESC")
          .limit(1)
          .get()
          .then((docs) => {
            if (docs.docs[0]) data.latest = docs.docs[0].data();
            conversations.push(data);
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
          });
        promises.push(promise);
      });
      Promise.all(promises).then(() => {
        return res.status(200).json({ conversations });
      });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get Specific Conversation Route
exports.getConversation = (req, res) => {
  console.log("Get Specific Conversation");
  let user,
    messages = [];

  // Greater UID is first
  const first = req.user.uid > req.params.uid ? req.user.uid : req.params.uid;
  const second = req.user.uid < req.params.uid ? req.user.uid : req.params.uid;

  // Check if there is an existing conversation
  db.collection("conversations")
    .where("uids", "==", [first, second])
    .limit(1)
    .get()
    .then((docs) => {
      let doc = docs.docs[0];
      if (!doc) {
        // Conversation doesn't exist, retrieve user's name for new conversation creation
        db.collection("users")
          .where("uid", "==", req.params.uid)
          .limit(1)
          .get()
          .then((docs) => {
            let doc = docs.docs[0];
            if (doc) {
              return res
                .status(200)
                .json({ user: { uid: req.params.uid, name: doc.data().name }, messages: [] });
            } else {
              return res.status(404).json({ error: "User not found" });
            }
          });
      } else {
        user = doc.data().names[0].uid === req.user.uid ? doc.data().names[1] : doc.data().names[0];
        doc.ref
          .collection("messages")
          .limit(50)
          .get()
          .then((docs) => {
            docs.forEach((message) => {
              appendedMessage = message.data();
              appendedMessage.mid = message.id;
              messages.push(appendedMessage);
            });
            return res.status(200).json({ user, messages });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
          });
      }
    });
};

// Message User Route
exports.sendMessage = (req, res) => {
  console.log("Send Message");
  // Validate request
  if (!req.body.text) return res.status(400).json({ error: "Message text must not be empty" });

  let message;

  // Get user data
  getUserData(req)
    .then((data) => {
      req = data;

      const sender = {
        name: req.user.name,
        uid: req.user.uid,
      };
      const receiver = {
        name: req.body.name,
        uid: req.body.uid,
      };
      const text = moderateMessage(req.body.text);
      const moderated = text !== req.body.text ? req.body.text : false;
      message = {
        text,
        created: new Date().toISOString(),
        sender: {
          uid: sender.uid,
          name: sender.name,
        },
        receiver: {
          uid: receiver.uid,
          name: receiver.name,
        },
        read: false,
        moderated,
      };

      // Greater UID is first
      const first = sender.uid > receiver.uid ? sender : receiver;
      const second = sender.uid < receiver.uid ? sender : receiver;

      // Check if there is an existing conversation
      return db
        .collection("conversations")
        .where("uids", "==", [first.uid, second.uid])
        .limit(1)
        .get();
    })
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
              moderated: message.moderated,
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
            moderated: message.moderated,
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
