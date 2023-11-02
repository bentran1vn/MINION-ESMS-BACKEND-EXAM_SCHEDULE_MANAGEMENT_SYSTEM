import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import ExamPhase from '../models/ExamPhase.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Courses:
 *       type: object
 *       required:
 *          - subId
 *          - numOfStu
 *          - ePId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          subId:
 *              type: integer
 *              description: reference to Subject id
 *          numOfStu:
 *              type: integer
 *              description: number of student in 1 Subject test
 *          ePId: 
 *              type: integer
 *              description: reference to ExamPhase id
 *          status:
 *              type: integer
 *              description: 0 is mark as deleted, 1 is display, default = 1
 *       example:
 *           id: 1
 *           subId: 1
 *           numOfStu: 120
 *           ePId: 1
 *           status: 1
 */

/**
 * @swagger
 * tags:
 *    name: Courses
 *    description: The courses managing API
 */

/**
 * @swagger
 * /courses/:
 *   get:
 *     summary: Return all Courses by detail courseId, subCode, numOfStu, examPhase Id
 *     tags: [Courses]
 *     parameters:
 *        - in: query
 *          name: ePId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The ExamPhase ID client want to get.
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Courses'
 */

/**
 * @swagger
 * /courses/:
 *   delete:
 *     summary: Delete 1 Courses by id or Delete all if id null by Staff
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                 type: integer
 *                 example: 1, or null
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Course deleted / All courses deleted 
 */

router.get('/', async (req, res) => {
    const ePId = parseInt(req.query.ePId)
    let listCourse = [];
    try {
        const result = await Course.findAll({
            where: {
                ePId
            },
            include: [{
                model: Subject,
                attributes: ['code']
            }]
        });
        const examPhase = await ExamPhase.findOne({
            where:{
                id: ePId
            }
        })
        for (const course of result) {
            if (course.dataValues.status == 1) {
                const subject = course.subject;
                const sub = {
                    courseId: course.dataValues.id,
                    subCode: subject.code,
                    numOfStu: course.dataValues.numOfStu,
                    ePName: examPhase.ePName,
                    status: 1
                };
                listCourse.push(sub);
            } else {
                const subject = course.subject;
                const sub = {
                    courseId: course.dataValues.id,
                    subCode: subject.code,
                    numOfStu: course.dataValues.numOfStu,
                    ePName: examPhase.ePName,
                    status: 0
                };
                listCourse.push(sub);
            }
        }
        if (listCourse.length == 0) {
            res.json(NotFoundResponse);
        } else {
            res.json(DataResponse(listCourse));
        }
    } catch (error) {
        console.error(error);
        res.json(InternalErrResponse());
        return;
    }
})// Get all course by detail: courseId, subCode, numOfStu, semesterId


// router.post('/assign', async (req, res) => {
//     const courId = req.body.courseId
//     const date = req.body.day
//     const slot = req.body.slot
//     const examPhaseId = req.body.examPhaseId
//     try {
//         assignCourse(courId, date, slot, examPhaseId)
//         res.json(MessageResponse("Assign Slot Successfully!"))
//     } catch (Error) {
//         console.log(Error);
//         res.json(ErrorResponse(500, Error.message))
//     }
// })

//requireRole("staff"),
router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id) || null;
    try {
        if (id != null) {
            const rowAffected = await Course.update({ status: 0 }, {
                where: {
                    id: id
                }
            })
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('Course deleted'));
                return;
            }
        } else {
            const rowAffected = await Course.update({ status: 0 }, {
                where: {}
            });
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('All courses deleted'));
                return;
            }
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})

export default router