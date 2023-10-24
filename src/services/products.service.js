import ProductsDAO from "../DAO/mongodb/ProductsMongo.dao.js";
import Mail from '../email/nodemailer.js'


// Clase para el Service de productos: 
export default class ProductService {

    // Constructor de ProductService:
    constructor() {
        this.productDao = new ProductsDAO();
        this.mail = new Mail();
    }

    // Métodos de ProductService:

    // Crear producto - Service:
    async createProductService(info) {
        let response = {};
        try {
            const resultDAO = await this.productDao.createProduct(info);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Producto creado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al crear el producto - Service: " + error.message;
        };
        return response;
    };

    // Traer un producto por su ID - Service:
    async getProductByIdService(pid) {
        let response = {};
        try {
            const resultDAO = await this.productDao.getProductById(pid);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found product") {
                response.statusCode = 404;
                response.message = `No se encontró ningún producto con el ID ${pid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Producto obtenido exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener el producto por ID - Service: " + error.message;
        };
        return response;
    };

    // Traer todos los productos - Service: 
    async getAllProductsService(limit, page, sort, filtro, filtroVal) {
        let response = {};
        try {
            const resultDAO = await this.productDao.getAllProducts(limit, page, sort, filtro, filtroVal);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found products") {
                response.statusCode = 404;
                response.message = `No se encontraron productos.`
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Productos obtenidos exitosamente.";
                response.result = resultDAO.result.products;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener los productos - Service: " + error.message;
        };
        return response;
    };

    // Eliminar un producto por su ID - Service:
    async deleteProductService(pid, requester) {
        let response = {};
        try {
            const productInfo = await this.productDao.getProductById(pid);
            if (productInfo.status === "error") {
                response.statusCode = 500;
                response.message = productInfo.message;
            } else if (productInfo.status === "not found product") {
                response.statusCode = 404;
                response.message = `No se encontró ningún producto con el ID ${pid}.`;
            } else if (productInfo.status === "success") {
                // Si el requester es admin puede eliminar cualquier producto, tanto los suyos como los publicados por usuarios premium. En el caso del user premium este solo puede eliminar los productos que le pertenezcan: 
                if (requester === "admin" || productInfo.result.email === requester) {
                    const resultDAO = await this.productDao.deleteProduct(pid);
                    if (resultDAO.status === "error") {
                        response.statusCode = 500;
                        response.message = resultDAO.message;
                    } else if (resultDAO.status === "not found product") {
                        response.statusCode = 404;
                        response.message = `No se encontró ningún producto con el ID ${pid}.`;
                    } else if (resultDAO.status === "success") {
                        // Cuando un admin elimina un producto publicado por el mismo:
                        if (requester === "admin" && productInfo.result.email === null) {
                            response.statusCode = 200;
                            response.message = "Producto eliminado exitosamente.";
                            response.result = resultDAO.result;
                        } else if (productInfo.result.email === requester) {
                            // Cuando un usuario premium borra un porducto publicado por el mismo: 
                            response.statusCode = 200;
                            response.message = "Producto eliminado exitosamente.";
                            response.result = resultDAO.result;
                        } else if (requester === "admin" && productInfo.result.email !== null) {
                            // Cuando un admin elimina un producto que pertenece a un usaurio premium, en dicho caso se envia el correo de notificación:
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
                                            <h2 style="font-size: 24px; margin: 0;">Notificación de eliminación de producto:</h2>
                                            <p style="font-size: 16px;">
                                            Estimado usuario, queremos informarte que uno de tus productos publicados en nuestra plataforma ha sido eliminado debido a un incumplimiento de nuestras políticas y directrices. Queremos garantizar que nuestra plataforma sea un lugar seguro y confiable para todos los usuarios, por lo que debemos tomar medidas para mantener la integridad de los productos listados.
                                            </p>
                                            <p style="font-size: 16px; font-weight: bold;">
                                            Detalles del producto eliminado:
                                            </p>
                                            <p style="font-size: 16px; font-weight: bold;">
                                            - Nombre del producto: ${productInfo.result.title}
                                            </p>
                                            <p style="font-size: 16px; font-weight: bold;">
                                            - Fecha y hora de eliminación: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()} </p>
                                            <p style="font-size: 16px;">Lamentamos que esta acción haya sido necesaria, pero es fundamental para mantener la calidad y seguridad de nuestra plataforma para todos los usuarios. Gracias por tu comprensión y para cualquier consulta, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                                        </td>
                                    </tr>
                                </table>`;
                            // Enviamos el correo al Nodemailer: 
                            const resultSendMail = await this.mail.sendMail(productInfo.result.email, "Notificación de eliminación de producto", html);
                            // Verificamos si el correo se envió correctamente:
                            if (resultSendMail.accepted.length > 0) {
                                response.statusCode = 200;
                                response.message = "Producto eliminado y correo de notificación enviado al usuario premium exitosamente.";
                                response.result = resultDAO.result;
                            } else if ((resultSendMail.rejected && resultSendMail.rejected.length > 0)) {
                                response.statusCode = 500;
                                response.message = "Error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.";
                            };
                        }
                    }
                } else {
                    // Si el user premium intenta eliminar un producto que no le pertenecer se le deniega la acción:
                    response.statusCode = 403;
                    response.message = "Solo puedes eliminar los productos que te pertenecen.";
                };
            }
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al eliminar el producto - Service: " + error.message;
        };
        return response;
    };

    // Eliminar todos los productos publicados por un usuario premium - Service:
    async deleteAllPremiumProductService(uid, userRequestId, role) {
        let response = {};
        try {
            if (role === "admin" || uid === userRequestId) {
                // Si el role es admin puede eliminar todos los productos publicados por cualquier usuario. Pero se les envia un correo de notificación a dichos usuarios.
                // Los usuarios solo pueden eliminar todos los productos que ellos mismos hayan publicado siendo usuarios premium.
                const resultDAO = await this.productDao.deleteAllPremiumProduct(uid, role);
                if (resultDAO.status === "error") {
                    response.statusCode = 500;
                    response.message = resultDAO.message;
                } else if (resultDAO.status === "not found products") {
                    response.statusCode = 404;
                    response.message = `No se encontraron productos asociados a esta cuenta.`;
                } else if (resultDAO.status === "success") {
                    // Si no se devuelve el userEmail significa que fue el usuario premium quien ha eliminado todos sus productos, ya sea al cerrar su cuenta o al cambiar su role de premium a user, por ende, no se necesita enarle un correo de notificación: 
                    if (!resultDAO.userEmail) {
                        response.statusCode = 200;
                        response.message = resultDAO.message
                    } else if (resultDAO.userEmail) {
                        // Cuerpo del correo
                        let html = `
                        <table cellspacing="0" cellpadding="0" width="100%">
                            <tr>
                                <td style="text-align: center;">
                                <img src="https://i.ibb.co/hd9vsgK/Logo-BK-Grande.png" alt="Logo-BK-Grande" border="0" style="max-width: 40% !important;">
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center;">
                                <h2 style="font-size: 24px; margin: 0;">Notificación de eliminación de producto:</h2>
                                <p style="font-size: 16px;">
                                    Estimado usuario, queremos informarte que los productos que has publicado en nuestra plataforma han sido eliminado debido a un incumplimiento de nuestras políticas y directrices. Queremos garantizar que nuestra plataforma sea un lugar seguro y confiable para todos los usuarios, por lo que debemos tomar medidas para mantener la integridad de los productos listados.
                                </p>
                                </td>
                            </tr>
                            <tr display: flex; justify-content: center; align-items: center; flex-direction: column;>
                                <td style="text-align: center;">
                                <p style="font-size: 16px; font-weight: bold;">Productos eliminados:</p>
                            `;
                        // Agregar los nombres de los productos eliminados al cuerpo del correo
                        resultDAO.deletedProducts.forEach((productName) => {
                            html += `<p style="font-size: 16px;"> - ${productName}</p>`;
                        });
                        html += `
                                <p style="font-size: 16px; font-weight: bold;">Fecha y hora de eliminación: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}</p>
                                <p style="font-size: 16px;">Lamentamos que esta acción haya sido necesaria, pero es fundamental para mantener la calidad y seguridad de nuestra plataforma para todos los usuarios. Gracias por tu comprensión y para cualquier consulta, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                                </td>
                            </tr>
                        </table>
                        `;
                        // Enviamos el correo al Nodemailer: 
                        const resultSendMail = await this.mail.sendMail(resultDAO.userEmail, "Notificación de eliminación de producto", html);
                        // Verificamos si el correo se envió correctamente:
                        if (resultSendMail.accepted.length > 0) {
                            response.statusCode = 200;
                            response.message = "Productos eliminados y correo de notificación enviado al usuario premium exitosamente.";
                            response.result = resultDAO.result;
                        } else if (resultSendMail.rejected && resultSendMail.rejected.length > 0) {
                            response.statusCode = 500;
                            response.message = "Error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.";
                        };
                    }
                };
            } else {
                // Si el role no es admin y el id del usuario que hace la petición no coincide con el id del usuario cuyos productos se desea eliminar,  se deniega la acción:
                response.statusCode = 403;
                response.message = "Solo puedes eliminar los productos que te pertenecen.";
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al eliminar todos los productos de usuario premium - Service: " + error.message;
        };
        return response;
    };

    // Actualizar un producto - Service: 
    async updateProductService(pid, updateProduct, owner) {
        let response = {};
        try {
            const productInfo = await this.productDao.getProductById(pid);
            if (productInfo.status === "error") {
                response.statusCode = 500;
                response.message = productInfo.message;
            } else if (productInfo.status === "not found product") {
                response.statusCode = 404;
                response.message = `No se encontró ningún producto con el ID ${pid}.`;
            } else if (productInfo.status === "success") {
                // Para actualizar stock de productos comprados:
                if (owner === "stock") {
                    const resultDAO = await this.productDao.updateProduct(pid, updateProduct);
                    if (resultDAO.status === "error") {
                        response.statusCode = 500;
                        response.message = resultDAO.message;
                    } else if (resultDAO.status === "not found product") {
                        response.statusCode = 404;
                        response.message = `No se encontró ningún producto con el ID ${pid}.`;
                    } else if (resultDAO.status === "success") {
                        response.statusCode = 200;
                        response.message = "Producto actualizado exitosamente.";
                        response.result = "Stock actualizado."
                    };
                }
                if (owner === "admin" && productInfo.result.owner === "admin" || productInfo.result.owner === owner) {
                    // El admin solo puede actualizar sus propios productos (Por seguridad), lo mismo aplica a los usuarios premium:
                    const resultDAO = await this.productDao.updateProduct(pid, updateProduct);
                    if (resultDAO.status === "error") {
                        response.statusCode = 500;
                        response.message = resultDAO.message;
                    } else if (resultDAO.status === "not found product") {
                        response.statusCode = 404;
                        response.message = `No se encontró ningún producto con el ID ${pid}.`;
                    } else if (resultDAO.status === "update is equal to current") {
                        response.statusCode = 409;
                        response.message = 'La actualización es igual a la versión actual de los datos del producto.'
                    } else if (resultDAO.status === "success") {
                        response.statusCode = 200;
                        response.message = "Producto actualizado exitosamente.";
                        response.result = resultDAO.result;
                    };
                } else {
                    // Si el user premium que intenta actualizar un producto que no le pertenece se le deniega la actialización:
                    response.statusCode = 403;
                    response.message = "Solo puedes modificar los productos que te pertenecen.";
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar el producto - Service: " + error.message;
        };
        return response;
    };

};