import nodemailer from 'nodemailer'
import {
    envServiceTransport,
    envPortTransport,
    envAuthUserTransport,
    envAuthPassTransport
} from '../config.js'

export default class Mail {
    constructor() {
        this.transport = nodemailer.createTransport({
            service: envServiceTransport,
            port: envPortTransport,
            auth: {
                user: envAuthUserTransport,
                pass: envAuthPassTransport,
            }
        })
    };
    async sendMail(email, subject, html) {
        let result = await this.transport.sendMail({
            from: envAuthUserTransport,
            to: email,
            subject,
            html
        });
        return result;
    };
};