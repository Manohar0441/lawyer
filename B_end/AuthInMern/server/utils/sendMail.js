const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(obj) {

    // {
    //     from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
    //         to: "bar@example.com, baz@example.com", // list of receivers
    //             subject: "Hello ✔", // Subject line
    //                 text: "Hello world?", // plain text body
    //                     html: "<b>Hello world?</b>", // html body
    // }

    const info = await transporter.sendMail(obj);

    console.log("Message sent: %s", info.messageId);
}

module.exports = sendMail