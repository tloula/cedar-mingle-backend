// Pluralize
var pluralize = require("pluralize");

// Constants
const { APP_NAME, APP_URL } = require("./constants");

// Email Template
const { emailTemplate } = require("./emailTemplate");
const { json } = require("express");

exports.reportHTML = (details) => {
  return `<h4>Report Details</h4>
    <p>
        <table>
            <tr>
                <td width="100px"><strong>Created:</strong></td>
                <td>${details.created}</td>
            </tr>
            <tr>
                <td width="100px"><strong>Reason:</strong></td>
                <td>${details.reason}</td>
            </tr>
            <tr>
                <td width="100px"><strong>Description:</strong></td>
                <td>${details.description}</td>
            </tr>
        </table>
    </p>
    <h4>User Reported</h4>
    <p>
        <table>
            <tr>
                <td width="60px"><strong>Name:</strong></td>
                <td>${details.reported.name}</td>
            </tr>
            <tr>
                <td width="60px"><strong>Email:</strong></td>
                <td>${details.reported.email}</td>
            </tr>
            <tr>
                <td width="60px"><strong>UID:</strong></td>
                <td>${details.reported.uid}</td>
            </tr>
        </table>
    </p>
    <h4>User Reporting</h4>
    <p>
        <table>
            <tr>
                <td width="60px"><strong>Name:</strong></td>
                <td>${details.reporter.name}</td>
            </tr>
            <tr>
                <td width="60px"><strong>Email:</strong></td>
                <td>${details.reporter.email}</td>
            </tr>
            <tr>
                <td width="60px"><strong>UID:</strong></td>
                <td>${details.reporter.uid}</td>
            </tr>
        </table>
    </p>`;
};

exports.messageHTML = (details) => {
  return emailTemplate(
    `You received a new message from ${details.sender.name}`,
    `Hey ${details.receiver.name}`,
    `You received a new message from ${details.sender.name}<br /><br />
    <i>&quot;${details.text}&quot;</i>`,
    `${APP_URL}/conversations/${details.receiver.uid}`,
    `Reply now!`
  );
};

exports.matchHTML = (name, count) => {
  return emailTemplate(
    `You've got a new match!`,
    `Hey ${name}`,
    `You received ${count} new ${pluralize("match", count)}!`,
    `${APP_URL}/matches`,
    `Message them now!`
  );
};
