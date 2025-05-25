const Curriculum = require('../models/Curriculum');

class curriculumRepository {
    async getAllCurriculums() {
        return await Curriculum.find({});
    }

    async createCurriculum(curriculumData) {
        const curriculum = new Curriculum(curriculumData);
        return await curriculum.save();
    }
}

module.exports = new curriculumRepository();
