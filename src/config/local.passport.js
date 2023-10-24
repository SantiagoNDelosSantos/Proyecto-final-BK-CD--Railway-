import passport from 'passport';
import local from 'passport-local';
import {
    createHash,
    isValidPassword
} from "../utils.js";
import SessionController from '../controllers/sessionController.js'
import CartController from '../controllers/cartController.js';
import {
    envAdminEmailCoder,
    envAdminPassCoder
} from '../config.js';

const localStrategy = local.Strategy;
let sessionController = new SessionController();
let cartController = new CartController();

export const initializePassportLocal = (req, res) => {
    passport.use('register', new localStrategy({
            passReqToCallback: true,
            usernameField: 'email'
        },
        async (req, username, password, done) => {
            const {
                first_name,
                last_name,
                age,
                email
            } = req.body;
            try {
                const existSessionControl = await sessionController.getUserController(req, res, username);
                if (existSessionControl.statusCode === 500) {
                    return done(null, false, {
                        statusCode: 500,
                        message: existSessionControl.message
                    });
                } else if (existSessionControl.statusCode === 200) {
                    return done(null, false, {
                        statusCode: 409,
                        message: 'Ya existe una cuenta asociada a este correo. Presione en "Ingresa aquí" para iniciar sesión.'
                    });
                } else if (existSessionControl.statusCode === 404) {
                    const resultCartControl = await cartController.createCartController(req, res);
                    if (resultCartControl.statusCode === 500) {
                        return done(null, false, {
                            statusCode: 500,
                            message: resultCartControl.message
                        });
                    } else if (resultCartControl.statusCode === 200) {
                        const cart = resultCartControl.result;
                        const newUser = {
                            first_name,
                            last_name,
                            email,
                            age,
                            password: createHash(password),
                            role: 'user',
                            cart: cart._id,
                        };
                        const createSessionControl = await sessionController.createUserControler(req, res, newUser);
                        if (createSessionControl.statusCode === 500) {
                            return done(null, false, {
                                statusCode: 500,
                                message: createSessionControl.message
                            });
                        } else if (createSessionControl.statusCode === 200) {
                            const user = createSessionControl.result;
                            return done(null, user, {
                                statusCode: 200,
                            });
                        }
                    }
                };
            } catch (error) {
                req.logger.error(error)
                return done(null, false, {
                    statusCode: 500,
                    message: 'Error de registro en local.passport.js - Register: ' + error.message
                });
            };
        }
    ));
    passport.use('login', new localStrategy({
            passReqToCallback: true,
            usernameField: 'email'
        },
        async (req, username, password, done) => {
            try {
                if (username === envAdminEmailCoder && password === envAdminPassCoder) {
                    let userAdmin = {
                        first_name: "Admin",
                        last_name: "X",
                        email: envAdminEmailCoder,
                        age: 0,
                        password: envAdminPassCoder,
                        role: "admin",
                        cart: null,
                    };
                    return done(null, userAdmin, {
                        statusCode: 200
                    });
                } else {
                    const existDBSessionControl = await sessionController.getUserController(req, res, username);
                    if (existDBSessionControl.statusCode === 500) {
                        return done(null, false, {
                            statusCode: 500,
                            message: existDBSessionControl.message
                        });
                    } else if (existDBSessionControl.statusCode === 404) {
                        return done(null, false, {
                            statusCode: 404,
                            message: 'No existe una cuenta asociada a este correo. Presione en "Regístrarse aquí" para crear una cuenta.'
                        });
                    } else if (existDBSessionControl.statusCode === 200) {
                        const user = existDBSessionControl.result;
                        if (!isValidPassword(user, password)) {
                            return done(null, false, {
                                statusCode: 409,
                                message: 'Existe una cuenta asociada a este correo, pero la contraseña ingresada es incorrecta.'
                            });
                        } else {
                            const lastConnection = {
                                last_connection: new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString()
                            };
                            const lastConnect = await sessionController.updateUserController(req, res, done, user._id, lastConnection);
                            if (lastConnect.statusCode === 200) {
                                return done(null, user, {
                                    statusCode: 200
                                });
                            }
                        };
                    };
                }
            } catch (error) {
                req.logger.error(error)
                return done(null, false, {
                    statusCode: 500,
                    message: 'Error de login en local.passport.js - Login: ' + error.message
                });
            };
        }
    ));
};