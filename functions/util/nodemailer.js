// Nodemailer
const nodemailer = require("nodemailer");

// Constants
const { NO_REPLY_EMAIL, SUPPORT_EMAIL } = require("./constants");
const { smtp } = require("./smtp");

// HTML Templates
const { reportHTML, messageHTML, matchHTML } = require("./emails");

// Create Transport
exports.transporter = nodemailer.createTransport(smtp);

// Report user mail options
exports.reportMail = (details) => {
  return {
    from: NO_REPLY_EMAIL,
    to: SUPPORT_EMAIL,
    subject: "CedarMingle User Reported",
    html: reportHTML(details),
  };
};

// Message received mail options
exports.messageMail = (details) => {
  return {
    from: NO_REPLY_EMAIL,
    to: details.receiver.email,
    subject: `You received a new message from ${details.sender.name}`,
    html: messageHTML(details),
  };
};

// Notification received mail options
exports.matchMail = (count, name, email) => {
  return {
    from: NO_REPLY_EMAIL,
    to: email,
    subject: `You received ${count} new matches!`,
    html: matchHTML(name, count),
  };
};
