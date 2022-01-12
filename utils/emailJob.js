const nodemailer = require('nodemailer');

const emailJob = async (info) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    // secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // send mail with defined transport object
  const message = await transporter.sendMail({
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // sender address
    to: info.email, // list of receivers
    subject: info.subject, // Subject line
    text: info.message, // plain text body
  });

  const send = await transporter.sendMail(message);

  console.log('Message sent: %s', send.messageId);
};

module.exports = emailJob;
