const Curriculum = require('../models/Curriculum');

class CurriculumRepository {
    /**
     * Отримує всі навчальні плани з пагінацією та можливістю фільтрації.
     * @param {object} options - Об'єкт параметрів.
     * @param {object} options.query - Об'єкт фільтрації для MongoDB.
     * @param {number} options.skip - Кількість документів для пропуску (зміщення).
     * @param {number} options.limit - Максимальна кількість документів для повернення.
     * @returns {Promise<{curriculums: Curriculum[], total: number}>} Об'єкт з масивом навч. програм та їх загальною кількістю.
     */
    async getAllCurriculums({query = {}, skip = 0, limit = 10}) {
        const curriculumsPromise = Curriculum.find(query)
            .skip(skip)
            .limit(limit)
            .exec();

        const countPromise = Curriculum.countDocuments(query);

        const [curriculums, total] = await Promise.all([curriculumsPromise, countPromise]);

        return {curriculums, total};
    }

    /**
     * Знаходить навчальний план за ID.
     * @param {string} id - ID навчального плану.
     * @returns {Promise<Curriculum|null>} Об'єкт Curriculum або null.
     */
    async findCurriculumById(id) {
        return await Curriculum.findById(id);
    }

    /**
     * Створює новий навчальний план.
     * @param {object} curriculumData - Дані для створення навчального плану.
     * @returns {Promise<Curriculum>} Створений об'єкт Curriculum.
     */
    async createCurriculum(curriculumData) {
        const curriculum = new Curriculum(curriculumData);
        return await curriculum.save();
    }

    /**
     * Оновлює існуючий навчальний план за ID.
     * Дозволяє оновлювати name, description, universityName, programName, isPublic, isClosed.
     * @param {string} id - ID навчального плану для оновлення.
     * @param {object} updateData - Об'єкт з даними для оновлення.
     * @returns {Promise<Curriculum|null>} Оновлений об'єкт Curriculum або null.
     */
    async updateCurriculum(id, updateData) {
        return await Curriculum.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
    }

    /**
     * Видаляє навчальний план за ID.
     * @param {string} id - ID навчального плану для видалення.
     * @returns {Promise<Curriculum|null>} Видалений об'єкт Curriculum або null.
     */
    async deleteCurriculum(id) {
        return await Curriculum.findByIdAndDelete(id);
    }
}

module.exports = new CurriculumRepository();
