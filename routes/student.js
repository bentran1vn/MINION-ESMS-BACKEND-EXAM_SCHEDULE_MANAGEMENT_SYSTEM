import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import { getListOfStu, getScheduleOfStu, getScheduleOfStuBySemester } from '../services/studentService.js'

/**
 * @swagger
 * components:
 *   schemas:
 *    Students:
 *       type: object
 *       required:
 *          - userId
 *          - uniId
 *          - semester
 *          - major 
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          userId:
 *              type: integer
 *              description: Reference to User id
 *          uniId:
 *              type: string
 *              description: Student unit code
 *          semester: 
 *              type: integer
 *              description:  4
 *          major: 
 *              type: string 
 *              description: Software Engineer
 *       example:
 *           id: 1
 *           userId: 1
 *           uniId: SE170000
 *           semester: 4
 *           major: Software Engineer
 */


/**
 * @swagger
 * tags:
 *    name: Students
 *    description: The students managing API
 */


/**
 * @swagger
 * /students/listOfStu:
 *   get :
 *     summary : Return the list of student based on subCode, roomNum
 *     tags: [Students]
 *     parameters:
 *        - in: query
 *          name: subCode
 *          schema:
 *            type: string
 *          required: true
 *          description: The code of subject Client want to find
 *        - in: query
 *          name: roomNum
 *          schema:
 *            type: string
 *          required: true
 *          description: The room number Client want to find
 *     responses :
 *       '200' :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Users'
 *       '500':
 *         description: Internal server error
 */

/**
 * @swagger
 * /students/scheduleOfStuBySemester:
 *   get :
 *     summary : Return the schedule of student by semester, student id get by token
 *     tags: [Students]
 *     parameters:
 *        - in: query
 *          name: semId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The semester id Client want to find
 *     responses :
 *       '200' :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Students'
 *       '500':
 *         description: Internal server error
 */

/**
 * @swagger
 * /students/scheduleOfStu:
 *   get :
 *     summary : Return the schedule of student, student id get by token
 *     tags: [Students]
 *     responses :
 *       '200' :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Students'
 *       '500':
 *         description: Internal server error
 */

const router = express.Router()

router.get('/listOfStu', async (req, res) => {
    const { subCode, roomNum } = req.query
    try {
        const student = await getListOfStu(subCode, roomNum)
        res.json(DataResponse(student))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//get lịch thi của 1 stu theo semester
router.get('/scheduleOfStuBySemester', requireRole('student'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id); //token
    // const userId = 6; //thg stu đầu tiên
    const semId = parseInt(req.query.semesterId);
    try {
        const schePerSemester = await getScheduleOfStuBySemester(userId, semId)
        res.json(DataResponse(schePerSemester));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//get lịch thi của 1 thg
router.get('/scheduleOfStu', requireRole('student'), async (req, res) => {
    const userId = parseInt(res.locals.userData.id); //token
    // const userId = 6; //thg stu đầu tiên
    try {
        const schePerSemester = await getScheduleOfStu(userId);
        res.json(DataResponse(schePerSemester));
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

export default router
//add xong