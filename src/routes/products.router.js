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
productsRouter.get('/:pid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await productController.getProductByIDController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
}); 
productsRouter.get('/', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await productController.getAllProductsController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});
productsRouter.delete('/:pid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium, async (req, res, next) => {
    const result = await productController.deleteProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});
productsRouter.delete('/deleteProdPremium/:uid', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareAdminAndPremium, async (req, res, next) => {
    const result = await productController.deleteAllPremiumProductController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});
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
export default productsRouter;