import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Subject from '../models/Subject.js'
import Student from '../models/Student.js'
import StudentSubject from '../models/StudentSubject.js'
import StaffLogChange from '../models/StaffLogChange.js'

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

//req role staff
router.post('/', async (req, res) => {
    const staffId = parseInt(res.locals.userData.id);

    const subjectId = parseInt(req.body.subjectId);
    const stuId = parseInt(req.body.stuId);

    try {
        const subject = await Subject.findOne({
            where: {
                id: subjectId
            }
        })
        const student = await Student.findOne({
            where: {
                id: stuId
            }
        })
        if (!subject || !student) {
            res.json(NotFoundResponse());
            return;
        } else {
            const studentSubject = await StudentSubject.create({
                subjectId: subjectId,
                stuId: stuId
            })
            if(studentSubject){
                const staffLog = await StaffLogChange.create({
                    rowId: studentSubject.id,
                    tableName: 1,
                    staffId: staffId,
                    typeChange: 6,
                })
                if(!staffLog){
                    throw new Error("Create staff log failed");
                }
            }
            res.json(MessageResponse("Create Success !"))
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router