import CartDAO from "../DAO/mongodb/CartMongo.dao.js";
import ProductService from "./products.service.js";
import TicketService from "./tickets.service.js";
import {
    envPurchaseOrder
} from "../config.js";

// Clase para el Service de carrito:
export default class CartService {

    // Constructor de CartService:
    constructor() {
        this.cartDao = new CartDAO();
        this.productService = new ProductService();
        this.ticketService = new TicketService();
    }

    // Métodos de CartService:

    // Crear un carrito - Service:
    async createCartService() {
        let response = {};
        try {
            const resultDAO = await this.cartDao.createCart();
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Carrito creado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al crear el carrito - Service: " + error.message;
        };
        return response;
    };

    // Traer un carrito por su ID - Service:
    async getCartByIdService(cid) {
        let response = {};
        try {
            const resultDAO = await this.cartDao.getCartById(cid);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con ID ${cid}.`;
            } else if (resultDAO.status === "success" && resultDAO.delete) {
                response.statusCode = 200;
                if (resultDAO.delete === 1) {
                    response.message = `${resultDAO.delete} producto que tenias en tu carrito ha sido retirado o eliminado de la plataforma.`;
                } else {
                    response.message = `${resultDAO.delete} de los productos que tenías en tu carrito han sido retirados o eliminados de la plataforma.`;
                }
                response.result = resultDAO.result;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Carrito obtenido exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener el carrito por ID - Service: " + error.message;
        };
        return response;
    };

    // Traer todos los carritos - Service:
    async getAllCartsService() {
        let response = {};
        try {
            const resultDAO = await this.cartDao.getAllCarts();
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found carts") {
                response.statusCode = 404;
                response.message = "No se han encontrado carritos.";
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Carritos obtenidos exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener los carritos - Service: " + error.message;
        };
        return response;
    };

    // Agregar un producto a un carrito - Service:
    async addProductToCartService(cid, pid, quantity, userId) {

        let response = {}
        try {
            const product = await this.productService.getProductByIdService(pid);
            if (product.statusCode === 500 || product.statusCode === 404) {
                response.statusCode = product.statusCode;
                response.message = product.message;
            } else if (product.statusCode === 200) {
                if (product.result.owner === "admin" || product.result.owner !== userId) {
                    // Si el owner admin o si el producto no pertenece al user, en ambos casos se puede agregar el producto al carrito: 
                    const resultDAO = await this.cartDao.addProductToCart(cid, product.result, quantity);
                    if (resultDAO.status === "error") {
                        response.statusCode = 500;
                        response.message = resultDAO.message;
                    } else if (resultDAO.status === "not found cart") {
                        response.statusCode = 404;
                        response.message = `No se encontró ningún carrito con ID ${cid}.`;
                    } else if (resultDAO.status === "success") {
                        response.statusCode = 200;
                        response.message = "Producto agregado al carrito exitosamente.";
                        response.result = resultDAO.result;
                    };
                } else if (product.result.owner === userId) {
                    // Si el producto pertenece al user, no se le permite agregar el producto a su carrito: 
                    response.statusCode = 403;
                    response.message = "No puedes agregar tus propios productos a tu carrito.";
                }
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al agregar el producto al carrito - Service: " + error.message;
        };
        return response;

    };

    // Generar orden de compra para el usuario - Service:
    async purchaseOrderService(req, res, cid) {
        let response = {};

        try {
            const cart = await this.getCartByIdService(cid);
            if (cart.statusCode === 500) {
                response.statusCode = 500;
                response.message = cart.message;
            } else if (cart.statusCode === 404) {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con ID ${cid}.`;
            } else if (cart.statusCode === 200) {

                const products = cart.result.products
                if (products.length === 0) {
                    response.statusCode = 404;
                    response.message = `No se encontró ningún producto en el carrito con ID ${cid}.`;
                }
                // Si hay almenos un producto procedemos a generar la orden: 
                if (products.length > 0) {

                    // Creamos un arreglo de productos que se pueden comprar y aquellos que nos, al igual que una variable para para guardar el valor total de la compra: 
                    const successfulProducts = [];
                    const failedProducts = [];
                    let amount = 0;

                    // Separamos los productos que se pueden comprar de aquellos que no y calculamos el total de la compra: 

                    for (const product of products) {

                        // Obtener el _id del producto en la base de datos:
                        const pid = product.product._id;

                        // Obtener la cantidad que se desea comprar de ese producto: 
                        const quantity = product.quantity;

                        // Obtenemos cada producto por su ID en la base de datos
                        const productInDB = await this.productService.getProductByIdService(pid);

                        // Los productos no encontrados y aquellos en que el productService haya devuelto error, se agrega al array de productos fallidos, :   
                        if (productInDB.statusCode === 404 || productInDB.statusCode === 500) {
                            failedProducts.push(product);
                        }

                        // Aquellos cuyo stock sea menor al quantity, tambien se agregan al array de productos fallidos:
                        else if (productInDB.result.stock < quantity) {
                            failedProducts.push(product);
                        }

                        // Si el stock del producto es mayor o igual al quantity, se agrega al agreglo de productos que sí se pueden comprar: 
                        else if (productInDB.result.stock >= quantity) {
                            successfulProducts.push(product);
                            amount += productInDB.result.price * quantity;
                        };

                    };

                    let order = {
                        successfulProducts,
                        failedProducts,
                        amount
                    };

                    res.cookie(envPurchaseOrder, order, {
                        httpOnly: true,
                        signed: true,
                        maxAge: 10 * 60 * 1000
                    });

                    response.statusCode = 200;
                    response.message = "Orden de compra generada exitosamente.";
                    response.result = order;
                }
            };

        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al generar orden de compra - Service: " + error.message;
        };
        return response;
    }

    // Procesamiento de la compra del usuario:
    async purchaseSuccessService(cid, order, email) {

        // Agregamos el email a la order de compra:
        order.email = email;

        let response = {};

        try {

            let errorsStock = [];
            let errorsCart = [];

            // A partir de los succesfulProducts:
            for (let product of order.successfulProducts) {
                // Obtenemos el _id del producto en la base de datos:
                let DBProductID = product.product._id;
                // Obtenemos el _id del producto en el carrito: 
                let cartProductID = product._id;
                // Extraemos la cantidad a comprar de ese producto:     
                let quantity = product.quantity;

                // Buscamos el producto por su ID en la base de datos:
                const productFromDB = await this.productService.getProductByIdService(DBProductID);
                // Restamos del stock del producto la cantidad comprada:
                const updatedProduct = {
                    stock: productFromDB.result.stock - quantity
                };

                // Enviamos el nuevo stock al productService, para actualizar el stock del producto: 
                const updateStock = await this.productService.updateProductService(DBProductID, updatedProduct, "stock");
                // Error al actualizar stock del producto: 
                if (updateStock.statusCode === 500 || updateStock.statusCode === 404) {
                    errorsStock.push("Error al actualizar stock del producto, " + product.product.title + "." + updateStock.message);
                }

                // Eliminamos del carrito los productos que se pudieron comprar usando el ID que tiene el producto en el carrito:
                const updateCart = await this.deleteProductFromCartService(cid, cartProductID);
                // Error al actualizar el carrito:
                if (updateCart.statusCode === 500 || updateCart.statusCode === 404) {
                    errorsCart.push("Error al actualizar carrito con el producto, " + product.product.title + "." + updateCart.message);
                }
            };

            if (errorsStock.length === 0 && errorsCart.length === 0) {

                // Creamos la estructura del ticket con todos los productos de la compra, tanto comprados como aquellos fallidos: 
                const ticketInfo = {
                    successfulProducts: order.successfulProducts.map(product => ({
                        product: product.product._id,
                        quantity: product.quantity,
                        title: product.product.title,
                        price: product.product.price,
                    })),
                    failedProducts: order.failedProducts.map(product => ({
                        product: product.product._id,
                        quantity: product.quantity,
                        title: product.product.title,
                        price: product.product.price,
                    })),
                    purchase: order.email,
                    amount: order.amount
                };

                // Enviamos la estructura al ticketService para crear al el tickect: 
                const ticketServiceResponse = await this.ticketService.createTicketService(ticketInfo);

                // Si hay un error en la creación del ticket lo devolvemos: 
                if (ticketServiceResponse.statusCode === 500) {
                    response.statusCode = 500;
                    response.message = ticketServiceResponse.message;
                }
                // Si el ticket se crea correctamente, continuamos: 
                else if (ticketServiceResponse.statusCode === 200) {
                    // Obtenemos el ID del ticket:
                    const tid = ticketServiceResponse.result._id;
                    // Enviamos el ID del carrito y el ID el ticket para agregar el ticket al carrito:
                    const resultDAO = await this.cartDao.addTicketToCart(cid, tid);
                    if (resultDAO.status === "not found cart") {
                        response.statusCode = 404;
                        response.message = `No se encontró ningún carrito con el ID ${cid}.`;
                    } else if (resultDAO.status === "error") {
                        response.statusCode = 500;
                        response.message = resultDAO.message;
                    } else if (resultDAO.status === "success") {
                        response.statusCode = 200;
                        response.message = "Compra procesada exitosamente. El ticket ya ha sido agregado al carrito.";
                        response.result = ticketServiceResponse.result;
                    };
                };

            }  else if (errorsStock.length > 0 && errorsCart.length > 0) {
                response.statusCode = 500;
                response.message = 'Error al procesar la compra: ' + JSON.stringify(errorsStock, null, 2) || JSON.stringify(errorsCart, null, 2);
            }

        } catch (error) {
            response.statusCode = 500;
            response.message = 'Error al procesar la compra - Service: ' + error.message;
        };
        return response;
    };

    // Eliminar un producto de un carrito: 
    async deleteProductFromCartService(cid, pid) {
        let response = {};
        try {
            const resultDAO = await this.cartDao.deleteProductFromCart(cid, pid);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "not found product") {
                response.statusCode = 404;
                response.message = `No se encontró ningún producto con el ID ${pid}, en el carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Producto eliminado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al borrar el producto en carrito - Service: " + error.message;
        };
        return response;
    };

    // Eliminar todos los productos de un carrito - Service: 
    async deleteAllProductFromCartService(cid) {
        let response = {};
        try {
            const resultDAO = await this.cartDao.deleteAllProductsFromCart(cid);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "not found prod") {
                response.statusCode = 404;
                response.message = `No se encontraron productos en el carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Los productos del carrito se han eliminado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al eliminar todos los productos del carrito - Service: " + error.message;
        };
        return response;
    };

    // Actualizar un carrito - Service:
    async updateCartService(cid, updatedCartFields) {
        const response = {};
        try {
            const resultDAO = await this.cartDao.updateCart(cid, updatedCartFields)
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "update is equal to current") {
                response.statusCode = 409;
                response.message = `La actualización es igual a la versión actual de los datos del carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Carrito actualizado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar el carrito - Service: " + error.message;
        };
        return response;
    };

    // Actualizar la cantidad de un producto en carrito - Service:
    async updateProductInCartService(cid, pid, quantity) {
        let response = {};
        try {
            const resultDAO = await this.cartDao.updateProductInCart(cid, pid, quantity)
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "not found product") {
                response.statusCode = 404;
                response.message = `No se encontró ningún producto con el ID ${pid}, en el carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Producto actualizado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar el producto en el carrito - Service: " + error.message;
        };
        return response;
    };

    // Eliminar un carrito - Service: 
    async deleteCartService(cid) {
        let response = {};
        try {
            const resultDAO = await this.cartDao.deleteCart(cid)
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found cart") {
                response.statusCode = 404;
                response.message = `No se encontró ningún carrito con el ID ${cid}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Carrito eliminado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al eliminar el carrito - Service: " + error.message;
        };
        return response;
    };

};