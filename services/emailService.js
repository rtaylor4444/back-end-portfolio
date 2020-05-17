const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "rportfolio4444@gmail.com",
    pass: "rtaylor444",
  },
});

function sendConfirmationEmail(code, email) {
  return sendEmail({
    from: "Rob Taylor",
    to: email,
    subject: "Confirm your Email - Rob Taylor's Portfolio",
    html: `<p>Your confirmation code is: <b>${code}</b></p>`,
  });
}
async function sendEmail(params) {
  return transporter.sendMail(params);
}

module.exports.sendConfirmationEmail = sendConfirmationEmail;
module.exports.sendEmail = sendEmail;
