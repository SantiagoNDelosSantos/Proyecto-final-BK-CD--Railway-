import {
    Router
} from 'express';
import passport from 'passport';
import {
    rolesVMiddlewareAdmin,
    rolesVMiddlewareUsers,
    rolesVMiddlewareAdminAndPremium
} from './Middlewares/rolesView.middleware.js'

const viewsRouter = Router();

viewsRouter.get('/register', (req, res) => {
    res.render('register', {
        title: 'Registro'
    });
});
viewsRouter.get('/login', (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});
viewsRouter.get('/completeProfile', (req, res) => {
    res.render('extraForm', {
        title: 'Formulario'
    });
});
viewsRouter.get('/requestResetPassword', (req, res) => {
    res.render('requestResetPassword', {
        title: 'Restablecer Contraseña - Solicitar Correo'
    });
});
viewsRouter.get('/resetPasswordView', passport.authenticate('jwtResetPass', {
    session: false,
    failureRedirect: '/requestResetPassword'
}), (req, res) => {
    res.render('resetPassword', {
        title: 'Restablecer Contraseña'
    });
});

// Esta vista en a la que se va a redirigir cuando el usuario no ha iniciado session, osea intenta acceder a una vistas sin estar logueado (Vistas):

viewsRouter.get('/notLoggedIn', (req, res) => {
    res.render('notLoggedIn', {
        title: 'Acceso denegado'
    });
});

// Esta vista es para los casos donde mas alla de los roles que se requieren para determinada ruta, la validación del token es fallida por esta vencido o adulterado (No vistas):

viewsRouter.get('/invalidToken', (req, res) => {
    res.render('invalidToken', {
        title: 'Acceso denegado - Token vencido'
    });
});

// Solo personas autentícadas:

viewsRouter.get('/products', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('products', {
        title: 'Productos'
    });
});

viewsRouter.get('/chat', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('chat', {
        title: 'Chat'
    });
});

viewsRouter.get('/perfil', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('profile', {
        title: 'Perfil'
    });
});

viewsRouter.get('/cart', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('cart', {
        title: 'Carrito de Compras'
    });
});

viewsRouter.get('/paySuccess', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('pay', {
        title: 'Pago exitoso'
    });
});

viewsRouter.get('/tickets', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('tickets', {
        title: 'Tickets'
    });
});

viewsRouter.get('/changeRole', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareUsers, (req, res) => {
    res.render('changeRole', {
        title: 'Cambiar Role'
    });
});

// Solo admin: 

viewsRouter.get('/adminPanel', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareAdmin, (req, res) => {
    res.render('userAdmin', {
        title: 'Panel de administrador'
    });
});

viewsRouter.get('/editUserAdmin', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareAdmin, (req, res) => {
    res.render('editUsersAdmin', {
        title: 'Panel de administrador - Usuarios'
    });
});

// Solo admin y premium:

viewsRouter.get('/storeProducts', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/notLoggedIn'
}), rolesVMiddlewareAdminAndPremium, (req, res) => {
    res.render('store', {
        title: 'Publicar productos'
    });
});

export default viewsRouter;