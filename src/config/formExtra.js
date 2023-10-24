import jwt from 'jsonwebtoken';
import {
    envCoderSecret,
    envCoderTokenCookie,
    envCoderUserIDCookie
} from '../config.js';
import {
    createHash
} from "../utils.js";
import SessionController from '../controllers/sessionController.js';
import ErrorEnums from "../errors/error.enums.js";
import CustomError from "../errors/customError.class.js";
import ErrorGenerator from "../errors/error.info.js";

let sessionController = new SessionController();

export const completeProfile = async (req, res, next) => {
    const userId = req.signedCookies[envCoderUserIDCookie]
    const last_name = req.body.last_name;
    const email = req.body.email;
    const age = parseInt(req.body.age, 10);
    const password = createHash(req.body.password);
    const userRegister = {
        last_name,
        email,
        age,
        password
    }
    try {
        const hasNumbers = (inputString) => {
            const regex = /\d/;
            return regex.test(inputString);
        };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!last_name || typeof last_name !== 'string' || hasNumbers(last_name) ||
            !email || !emailRegex.test(email) ||
            !age || typeof age !== 'number' || password === undefined)
            CustomError.createError({
                name: "Error al registrar al usuario con GitHub.",
                cause: ErrorGenerator.generateRegisterGitHubErrorInfo(userRegister),
                message: "La información para el registro está incompleta o no es válida.",
                code: ErrorEnums.INVALID_REGISTER_DATA
            });
    } catch (error) {
        return next(error);
    };
    try {
        const existSessionControl = await sessionController.getUserController(req, res, email);
        if (existSessionControl.statusCode === 500) {
            res.send({
                statusCode: 500,
                message: existSessionControl.message
            });
        } else if (existSessionControl.statusCode === 200) {
            res.send({
                statusCode: 409,
                message: 'Ya existe una cuenta asociada a este correo. Diríjase al login y presione en "Ingresa aquí" para iniciar sesión.'
            });
        } else if (existSessionControl.statusCode === 404) {
            const updateUser = {
                last_name,
                email,
                age,
                password
            };
            const updateSessionControl = await sessionController.updateUserController(req, res, next, userId, updateUser);

            const getNewUser = await sessionController.getUserController(req, res, email);

            if (getNewUser.statusCode === 200) {
                const newUser = getNewUser.result;
                let token = jwt.sign({
                    email: newUser.email,
                    first_name: newUser.first_name,
                    role: newUser.role,
                    cart: newUser.cart,
                    userID: newUser._id
                }, envCoderSecret, {
                    expiresIn: '7d'
                });
                res.cookie(envCoderTokenCookie, token, {
                    httpOnly: true,
                    signed: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000
                }).send({
                    status: 'success',
                    statusCode: 200,
                    redirectTo: '/products'
                });
            };
        };
    } catch (error) {
        req.logger.error(error.message)
        res.send({
            statusCode: 500,
            message: 'Error al completar datos de session creada con GitHub - formExtra.js: ' + error.message
        });
    };
};