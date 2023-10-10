import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Course from '../models/Course.js'
import Student from '../models/Student.js'
import StudentCourse from '../models/StudentCourse.js'

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    StudentCourses:
 *       type: object
 *       required:
 *          - courId
 *          - stuId
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          courId:
 *              type: integer
 *              description: Reference to Course id
 *          stuId:
 *              type: String
 *              description: Reference to Student id
 *       example:
 *           id: 1
 *           courId: 1
 *           stuId: 1
 */

/**
 * @swagger
 * tags:
 *    name: StudentCourses
 *    description: The StudentCourses managing API
 */
/**
 * @swagger
 * /studentCourses/:
 *   post:
 *     summary: Create a new StudentCourses
 *     tags: [StudentCourses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courId:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *               stuId:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *           required:
 *             - courId
 *             - stuId
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *          description: Internal Server Error!
 */

router.post('/', async (req, res) => {
    const courId = parseInt(req.body.courId);
    const stuId = parseInt(req.body.stuId);

    try {
        const course = await Course.findOne({
            where: {
                id: courId
            }
        })
        const student = await Student.findOne({
            where: {
                id: stuId
            }
        })
        if (!course || !student) {
            res.json(NotFoundResponse());
            return;
        } else {
            const studentCourse = await StudentCourse.create({
                courId: courId,
                stuId: stuId
            })
            console.log(studentCourse);
            res.json(MessageResponse("Create Success !"))
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router