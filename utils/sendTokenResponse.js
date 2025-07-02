const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");


const sendTokenResponse = async (user, statusCode, res, oldRefreshToken = null) => {
    const accessToken = user.getSignedJwtToken();

    const newRefreshToken = jwt.sign({id: user._id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE
    });

    try {
        if (oldRefreshToken) {
            await userRepository.removeRefreshToken(user._id, oldRefreshToken);
        }
        await userRepository.addRefreshToken(user._id, newRefreshToken);
    } catch (error) {
        console.error("Error saving/removing refresh token to DB:", error);
        return res.status(500).json({message: 'Failed to manage refresh token in DB.'});
    }

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_REFRESH_EXPIRE.replace('d', '') * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    if (process.env.NODE_ENV === 'development') {
        cookieOptions.secure = false;
    }

    res.status(statusCode)
        .cookie('refreshToken', newRefreshToken, cookieOptions)
        .json({
            success: true,
            accessToken: accessToken,
        });
};

module.exports = sendTokenResponse;
