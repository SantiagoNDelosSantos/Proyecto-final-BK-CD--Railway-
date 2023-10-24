import {
    Router
} from "express";
import ProductController from "../controllers/productsController.js";
import passport from "passport";
import {
    rolesRMiddlewareAdminAndPremium,
    rolesRMiddlewarePublic
} from "./Middlewares/rolesRoutes.middleware.js";
import {
    uploaderProducts
} from "./Middlewares/multer.middleware.js";

const productsRouter = Router();
let productController = new ProductController();

// Crear un producto - Router:
productsRouter.post('/', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium, uploaderProducts.fields([{
    name: 'frontImg',
    maxCount: 1
}, {
    name: 'backImg',
    maxCount: 1
}]), async (req, res, next) => {
    const result = await productController.createProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Traer un producto por su ID - Router: 
productsRouter.get('/:pid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await productController.getProductByIDController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Traer todos los productos - Router: 
productsRouter.get('/', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await productController.getAllProductsController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar un producto por su ID - Router:
productsRouter.delete('/:pid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium, async (req, res, next) => {
    const result = await productController.deleteProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar todos los productos publicados por un usuario premium - router:
productsRouter.delete('/deleteProdPremium/:uid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium, async (req, res, next) => {
    const result = await productController.deleteAllPremiumProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Actualizar un producto - Router:
productsRouter.put('/:pid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium,  uploaderProducts.fields([{
    name: 'frontImg',
    maxCount: 1
}, {
    name: 'backImg',
    maxCount: 1
}]), async (req, res, next) => {
    const result = await productController.updatedProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Export productsRouter:
export default productsRouter;