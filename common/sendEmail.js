import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
    }
});

function sendEmail(toEmail, subject, content, callback) {
    let mail = {
        from: process.env.GOOGLE_EMAIL,
        to: toEmail,
        subject: subject,
        // text: content,
        html: content,
    }
    transporter.sendMail(mail, (err) => {
        if (err) console.log(err)
        else callback()
    })
}

export default sendEmail