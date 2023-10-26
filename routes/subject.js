import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import { requireRole } from '../middlewares/auth.js'
import { MEDIUMINT } from 'sequelize'

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
 *          - semesterNo
 *          - fe
 *          - pe
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
 *          semesterNo:
 *              type: integer
 *              description: The semester of a Subject
 *          fe:
 *              type: integer
 *              example: The exam time length (minutes) of Subject
 *          pe: 
 *              type: integer
 *              example: The exam time length (minutes)
 *          example:
 *           id: 1
 *           code: MAE201
 *           name: Mathematics for Engineering
 *           semesterNo: 1
 *           fe: 60
 *           pe: 0 (0 = no test)
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
 *               name:
 *                 type: String
 *                 example: Mathematic for Engineering
 *           required:
 *             - code
 *             - name
 *     responses:
 *       '200':
 *         description: Create Success !
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
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Delete Success, Course updated ! / Not Found !
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
 *               code:
 *                 type: String
 *                 example: MAE201, PRN211
 *               name:
 *                 type: String
 *                 example: Mathematic for Engineering
 *               semesterNo:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *               fe:
 *                 type: integer
 *                 example: 60, 0 (0 = no test)
 *               pe:    
 *                 type: integer
 *                 example: 60, 90, 0
 *           required:
 *             - id
 *             - code
 *             - name
 *             - semesterNo
 *             - fe
 *             - pe
 *     responses:
 *       '200':
 *         description: Update Success ! / Not Found !
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

router.post('/', async (req, res) => {
    const body = req.body;

    try {
        const subject = await Subject.findOne({
            where: {
                code: body.code,
                status: 1
            }
        })
        if (subject) {
            await Subject.update(
                {
                    code: body.code,
                    name: body.name,
                }, {
                where: {
                    id: subject.id
                }
            })
        } else {
            await Subject.create({
                code: body.code,
                name: body.name
            })
        }

        // console.log(subject);
        res.json(MessageResponse("Create Success !"))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id);

    try {
        const row = await Subject.update({ status: 0 }, {
            where: {
                id: id,
                status: 1
            }
        })
        if (row != 0) {
            const course = await Course.update({ status: 0 }, {
                where: {
                    subId: id
                }
            })
            if (course != 0) {
                res.json(MessageResponse("Delete Success, Course updated !"));
                return;
            } else {
                res.json(MessageResponse("Not Found Subject Id !"));
                return;
            }

        } else {
            res.json(MessageResponse("Not Found !"));
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

router.put('/', async (req, res) => {
    const id = parseInt(req.body.id);
    const data = req.body;
    try {
        const row = await Subject.update(data, {
            where: {
                id: id,
                status: 1
            }
        })
        if (row[0] == 0) {
            res.json(MessageResponse("Not Found !"));
            return;
        } else {
            res.json(MessageResponse("Update Success !"));
            return;
        }
    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.findAll({
            where: {
                status: 1
            }
        });
        if (subjects.length == 0) {
            res.json(MessageResponse("Not Found!"));
        } else {
            res.json(DataResponse(subjects));
            return;
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
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
        res.json(InternalErrResponse());
    }
})// Get all subject bất kể status

export async function subjectById(id) {
    const subject = await Subject.findOne({
        where: {
            id: id
        }
    })
    return subject
}

export default router
//add xong