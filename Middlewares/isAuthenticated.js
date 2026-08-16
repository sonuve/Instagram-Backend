import jwt from 'jsonwebtoken';

const isAuthenticated = async(req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false
            });
        }

        const decoded = await jwt.verify(token, process.env.KEY_PROTECT);

        if (!decoded) {
            return res.status(401).json({
                message: "Invalid token",
                success: false
            });
        }

        req.userId = decoded.usersId;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export default isAuthenticated;
