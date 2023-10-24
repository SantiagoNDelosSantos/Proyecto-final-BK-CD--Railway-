import mongoose from "mongoose";
import {
    productsModel
} from "./models/products.model.js";
import {
    envMongoURL
} from "../../config.js";

// Clase para el DAO de productos:
export default class ProductsDAO {

    // Conexión Mongoose:
    connection = mongoose.connect(envMongoURL);

    // Crear producto - DAO:
    async createProduct(info) {
        let response = {};
        try {
            const result = await productsModel.create(info);
            response.status = "success";
            response.result = result;
        } catch (error) {
            response.status = "error";
            response.message = "Error al crear el producto - DAO: " + error.message;
        };
        return response;
    };

    // Traer un producto por su ID - DAO:
    async getProductById(pid) {
        let response = {};
        try {
            const result = await productsModel.findOne({
                _id: pid
            });
            if (result === null) {
                response.status = "not found product";
            } else {
                response.status = "success";
                response.result = result;
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al obtener el producto por ID - DAO: " + error.message;
        };
        return response;
    };

    // Traer todos los productos - DAO:
    async getAllProducts(limit = 10, page = 1, sort = 1, filtro = null, filtroVal = null) {
        let response = {};
        try {
            let whereOptions = {};
            if (filtro != '' && filtroVal != '') {
                whereOptions = {
                    [filtro]: filtroVal
                };
            };
            let result = {};
            if (sort !== 1) {
                result = await productsModel.paginate(whereOptions, {
                    limit: limit,
                    page: page,
                    sort: {
                        price: sort
                    },
                });
            } else {
                result = await productsModel.paginate(whereOptions, {
                    limit: limit,
                    page: page,
                });
            }
            if (result.docs.length === 0) {
                response.status = "not found products";
            } else {
                response.status = "success";
                response.result = {
                    products: result
                };
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al obtener los productos - DAO: " + error.message;
        };
        return response;
    };

    // Eliminar un producto por su ID - DAO:
    async deleteProduct(pid) {
        let response = {};
        try {
            const result = await productsModel.findOne({
                _id: pid
            });
            if (result === null) {
                response.status = "not found product";
            } else {
                // Eliminar el producto de la colección de productos:
                const result2 = await productsModel.deleteOne({
                    _id: pid
                });
                if (result2.deletedCount === 0) {
                    response.status = "not found product";
                } else if (result2.deletedCount === 1) {
                    response.status = "success";
                    response.result = result;
                };
            }
        } catch (error) {
            response.status = "error";
            response.message = "Error al eliminar el producto - DAO: " + error.message;
        };
        return response;
    };

    // Eliminar todos los productos publicados por un usuario premium - DAO:
    async deleteAllPremiumProduct(uid, role) {
        let response = {};
        try {
            // Buscar todos los productos con el campo 'owner' igual al uid del usuario indicado:
            const productsToDelete = await productsModel.find({
                owner: uid
            });
            // Verificar si se encontraron productos:
            if (productsToDelete.length === 0) {
                response.status = "not found products";
            } else {
                // Si se encontraron eliminamos los productos en la colección:
                const result = await productsModel.deleteMany({
                    owner: uid
                });
                // Validamos el resultado:
                if (result.deletedCount > 0) {
                    // Si el role es admin tambien devolvemos el correo del usuario cuyos productos se eliminaron:
                    if (role === "admin") {
                        //Extraemos el correo del usuario para enviarle su email de notificación, en caso de que la eliminación la solicitara el admin: 
                        const userEmail = productsToDelete[0].email;
                        // Extreamos todos los title de los productos para que el usuario sepa que productos se eliminaron exactamente: 
                        const deletedProducts = [];
                        for (const product of productsToDelete) {
                            const title = product.title;
                            deletedProducts.push(title);
                        }
                        response.status = "success";
                        response.userEmail = userEmail;
                        response.deletedProducts = deletedProducts;
                        response.message = `Se han eliminaron ${result.deletedCount} productos asociados a la cuenta.`;
                    } else {
                        response.status = "success";
                        response.message = `Se han eliminaron ${result.deletedCount} productos asociados a la cuenta.`;
                    }
                } else {
                    response.status = "error";
                    response.message = "No se pudieron eliminar los productos (deleteMany).";
                }
            }
        } catch (error) {
            response.status = "error";
            response.message = "Error al eliminar todos los productos de usuario premium - DAO: " + error.message;
        }
        return response;
    };

    // Actualizar un producto - DAO:
    async updateProduct(pid, updateProduct) {
        let response = {};
        try {
            const result = await productsModel.updateOne({
                _id: pid
            }, {
                $set: updateProduct
            });
            if (result.matchedCount === 0) {
                response.status = "not found product";
            } else if (result.matchedCount === 1) {
                if (result.modifiedCount === 0) {
                    response.status = "update is equal to current";
                } else if (result.modifiedCount === 1) {
                    response.status = "success";
                    response.result = result;
                }
            };
        } catch (error) {
            response.status = "error";
            response.message = "Error al actualizar el producto - DAO: " + error.message;
        };
        return response;
    };

};