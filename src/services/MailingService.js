import nodemailer from "nodemailer";
import { URL } from "node:url";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? "smtp.ethereal.email",
    port: parseInt(process.env.EMAIL_PORT ?? "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendResetInfo(email, user, token) {
    const baseUrl = process.env.WEBAPP_HOST;
    if (!baseUrl) {
        throw new Error("Missing reset password URL configuration");
    }

    const resetUrl = new URL("/reset-password", baseUrl);
    resetUrl.searchParams.set("token", token);

    const subject = "Redefina sua senha";
    const text = `Ola ${user.name || ""},\n\nUse o link abaixo para redefinir sua senha:\n${resetUrl.toString()}\n\nSe voce nao solicitou essa alteracao, ignore este email.`;
    const html = `
        <p>Ola ${user.name || ""},</p>
        <p>Use o link abaixo para redefinir sua senha:</p>
        <p><a href="${resetUrl.toString()}">${resetUrl.toString()}</a></p>
        <p>Se voc&ecirc; n&atilde;o solicitou essa altera&ccedil;&atilde;o, ignore este email.</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
        to: email,
        subject,
        text,
        html,
    });
}

export default { sendResetInfo };