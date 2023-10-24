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

// Función de PassportLocal:
export const initializePassportLocal = (req, res) => {
    // Primera estrategia - Registro:
    passport.use('register', new localStrategy({
            passReqToCallback: true,
            usernameField: 'email'
        },
        async (req, username, password, done) => {
            // Sacamos del body el formulario toda la informacion de registro: 
            const {
                first_name,
                last_name,
                age,
                email
            } = req.body;
            try {
                // Buscamos el correo en la base de datos:
                const existSessionControl = await sessionController.getUserController(req, res, username);
                // Verificamos si no hubo algun error en el módulo de session, si lo hubo devolvemos el mensaje de error:
                if (existSessionControl.statusCode === 500) {
                    return done(null, false, {
                        statusCode: 500,
                        message: existSessionControl.message
                    });
                } else if (existSessionControl.statusCode === 200) {
                    // Verificamos si el usuario ya esta registrado, en dicho caso le decimos que vaya al login:
                    return done(null, false, {
                        statusCode: 409,
                        message: 'Ya existe una cuenta asociada a este correo. Presione en "Ingresa aquí" para iniciar sesión.'
                    });
                } else if (existSessionControl.statusCode === 404) {

                    // Si el usuario no esta registrado en la base de datos (404), entonces se procede al registro: 
                    const resultCartControl = await cartController.createCartController(req, res);
                    // Validamos si no hubo algun error en el  módulo de cart:
                    if (resultCartControl.statusCode === 500) {
                        return done(null, false, {
                            statusCode: 500,
                            message: resultCartControl.message
                        });
                    } else if (resultCartControl.statusCode === 200) {
                        // Si no hubo error en el  módulo de cart continuamos con el registro.
                        // Extraemos solo el carrito creado:
                        const cart = resultCartControl.result;
                        // Creamos el objeto con los datos del usuario y le añadimos el _id de su carrito: 
                        const newUser = {
                            first_name,
                            last_name,
                            email,
                            age,
                            password: createHash(password),
                            role: 'user',
                            cart: cart._id,
                        };
                        // Creamos el nuevo usuario:
                        const createSessionControl = await sessionController.createUserControler(req, res, newUser);
                         // Verificamos si no hubo algun error en el  módulo de session:
                        if (createSessionControl.statusCode === 500) {
                            return done(null, false, {
                                statusCode: 500,
                                message: createSessionControl.message
                            });
                        } else if (createSessionControl.statusCode === 200) {
                            // Si no hubo error en el  módulo de session se crea el nuevo usuario y se finaliza el registro:
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
    
    // Segunda estrategia - Login:
    passport.use('login', new localStrategy({
            passReqToCallback: true,
            usernameField: 'email'
        },
        async (req, username, password, done) => {
            try {
                  // Verificar si el usuario es admin:
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
                    // Si no es admin procedemos a logueo del usuario. Buscamos el correo en la base de datos: 
                    const existDBSessionControl = await sessionController.getUserController(req, res, username);
                     // Verificamos si no hubo algun error en el módulo de sessions:
                    if (existDBSessionControl.statusCode === 500) {
                        return done(null, false, {
                            statusCode: 500,
                            message: existDBSessionControl.message
                        });
                    } else if (existDBSessionControl.statusCode === 404) {
                        // Si el usuario no esta registrado en la base de datos, entonces le decimos que se registre: 
                        return done(null, false, {
                            statusCode: 404,
                            message: 'No existe una cuenta asociada a este correo. Presione en "Regístrarse aquí" para crear una cuenta.'
                        });
                    } else if (existDBSessionControl.statusCode === 200) {
                         // Verificamos si el usuario ya esta registrado, osea si ya hay una cuenta con el correo proporcionado.
                        const user = existDBSessionControl.result;
                        // Si el usuario existe en la base de datos, verificamos que la contraseña sea válida:
                        if (!isValidPassword(user, password)) {
                            return done(null, false, {
                                statusCode: 409,
                                message: 'Existe una cuenta asociada a este correo, pero la contraseña ingresada es incorrecta.'
                            });
                        } else {
                            // Si la cuenta existe y la contraseña es correcta, modificamos la propiedad last_connection de la session:
                            const lastConnection = {
                                last_connection: new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString()
                            };
                            const lastConnect = await sessionController.updateUserController(req, res, done, user._id, lastConnection);
                            if (lastConnect.statusCode === 200) {
                                // Tambien retornamos el usuario autenticado:
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