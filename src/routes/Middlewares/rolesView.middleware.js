// Este middlewares de role son para regular el acceso a las vistas (Con res.render):

// Denegar la petición a cualquiera que no sea admin - Router:
export const rolesVMiddlewareAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
        next();
    } else {
        res.status(401).render('accesoSoloAdminView', {
            title: 'Acceso denegado - Solo administradores'
        });
    };
};

// Solo usuarios regulares y premium:
export const rolesVMiddlewareUsers = (req, res, next) => {
    if (req.user.role === 'user' || req.user.role === 'premium') {
        next();
    } else {
        res.status(401).render('accesoUsersView', {
            title: 'Acceso denegado - Solo usuarios'
        });
    };
};

// Solo admin y usuarios premium: 
export const rolesVMiddlewareAdminAndPremium = (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'premium') {
        next();
    } else {
        res.status(401).render('accesoAdminPremView', {
            title: 'Acceso denegado - Solo administradores y usuarios premium'
        });
    };
};