const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // Перевіряємо, чи користувач автентифікований і чи має він роль
        // req.user додається authMiddleware після успішної верифікації Access Token
        if (!req.user || !req.user.role) {
            return res.status(403).json({message: 'Not authorized to access this route. User role not found.'});
        }

        // Перевіряємо, чи роль користувача входить до списку дозволених ролей
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role (${req.user.role}) is not authorized to access this route.`
            });
        }
        next(); // Якщо роль дозволена, передаємо управління наступному middleware
    };
};

module.exports = authorizeRoles;
