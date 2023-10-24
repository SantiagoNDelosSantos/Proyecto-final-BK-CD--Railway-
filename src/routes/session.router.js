import {
    Router
} from 'express';
import passport from 'passport';
import {
    registerUser,
    loginUser,
    getCurrentUser,
    authenticateWithGitHub
} from './Middlewares/passport.middleware.js';
import {
    completeProfile
} from '../config/formExtra.js';
import SessionController from '../controllers/sessionController.js';
import {
    rolesRMiddlewareUsers,
    rolesRMiddlewarePublic
} from "./Middlewares/rolesRoutes.middleware.js";
import {
    ProfileUserDTO
} from '../controllers/DTO/userProfile.dto.js';
import {
    DocsUserDTO
} from '../controllers/DTO/userDocs.dto.js'
import {
    uploaderPofiles
} from '../routes/Middlewares/multer.middleware.js'

const sessionRouter = Router();
let sessionController = new SessionController();

// Register - Router:
sessionRouter.post('/register', registerUser);

// Login - Router:
sessionRouter.post('/login', loginUser);

// GitHub - Router:
sessionRouter.get('/github', passport.authenticate('github', {
    session: false,
    scope: 'user:email'
}));

sessionRouter.get('/githubcallback', authenticateWithGitHub);

// Formulario extra GitHub - Router:
sessionRouter.post('/completeProfile', completeProfile);

// Current user - Router: 
sessionRouter.get('/current', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, getCurrentUser);

// Ver perfil usuario - Router:
sessionRouter.get('/profile', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, async (req, res) => {
    const result = await sessionController.getUserController(req, res);
    if (result.statusCode === 200) {
        const resultFilter = new ProfileUserDTO(result.result);
        if (resultFilter) {
            result.result = resultFilter;
        };
    }
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Documentación de los usuarios - Router: 
sessionRouter.get('/getDocsUser', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, async (req, res) => {
    const result = await sessionController.getUserController(req, res);
    if (result.statusCode === 200) {
        const resultFilter = new DocsUserDTO(result.result);
        if (resultFilter) {
            result.result = resultFilter;
        };
    }
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Enviar email para reestablecer contraseña - Router:
sessionRouter.post('/requestResetPassword', async (req, res, next) => {
    const result = await sessionController.getUserAndSendEmailController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Reestablecer contraseña de usuario - Router:
sessionRouter.post('/resetPassword', async (req, res, next) => {
    const result = await sessionController.resetPassUserController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Editar perfil - Router:
sessionRouter.post('/editProfile', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewareUsers, uploaderPofiles.single('profile'), async (req, res, next) => {
    const result = await sessionController.editProfileController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Cerrar session - Router:
sessionRouter.post('/logout', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/invalidToken'
}), rolesRMiddlewarePublic, async (req, res, next) => {
    const result = await sessionController.logoutController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// Eliminar cuenta - Router:  
sessionRouter.delete('/deleteAccount/:uid', passport.authenticate('jwt', {
        session: false,
        failureRedirect: '/invalidToken'
    }), rolesRMiddlewarePublic,
    async (req, res, next) => {
        const result = await sessionController.deleteUserController(req, res, next);
        if (result !== undefined) {
            res.status(result.statusCode).send(result);
        };
    }
);

export default sessionRouter;