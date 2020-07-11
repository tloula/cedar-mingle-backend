// Helpers
const { db } = require("../util/admin");

// Validators
const { validateReportDetails } = require("../util/validators");

// Report Route
exports.reportUser = (req, res) => {
  const { valid, errors } = validateReportDetails(req.body);
  if (!valid) return res.status(400).json({ errors });

  const report = {
    description: req.body.description,
    reason: req.body.reason,
    reporter: {
      uid: req.user.uid,
    },
    reported: {
      uid: req.body.reported,
    },
    created: new Date().toISOString(),
  };

  db.collection("users")
    .where("uid", "==", report.reporter.uid)
    .limit(1)
    .get()
    .then((docs) => {
      report.reporter.name = docs.docs[0].data().name;
      report.reporter.email = docs.docs[0].data().email;
      return db.collection("users").where("uid", "==", report.reported.uid).limit(1).get();
    })

    .then((docs) => {
      report.reported.name = docs.docs[0].data().name;
      report.reported.email = docs.docs[0].data().email;
      db.collection("reports").add(report);
    })

    .then(() => {
      return res.status(200).json({ message: "User sucessfully reported" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.resetSwipeCount = (req, res) => {
  twentyfourHoursAge = new Date(Date.now() - 86400 * 1000).toISOString();
  let batch = db.batch();
  db.collection("users")
    .where("online", ">", twentyfourHoursAge)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        batch.update(doc.ref, { count: 0 });
      });
      batch.commit();
    })
    .then(() => {
      return res.status(200).json({ message: "Sucessfully reset all user's swipe count" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
