const Curriculum = require('../models/Curriculum');

class CurriculumRepository {
    /**
     * Отримує всі навчальні плани.
     * У цьому методі поки що немає логіки фільтрації за public/owner.
     * Ця логіка буде додана пізніше в контролері.
     * @returns {Promise<Array<Curriculum>>} Масив об'єктів Curriculum.
     */
    async getAllCurriculums(query = {}) {
        return await Curriculum.find(query);
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
