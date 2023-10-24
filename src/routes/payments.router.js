import { Router } from "express";
import passport from "passport";
import {
    rolesRMiddlewareUsers
} from "./Middlewares/rolesRoutes.middleware.js";
import PaymentsController from "../controllers/paymentsController.js";

const paymentsRouter = Router();
let paymentsController = new PaymentsController();

// Generar intento de pago - Router:
paymentsRouter.get('/paymentsIntents', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, async (req, res, next) => {
    const result = await paymentsController.newPaymentIntentController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

export default paymentsRouter;