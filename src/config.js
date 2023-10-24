import dotenv from "dotenv";
import { Command } from "commander";

const program = new Command();
program.option('--mode <mode>', 'mode en que se levantara la app', 'dev')
program.parse()
const mode = program.opts().mode 
dotenv.config({
    path: mode == 'dev' ? '.env.development' : '.env.production'
})

export const envEntorno = process.env.ENVIRONMENT;
export const envMongoURL = process.env.MONGO_URL;
export const envPort = process.env.PORT;
export const envClientID = process.env.CLIENT_ID;
export const envClientSecret = process.env.CLIENT_SECRET;
export const envCallbackURL = process.env.CALLBACK_URL;
export const envCoderSecret = process.env.CODER_SECRET;
export const envCoderTokenCookie = process.env.CODER_COOKIE;
export const envCoderUserIDCookie = process.env.CODER_USER;
export const envCookieParser = process.env.FIRMA_COOKIE;
export const envAdminEmailCoder = process.env.ADMIN_EMAIL;
export const envAdminPassCoder = process.env.ADMIN_PASSWORD;
export const envServiceTransport = process.env.SERVICE_TRANSPORT;
export const envPortTransport = process.env.PORT_TRANSPORT;
export const envAuthUserTransport = process.env.AUTH_USER_TRANSPORT;
export const envAuthPassTransport = process.env.AUTH_PASS_TRANSPORT;
export const envResetPassToken = process.env.RESET_PASSWORD_TOKEN;
export const envResetPassCookieEmail = process.env.RESET_PASSWORD_COOKIE; 
export const envUrlResetPass = process.env.URL_REST_PASS;
export const envStripeKeyPublic = process.env.STRIPE_KEY_PUBLIC;
export const envStripeKeySecret = process.env.STIRPE_KEY_SECRET;
export const envPurchaseOrder = process.env.PURCHASE_ORDER;
export const envSuccess_url = process.env.SUCCESS_URL;
export const envCancel_url = process.env.CANCEL_URL;

console.log(program.opts())

// Cargar variables de entorno, antes de levantar el servidor: 
// npm run dev-D : npm run dev-P