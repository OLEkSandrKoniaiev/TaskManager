const express = require('express');
const router = express.Router();
const {
    getCurriculums,
    getCurriculumById,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    copyCurriculum,
} = require('../controllers/curriculumController');
const {protect} = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Curriculums
 *     description: API for managing educational curriculums
 */

/**
 * @swagger
 * /curriculums:
 *   post:
 *     summary: Create a new curriculum.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCurriculumInput'
 *     responses:
 *       201:
 *         description: The newly created curriculum.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Curriculum'
 *       400:
 *         description: Bad request (e.g., missing required fields, validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, createCurriculum);

/**
 * @swagger
 * /curriculums:
 *   get:
 *     summary: Retrieve a list of curriculums with pagination, search, filter, and sort.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page.
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter curriculums by public status (true for public, false for private owned by user).
 *       - in: query
 *         name: isClosed
 *         schema:
 *           type: boolean
 *         description: Filter curriculums by closed status.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by curriculum name (case-insensitive, partial match).
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort order (e.g., name:asc, createdAt:desc). Allowed fields are name, universityName, programName, createdAt, updatedAt.
 *     responses:
 *       200:
 *         description: A list of curriculums.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 curriculums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Curriculum'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getCurriculums);

/**
 * @swagger
 * /curriculums/{id}:
 *   get:
 *     summary: Get a single curriculum by ID.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the curriculum to retrieve.
 *     responses:
 *       200:
 *         description: Curriculum data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Curriculum'
 *       400:
 *         description: Invalid curriculum ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden, user not authorized to access this private curriculum.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curriculum not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, getCurriculumById);

/**
 * @swagger
 * /curriculums/{id}/copy:
 *   post:
 *     summary: Copy a public curriculum for the authenticated user.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the public curriculum to copy.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 description: Optional new name for the copied curriculum. If not provided, "(Copy)" will be appended.
 *     responses:
 *       201:
 *         description: Curriculum copied successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 curriculum:
 *                   $ref: '#/components/schemas/Curriculum'
 *       400:
 *         description: Invalid curriculum ID format or validation error during copy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden, curriculum is not public and cannot be copied.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Original curriculum not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/copy', protect, copyCurriculum);

/**
 * @swagger
 * /curriculums/{id}:
 *   put:
 *     summary: Update an existing curriculum.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the curriculum to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCurriculumInput'
 *     responses:
 *       200:
 *         description: Curriculum updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 curriculum:
 *                   $ref: '#/components/schemas/Curriculum'
 *       400:
 *         description: Invalid curriculum ID format or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden, user not authorized to update this curriculum.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curriculum not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', protect, updateCurriculum);

/**
 * @swagger
 * /curriculums/{id}:
 *   delete:
 *     summary: Delete a curriculum.
 *     tags: [Curriculums]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: objectId
 *         required: true
 *         description: ID of the curriculum to delete.
 *     responses:
 *       200:
 *         description: Curriculum deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid curriculum ID format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden, user not authorized to delete this curriculum.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curri*
 */
router.delete('/:id', protect, deleteCurriculum);

module.exports = router;
