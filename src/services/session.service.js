import SessionDAO from "../DAO/mongodb/SessionMongo.dao.js";
import CartService from "./carts.service.js";
import ProductService from "./products.service.js";
import Mail from '../email/nodemailer.js'
import jwt from 'jsonwebtoken';
import {
    createHash,
    isValidPassword
} from "../utils.js";
import {
    envResetPassToken,
    envCoderTokenCookie,
    envCoderSecret,
    envUrlResetPass
} from '../config.js'

// Clase para el Service de session: 
export default class SessionService {

    // Constructor de SessionService: 
    constructor() {
        this.sessionDAO = new SessionDAO();
        this.cartService = new CartService();
        this.productsService = new ProductService();
        this.mail = new Mail();
    };

    // Métodos de SessionService: 

    // Crear usuario - Service:
    async createUserService(info) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.createUser(info);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario registrado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al registrar al usuario - Service: " + error.message;
        };
        return response;
    };

    // Buscar usuario - Service:
    async getUserService(identifier) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.getUser(identifier);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ningún usuario con el Email, Nombre o ID, ${identifier}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario obtenido exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener el usuario - Service: " + error.message;
        };
        return response;
    }

    // Actualizar usuario - Service: 
    async updateUserSevice(uid, updateUser) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.updateUser(uid, updateUser);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = "Usuario no encontrado.";
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario actualizado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar los datos del usuario - Service: " + error.message;
        };
        return response;
    };

    // Enviar email para reestablecer contraseña - Service: 
    async getUserAndSendEmailService(email) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.getUser(email);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ninguna cuenta asociada a este correo, ${email}.`;
            } else if (resultDAO.status === "success") {
                // Usuario:
                const user = resultDAO.result;
                // Token - 1h: 
                let token = jwt.sign({
                    email
                }, envResetPassToken, {
                    expiresIn: '1h'
                })
                // Cuerpo del correo:
                let html = `
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                        <td style="text-align: center;">
                            <img src="https://i.ibb.co/hd9vsgK/Logo-BK-Grande.png" alt="Logo-BK-Grande" border="0" style="max-width: 40% !important; ">
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                        <h2 style="font-size: 24px; margin: 0;">Enlace para restablecimiento de contraseña:</h2>
                            <p style="font-size: 16px;">
                            Haga click en el siguiente enlace para restablecer su contraseña:</p>
                            <a href="${envUrlResetPass}${token}" 
                            style="
                            background-color: #95d0f7;
                            color: #ffffff; 
                            text-decoration: none;
                            padding: 10px 20px; 
                            border-radius: 1em; 
                            font-size: 16px; 
                            margin: 10px 0; 
                            display: inline-block;"
                            >Restablecer contraseña</a>
                            <p style="font-size: 16px; font-weight: bold;">IMPORTANTE: La validez de este enlace es de 1 hora. Una vez que haya pasado este período, el enlace te llevará automáticamente a la página de "Restablecer Contraseña - Solicitar Correo", donde podrás solicitar uno nuevo.</p>
                            <p style="font-size: 16px;">Gracias, ${user.first_name}.</p>
                            <p style="font-size: 16px;">Para cualquier consulta, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                            </td>
                    </tr>
                </table>`;
                // Enviamos el correo al Nodemailer: 
                const resultSendMail = await this.mail.sendMail(user.email, "Restablecimiento de contraseña.", html);
                // Verificamos si el correo se envió correctamente:
                if (resultSendMail.accepted.length > 0) {
                    response.statusCode = 200;
                    response.message = "Correo enviado exitosamente.";
                    response.result = resultSendMail;
                } else if (resultSendMail.rejected && resultSendMail.rejected.length > 0) {
                    response.statusCode = 500;
                    response.message = "Error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.";
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al enviar email para restablecer contraseña - Service: " + error.message;
        };
        return response;
    };

    // Reestablecer contraseña - Service: 
    async resetPassUser(userEmail, newPass) {
        let response = {
            userEmail
        };
        try {
            // Buscamos al usuario en la base de datos por su correo: 
            const resultDAO = await this.sessionDAO.getUser(userEmail);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ninguna cuenta asociada a este correo, ${userEmail}.`;
            } else if (resultDAO.status === "success") {
                // Si el usuario existe, verificamos si la nueva contraseña es igual a la actual: 
                const user = resultDAO.result
                // Si es igual retronamos un error y pedimos una nueva contraseña:
                if (isValidPassword(user, newPass)) {
                    response.statusCode = 400;
                    response.message = `La nueva contraseña que has proporcionado es idéntica a tu contraseña actual. Para restablecer la contraseña, por favor introduce una contraseña diferente. Si prefieres mantener tu contraseña actual, puedes iniciar sesión utilizando tus credenciales habituales haciendo clic en "Iniciar sesión".`;
                } else {
                    // Si la nueva contraseña es distinta a la actual, reestablecemos la contraseña:
                    const password = createHash(newPass);
                    const updateUser = {
                        password
                    };
                    // Enviamos el id del usuario y su nueva contraseña hasheada: 
                    const resultUpdt = await this.sessionDAO.updateUser(user._id, updateUser);
                    // Validamos los resultados:
                    if (resultUpdt.status === "error") {
                        response.statusCode = 500;
                        response.message = resultUpdt.message;
                    } else if (resultUpdt.status === "not found user") {
                        response.statusCode = 404;
                        response.message = "Usuario no encontrado.";
                    } else if (resultUpdt.status === "success") {
                        response.statusCode = 200;
                        response.message = "Usuario actualizado exitosamente.";
                        response.result = resultUpdt.result;
                    };
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al restablecer contraseña - Service: " + error.message;
        };
        return response;
    };

    // Editar perfil - Service: 
    async updateProfileSevice(req, res, uid, updateProfile) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.updateUser(uid, updateProfile);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = "Usuario no encontrado.";
            } else if (resultDAO.status === "success") {
                // Traemos al usuario actualizado:
                const newUser = await this.sessionDAO.getUser(uid);
                if (newUser.status = "success") {
                    //  Actualizamos el email del usuario en el token: 
                    let token = jwt.sign({
                        email: newUser.result.email,
                        first_name: newUser.result.first_name,
                        role: newUser.result.role,
                        cart: newUser.result.cart,
                        userID: newUser.result._id
                    }, envCoderSecret, {
                        expiresIn: '7d'
                    });
                    // Sobrescribimos la cookie:
                    res.cookie(envCoderTokenCookie, token, {
                        httpOnly: true,
                        signed: true,
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })
                    response.statusCode = 200;
                    response.message = "Usuario actualizado exitosamente.";
                }
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar los datos del usuario - Service: " + error.message;
        };
        return response;
    };

    // Cerrar session - Service:
    async logoutService(req, res, uid) {
        let response = {};
        try {
            if (uid !== null) {
                const lastConnection = {
                    last_connection: new Date().toLocaleDateString() + " - " + new Date().toLocaleTimeString()
                };
                // Enviamos el id del usuario y su last_connection:
                const resultUpdt = await this.sessionDAO.updateUser(uid, lastConnection);
                // Validamos los resultados:
                if (resultUpdt.status === "error") {
                    response.statusCode = 500;
                    response.message = resultUpdt.message;
                } else if (resultUpdt.status === "not found user") {
                    response.statusCode = 404;
                    response.message = "Usuario no encontrado.";
                } else if (resultUpdt.status === "success") {
                    // Luego de actualizar el last_connection, eliminamos el token de la cookie:
                    res.cookie(envCoderTokenCookie, "", {
                        httpOnly: true,
                        signed: true,
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })
                    // Devolvemos un status 200:
                    response.statusCode = 200;
                    response.message = "Session cerrada exitosamente.";
                };
            } else if (uid === null) {
                // Eliminamos el token de la cookie:
                res.cookie(envCoderTokenCookie, "", {
                    httpOnly: true,
                    signed: true,
                    maxAge: 7 * 24 * 60 * 60 * 1000
                })
                // Devolvemos un status 200:
                response.statusCode = 200;
                response.message = "Session cerrada exitosamente.";
            }
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al cerrar session - Service: " + error.message;
        };
        return response;
    };

    // Eliminar cuenta - Service: 
    async deleteUserService(uid, role) {
        let response = {};
        try {
            let cid;
            let email;
            let name;
            const userInfo = await this.getUserService(uid)
            if (userInfo.statusCode === 500) {
                response.statusCode = 500;
                response.message = userInfo.message;
            } else if (userInfo.statusCode === 404) {
                response.statusCode = 404;
                response.message = `No se encontró ningún usuario con el ID, ${uid}.`;
            } else if (userInfo.statusCode === 200) {
                // Extraemos al info necesaria:
                cid = userInfo.result.cart;
                email = userInfo.result.email;
                name = userInfo.result.first_name;
                // Eliminamos al usuario: 
                const resultDAO = await this.sessionDAO.deleteUser(uid);
                // Validamos la eliminación:
                if (resultDAO.status === "error") {
                    response.statusCode = 500;
                    response.message = resultDAO.message;
                } else if (resultDAO.status === "not found user") {
                    response.statusCode = 404;
                    response.message = `No se encontró ninguna cuenta con este ID, ${uid}.`;
                } else if (resultDAO.status === "success") {
                    // Borramos el carrito del usuario:
                    const deleteCart = await this.cartService.deleteCartService(cid);
                    // Borramos todos los productos publicados por el usuario:
                    const deleteUserProducts = await this.productsService.deleteAllPremiumProductService(uid, uid, role);
                    let errorCorreo;
                    if (role === "admin") {
                        // Creamos el cuerpo del correo: 
                        let html = `
                                    <table cellspacing="0" cellpadding="0" width="100%">
                                        <tr>
                                            <td style="text-align: center;">
                                                <img src="https://i.ibb.co/hd9vsgK/Logo-BK-Grande.png" alt="Logo-BK-Grande" border="0" style="max-width: 40% !important;">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="text-align: center;">
                                                <h2 style="font-size: 24px; margin: 0;">Notificación de eliminación de cuenta</h2>
                                                <p style="font-size: 16px;">
                                                    Estimado ${name}, lamentamos informarte que tu cuenta ha sido eliminada por el administrador. Esta acción fue necesaria para mantener la calidad y seguridad de nuestra plataforma, si consideras que cometimos un error, tienes alguna pregunta o necesitas asistencia, no dudes en ponerte en contacto con nuestro equipo de soporte.
                                                </p>
                                                <p style="font-size: 16px; font-weight: bold;">
                                                    - Fecha y hora de eliminación: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}
                                                </p>
                                                <p style="font-size: 16px;">
                                                    Gracias por tu comprensión.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>`
                        // Envía el correo utilizando la dirección de correo electrónico proporcionada en 'email':
                        const resultSendMail = await this.mail.sendMail(email, "Notificación de eliminación de cuenta", html);
                        if (resultSendMail.rejected && resultSendMail.rejected.length > 0) {
                            errorCorreo = true;
                            errorCorreo.message = "La cuenta, se ha eliminado pero ocurrio un error al intantar enviar el correo de notificación al usuario."
                        }
                    }
                    // Validamos los resultados:
                    if (deleteCart.statusCode === "error" || deleteUserProducts.statusCode === "error" || errorCorreo === true) {
                        response.statusCode = 500;
                        response.message = "Error al eliminar la cuenta: " + deleteCart.message || deleteUserProducts.message || errorCorreo.message
                    } else if (deleteCart.statusCode === 200 && deleteUserProducts.statusCode === 404) {
                        response.statusCode = 200;
                        response.message = "Cuenta eliminada exitosamente. No se encontraron productos asociados a la cuenta.";
                    } else if (deleteCart.statusCode === 200 && deleteUserProducts.statusCode === 200) {
                        response.statusCode = 200;
                        response.message = "Cuenta eliminada exitosamente. " + deleteUserProducts.message;
                    }
                }
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al eliminar cuenta - Service: " + error.message;
        };
        return response;
    };

};