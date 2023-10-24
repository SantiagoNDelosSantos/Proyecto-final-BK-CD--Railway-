import express, { urlencoded } from 'express';
import mongoose from 'mongoose';
import handlebars from "express-handlebars";
import __dirname from './utils.js';
import { Server } from 'socket.io';
import cartRouter from './routes/cart.router.js';
import msmRouter from './routes/message.router.js';
import productsRouter from './routes/products.router.js';
import sessionRouter from './routes/session.router.js'
import viewsRouter from "./routes/views.router.js";
import ticketRouter from "./routes/ticket.router.js";
import mockRouter from './routes/mock.router.js'
import loggerRouter from './routes/loggerTest.router.js'
import userRouter from './routes/user.router.js';
import paymentsRouter from './routes/payments.router.js'
import ViewsController from './controllers/viewsController.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { initializePassportLocal } from './config/local.passport.js';
import { initializePassportGitHub } from './config/gitHub.passport.js';
import { initializePassportJWT } from './config/jwt.passport.js';
import { envMongoURL, envPort, envCookieParser } from './config.js';
import { errorMiddleware } from './errors/error.middleware.js'
import { logger, addLogger } from './logs/logger.config.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import cors from 'cors'
const app = express();
const connection = mongoose.connect(envMongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(cors())
app.use(express.json());
app.use(urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');
app.use(addLogger);
app.use(cookieParser(envCookieParser));
initializePassportLocal();
initializePassportJWT();
initializePassportGitHub();
app.use(passport.initialize());
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Documentación eCommerce - Global Technology',
            description: 'Esta documentación corresponde al proyecto de eCommerce desarrollado por el alumno Santiago N. De los Santos como parte del curso de Backend de CoderHouse. A continuación, se presenta una descripción detallada de los modulos "products" y "carts.'
        },
    },
    apis: [`${__dirname}/docs/**/*.yaml`]
}
const specs = swaggerJSDoc(swaggerOptions)
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs))
const expressServer = app.listen(envPort, () => {
    logger.info(`Servidor iniciado en el puerto ${envPort}.`);
});
const socketServer = new Server(expressServer);
let viewsController = new ViewsController();
socketServer.on("connection", async (socket) => {
    logger.info("¡Nuevo cliente conectado!", socket.id)
    const productsResponse = await viewsController.getAllProductsControllerV();
    socket.emit('products', productsResponse);
    socket.on('busquedaFiltrada', async (busquedaProducts) => {
        const {
            limit,
            page,
            sort,
            filtro,
            filtroVal
        } = busquedaProducts;
        const productsResponse = await viewsController.getAllProductsControllerV(limit, page, sort, filtro, filtroVal);
        socket.emit('products', productsResponse);
    });
    const messagesResponse = await viewsController.getAllMessageControllerV();
    socket.emit("messages", messagesResponse);
});
app.use((req, res, next) => {
    req.socketServer = socketServer;
    next()
});
app.use('/api/carts/', cartRouter);
app.use('/api/chat/', msmRouter);
app.use('/api/products', productsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/tickets', ticketRouter);
app.use('/', viewsRouter);
app.use('/mockProducts', mockRouter);
app.use('/loggerTest', loggerRouter);
app.use('/api/users', userRouter);
app.use('/api/payments', paymentsRouter);
app.use(errorMiddleware);