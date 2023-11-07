import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import { requireRole } from '../middlewares/auth.js'
import { createSubject, deleteSubject, getAvailableSubject, updateSubject } from '../services/subjectService.js'


const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Subjects:
 *       type: object
 *       required:
 *          - code
 *          - name
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          code:
 *              type: String
 *              description: The code number of a Subject
 *          name:
 *              type: String
 *              description: The name of a Subject
 *          status:
 *              type: integer
 *              description: The method of delete on Subject, 1 - exist, 0 - not exist
 *          example:
 *           id: 1
 *           code: MAE201
 *           name: Mathematics for Engineering
 *           status: 1
 */


/**
 * @swagger
 * tags:
 *    name: Subjects
 *    description: The Subjects managing API
 */


/**
 * @swagger
 * /subjects/:
 *   post:
 *     summary: Create a new Subject
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: String
 *                 example: MAE201, PRN211
 *                 description: The code of subject Client want to create.
 *               name:
 *                 type: String
 *                 example: Mathematic for Engineering
 *                 description: The name of subject Client want to create.
 *           required:
 *             - code
 *             - name
 *     responses:
 *       '200':
 *         description: Create subject Successfully !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /subjects/:
 *   delete:
 *     summary: Delete a Subject also Delete that subject in Course table by Admin 
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *                 description: The subject id Client want to delete.
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Delete Success, Course updated ! | Not Found !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /subjects/:
 *   put:
 *     summary: Update data to a Subject
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *                 description: Auto generate id
 *               code:
 *                 type: String
 *                 example: MAE201, PRN211
 *                 description: The code number of a Subject
 *               name:
 *                 type: String
 *                 example: Mathematic for Engineering
 *                 description: The name of a Subject
 *           required:
 *             - id
 *             - code
 *             - name
 *     responses:
 *       '200':
 *         description: Update Success ! | Not Found !
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /subjects/:
 *   get:
 *     summary: Return all Subjects with status 1
 *     tags: [Subjects]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Subjects'
 *       '500':
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /subjects/all/:
 *   get:
 *     summary: Return all Subjects with all status
 *     tags: [Subjects]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Subjects'
 *       '500':
 *         description: Internal Server Error !
 */

// router.post('/', async (req, res) => {
//     const body = req.body;

//     try {
//         const result = await createSubject(body)
//         res.json(result)
//     } catch (error) {
//         console.log(error);
//         res.json(ErrorResponse(500, error.message))
//     }
// })// Create new subject

// router.delete('/', async (req, res) => {
//     const id = parseInt(req.body.id);

//     try {
//         const result = await deleteSubject(id);
//         res.json(MessageResponse(result))
//     } catch (error) {
//         console.log(error);
//         res.json(ErrorResponse(500, error.message))
//     }
// })// Delete subject

// router.put('/', async (req, res) => {
//     const id = parseInt(req.body.id);
//     const data = req.body;
//     try {
//         const result = await updateSubject(id, data)
//         res.json(MessageResponse(result))
//     } catch (error) {
//         console.log(error);
//         res.json(ErrorResponse(500, error.message))
//     }
// })// Update subject

router.get('/', async (req, res) => {
    try {
        const result = await getAvailableSubject();
        if (Array.isArray(result)) {
            res.json(DataResponse(result))
        } else {
            res.json(MessageResponse(result))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all subject theo status: 1 

router.get('/all', async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        if (subjects.length == 0) {
            res.json(MessageResponse("Not Found!"));
        } else {
            res.json(DataResponse(subjects));
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all subject bất kể status

export async function subjectById(id) {
    const subject = await Subject.findOne({
        where: {
            id: id
        }
    })
    return subject
}// Function find subject by Id

export default router
//add xong