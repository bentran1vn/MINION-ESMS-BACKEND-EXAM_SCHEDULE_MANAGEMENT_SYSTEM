import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import { getCouseByExamPhase } from '../services/courseService.js'

const router = express.Router()

//Swagger-TableInfo
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

//Swagger-TableTag
/**
 * @swagger
 * tags:
 *    name: Courses
 *    description: The courses managing API
 */

//Swager-Get-GetAllCourses
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

router.get('/', requireRole("admin"), async (req, res) => {
    try {
        const ePId = parseInt(req.query.ePId)
        let courses
        await getCouseByExamPhase(ePId).then(value => courses = value)
        res.json(DataResponse(courses))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all course by detail: courseId, subCode, numOfStu, semesterId

// //requireRole("staff"),
// router.delete('/', async (req, res) => {
//     const id = parseInt(req.body.id) || null;
//     try {
//         if (id != null) {
//             const rowAffected = await Course.update({ status: 0 }, {
//                 where: {
//                     id: id
//                 }
//             })
//             if (rowAffected === 0) {
//                 res.json(NotFoundResponse());
//                 return;
//             } else {
//                 res.json(MessageResponse('Course deleted'));
//                 return;
//             }
//         } else {
//             const rowAffected = await Course.update({ status: 0 }, {
//                 where: {}
//             });
//             if (rowAffected === 0) {
//                 res.json(NotFoundResponse());
//                 return;
//             } else {
//                 res.json(MessageResponse('All courses deleted'));
//                 return;
//             }
//         }
//     } catch (error) {
//         console.log(error);
//         res.json(ErrorResponse(500, error.message))
//     }
// })

export default router