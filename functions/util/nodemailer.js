// Nodemailer
const nodemailer = require("nodemailer");

// Constants
const { NO_REPLY_EMAIL, SUPPORT_EMAIL } = require("./constants");
const { smtp } = require("./smtp");

// HTML Templates
const { reportHTML } = require("./emails");

// Create Transport
exports.transporter = nodemailer.createTransport(smtp);

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
