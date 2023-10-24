import { Router } from "express";
import CartController from '../controllers/cartController.js';
import passport from "passport";
import { rolesRMiddlewareUsers, rolesRMiddlewareAdmin, rolesRMiddlewarePublic } from './Middlewares/rolesRoutes.middleware.js'; 
import { verificarPertenenciaCarrito } from "./Middlewares/carts.middleware.js";

const cartRouter = Router();
let cartController = new CartController();

// Crear un carrito - Router:
cartRouter.post("/", async (req, res) => {
    const result = await cartController.createCartController(req, res);
    res.status(result.statusCode).send(result);
})

// Traer un carrito por su ID - Router:
cartRouter.get("/:cid", passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, async (req, res, next) => {
    const result = await cartController.getCartByIdController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Traer todos los carritos - Router: 
cartRouter.get('/', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdmin, async (req, res) => {
    const result = await cartController.getAllCartsController(req, res);
    res.status(result.statusCode).send(result);
});

// Agregar un producto a un carrito - Router: 
cartRouter.post('/:cid/products/:pid/quantity/:quantity', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.addProductInCartController(req, res, next); 
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Generar orden de compra para el usuario - Router:
cartRouter.post('/:cid/orderGeneration', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken' }), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.purchaseOrderController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Actualizar products, cart y generar el ticket si el pago de la compra fue exitoso - Router:
cartRouter.post('/:cid/purchaseSuccess', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.purchaseSuccessController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar un producto en carrito - Router:
cartRouter.delete('/:cid/products/:pid', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.deleteProductFromCartController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar todos los productos de un carrito - Router:
cartRouter.delete('/:cid', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.deleteAllProductsFromCartController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Actualizar un carrito - Router:
cartRouter.put('/:cid',passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.updateCartController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Actualizar la cantidad de un produco en carrito - Router:
cartRouter.put('/:cid/products/:pid', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, verificarPertenenciaCarrito, async (req, res, next) => {
    const result = await cartController.updateProductInCartController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar un carrito - Router:
cartRouter.delete('/deleteCart/:cid', passport.authenticate('jwt', { session: false, failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await cartController.deleteCartController(req, res, next);
    if(result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

export default cartRouter;