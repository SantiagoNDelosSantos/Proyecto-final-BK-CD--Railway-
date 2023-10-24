import passport from 'passport';
import {
    Strategy as GitHubStrategy
} from 'passport-github2';
import SessionController from '../controllers/sessionController.js';
import CartController from '../controllers/cartController.js';
import {
    envClientID,
    envClientSecret
} from '../config.js';

// Instancia de SessionController: 
let sessionController = new SessionController();
// Instancia de CartController: 
let cartController = new CartController();

// GitHub Strategy:
export const initializePassportGitHub = (req, res, next) => {
    passport.use('github', new GitHubStrategy({
        clientID: envClientID,
        clientSecret: envClientSecret,
        callbackURL: 'https://proyecto-final-bk-cd-railway-production.up.railway.app/api/sessions/githubcallback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const session = profile._json.name;
            if (session) {
                return done(null, session);
            }
        } catch (error) {
            return done(null, false, {
                statusCode: 500,
                message: 'Error de registro en la autenticación por GitHub - gitHub.passport.js: ' + error.message
            });
        };
    }));
};

// Función para crear el usuario con los datos de GitHub:
export const createBDUserGH = async (req, res, next, user) => {
    let response = {};
    try {
        // Buscamos al usuario en la base de datos: 
        const existSessionControl = await sessionController.getUserController(req, res, user);
        // Verificamos si no hubo algun error en el  módulo de sessions:
        if (existSessionControl.statusCode === 500) {
            response.statusCode = 500;
            response.message = existSessionControl.message;
            return response;
        }
        // Verificamos si la session existe:
        if (existSessionControl.statusCode === 200) {
            // Si la cuenta existe, modificamos la propiedad last_connection de la session:
            const lastConnection = {
                last_connection: new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString()
            };
            const lastConnect = await sessionController.updateUserController(req, res, next, existSessionControl.result._id.toString(), lastConnection);
            if (lastConnect.statusCode === 200) {
                // En dicho caso Tambien,  devolvemos el resultado: 
                response.statusCode = 200;
                response.result = existSessionControl.result;
                return response;
            }
        } else if (existSessionControl.statusCode === 404) {
            // Si el usuario no esta registrado en la base de datos, entonces se procede a crear un usuario con los datos de GitHub.
            // Creamos un carrito para el usuario: 
            const resultCartControl = await cartController.createCartController(req, res);
            // Validamos si no hubo algun error en el  módulo de cart:
            if (resultCartControl.statusCode === 500) {
                response.statusCode = 500;
                response.message = resultCartControl.message;
                return response;
            }
            // Si no hubo error en el módulo de cart continuamos con la creación del usuario:
            if (resultCartControl.statusCode === 200) {
                // Extraemos el carrito creado por el cartController: 
                const cart = resultCartControl.result;
                // Creamos el objeto con los datos del usuario y le añadimos el _id de su carrito:
                const newUser = {
                    first_name: user,
                    last_name: "X",
                    email: "X",
                    age: 0,
                    password: "Sin contraseña.",
                    role: "user",
                    cart: cart._id,
                };
                // Creamos el nuevo usuario:
                const createSessionControl = await sessionController.createUserControler(req, res, newUser);
                   // Verificamos si no hubo algun error en el  módulo de session:
                if (createSessionControl.statusCode === 500) {
                    response.statusCode = 500;
                    response.message = createSessionControl.message;
                    return response;
                }
                // Si no hubo error en el módulo de session:
                if (createSessionControl.statusCode === 200) {
                    // Modificamos la propiedad last_connection de la session:
                    const lastConnection = {
                        last_connection: new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString()
                    };
                    const lastConnect = await sessionController.updateUserController(req, res, next, createSessionControl.result._id.toString(), lastConnection);
                    if (lastConnect.statusCode === 200) {
                        // Tambien devolvemos el nuevo "usuario base":
                        response.statusCode = 200;
                        response.result = createSessionControl.result;
                        return response;
                    }
                }
            }
        };
    } catch (error) {
        response.statusCode = 500;
        response.message = 'Error de registro en createBDSessionGH - github.passport.js: ' + error.message;
        req.logger.error(response.message);
        return response;
    };
};