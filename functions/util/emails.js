// Constants
const { APP_NAME, APP_URL } = require("./constants");

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
  return `
    <p>Hey ${details.receiver.name},</p>
    <p>You received a new message from ${details.sender.name}.</p>
    <p><q>${details.text}</q></p>
    <p>Reply now on <a href="${APP_URL}">${APP_NAME}</a></p>`;
};

exports.matchHTML = (name, count) => {
  return `
    <p>Hey ${name},</p>
    <p>You received ${count} new matches!</p>
    <p>Message them now on <a href="${APP_URL}">${APP_NAME}</a></p>`;
};
