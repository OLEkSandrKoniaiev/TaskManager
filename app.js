// var createError = require('http-errors');
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const usersRouter = require('./routes/userRoutes');
const curriculumRouter = require('./routes/curriculumRoutes');
const taskRouter = require('./routes/taskRoutes');

// installing env variables
dotenv.config();

// connect to DB
connectDB();

const app = express();

app.use(logger('dev'));
app.use(express.json()); // Для парсингу JSON тіла запиту
app.use(express.urlencoded({extended: false})); // Для парсингу URL-кодованих тіл запиту
app.use(cookieParser());

// Для обслуговування статичних файлів
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware - додайте його перед вашими маршрутами API
app.use(cors()); // Проста конфігурація (дозволяє все)

// Основні маршрути API
app.use('/users', usersRouter);
app.use('/curriculums', curriculumRouter);
app.use('/tasks', taskRouter);

// Документація Swagger UI
// Всі ендпоінти документації будуть доступні за шляхом /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true,
    },
}));

// Обробка 404 помилок (будь-який запит, що не був оброблений вище)
app.use(function (req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Централізований обробник помилок (має бути останнім middleware)
app.use(function (err, req, res, next) {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Зберігаємо попередній статус або ставимо 500

    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {},
    });
});

module.exports = app;
