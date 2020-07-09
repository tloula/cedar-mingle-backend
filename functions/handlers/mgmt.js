// Helpers
const { db } = require("../util/admin");

const { validateReportDetails } = require("../util/validators");

// Report Route
exports.reportUser = (req, res) => {
  const { valid, errors } = validateReportDetails(req.body);
  if (!valid) return res.status(400).json({ errors });

  const report = {
    description: req.body.description,
    reason: req.body.reason,
    reporter: req.user.uid,
    reported: req.body.reported,
    created: new Date().toISOString(),
  };

  db.collection("reports")
    .add(report)
    .then(() => {
      return res.status(200).json({ message: "User sucessfully reported" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
