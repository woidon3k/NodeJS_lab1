const authorizeRoles = (allowedRole) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== allowedRole) {
            return res.status(403).json({ 
                message: "Доступ заборонено: недостатньо прав (потрібна роль: " + allowedRole + ")" 
            });
        }
        next();
    };
};

module.exports = authorizeRoles;