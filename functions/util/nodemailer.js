// Nodemailer
const nodemailer = require("nodemailer");

// Constants
const { NO_REPLY_EMAIL, SUPPORT_EMAIL } = require("./constants");

// HTML Templates
const { reportHTML } = require("./emails");

exports.transporter = nodemailer.createTransport({
  host: "smtp.ionos.com",
  port: 465,
  secure: true,
  auth: {
    user: "contact@trevorloula.com",
    pass: "$s6zo9Ad$01p",
  },
});

// Report user mail options
exports.reportUserMail = (details) => {
  return {
    from: NO_REPLY_EMAIL,
    to: SUPPORT_EMAIL,
    subject: "CedarMingle User Reported",
    html: reportHTML(details),
  };
};

// Message received mail options
exports.messageReceivedMail = () => {
  options = {
    from: NO_REPLY_EMAIL,
    subject: "You Received a new Message",
  };
};
