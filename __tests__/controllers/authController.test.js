const {registerUser} = require("../../controllers/authController");
const User = require('../../models/User');

jest.mock('../../models/User');
User.findOne = jest.fn();

jest.mock('../../repositories/userRepository', () => ({
    createUser: jest.fn()
}));
jest.mock('../../utils/sendTokenResponse', () => ({
    __esModule: true,
    sendTokenResponse: jest.fn()
}));

const request = {
    body: {
        username: 'testuser',
        email: "example@gmail.com",
        password: "P@ssword1"
    }
};

const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
};

it('register function should return 400, because user already exist', async () => {
    User.findOne.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        email: 'oleksandr@gmail.com',
        password: 'P@ssword2'
    });

    await registerUser(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
        message: 'User with that email or username already exists.'
    });
});
