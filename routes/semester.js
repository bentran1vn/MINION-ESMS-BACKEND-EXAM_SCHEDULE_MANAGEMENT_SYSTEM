import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import { findAllSemesterVer2, autoCreateTimeSlotWhenCreateSemester, createNewSemesterS, deleteSemesterById, findAllSemester, getSemesterAndStatus, validateYearAndSeason } from '../services/semesterServices.js'
import TimeSlot from '../models/TimeSlot.js'

const router = express.Router()
/**
 * @swagger
 * components:
 *   schemas:
 *    Semesters:
 *       type: object
 *       required:
 *          - season
 *          - year
 *          - startDay
 *          - endDay
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          season:
 *              type: STRING
 *              description: SPRING, SUMMER, FALL
 *          year:
 *              type: integer
 *              description: The year of the semester
 *          start:
 *              type: Date
 *              description: The start day of the semester
 *          end:
 *              type: Date
 *              description: The end day of the semester
 *          status:
 *              type: integer
 *              description: The visible status, 1 is visible
 *       example:
 *           id: 1
 *           season: FALL
 *           year: 2023
 *           start: 2023-04-13
 *           end: 2023-08-13
 *           status: 1   
 */


/**
 * @swagger
 * tags:
 *    name: Semesters
 *    description: The Semesters managing API
 */

/**
 * @swagger
 * /semesters:
 *   post:
 *     summary: Create a new Semester with information.
 *     tags: [Semesters]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: STRING
 *                 example: SPRING_2023, SUMMER_2023, FALL_2023.
 *               start:
 *                 type: DATEONLY
 *                 example: 2023-04-13.
 *               end:
 *                 type: DATEONLY
 *                 example: 2023-08-13.
 *           required:
 *             - season
 *             - start
 *             - end
 *     responses:
 *       '200':
 *         description: Create new semester successfully !
 *       '500':
 *         description: Can not create new semester !
 */


/**
 * @swagger
 * /semesters:
 *   get:
 *     summary: Return all data of semester by type and value.
 *     tags: [Semesters]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         example: season, year, status
 *         description: The type of list Client want to get.   
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         required: true
 *         example: FALL, 2023, 1
 *         description: The condition of list Client want to get.   
 *       - in: query
 *         name: pageNo
 *         schema:
 *           type: integer
 *         example: 1, 2
 *         description: The page number in paging Client want to get. 
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 5, 10
 *         description: The limit of list in paging Client want to get.           
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Semesters'
 *       '500':
 *         description: Internal server error
 */


/**
 * @swagger
 * /semesters/season:
 *   get:
 *     summary: Return all data of semester.
 *     tags: [Semesters]        
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Semesters'
 *       '500':
 *         description: Internal server error
 */

/**
 * @swagger
 * /semesters/whenCreateSemester:
 *   post:
 *     summary: Create a new Semester with information and create time slot.
 *     tags: [Semesters]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: STRING
 *                 example: SPRING_2023, SUMMER_2023, FALL_2023.
 *               start:
 *                 type: DATEONLY
 *                 example: 2023-04-13.
 *               end:
 *                 type: DATEONLY
 *                 example: 2023-08-13.
 *           required:
 *             - season
 *             - start
 *             - end
 *     responses:
 *       '200':
 *         description: Create new semester successfully !
 *       '500':
 *         description: Can not create new semester !
 */

/**
 * @swagger
 * /semesters/:id :
 *   delete:
 *     summary: Delete a semester with an Id.
 *     tags: [Semesters]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The id semester Client want to delete.             
 *     responses:
 *       '200':
 *         description: Delete semester successfully !
 *       '500':
 *         description: Can not delete semester !
 */

router.post('/', async (req, res) => {
    const year = parseInt(req.body.season.split('_')[1]);
    const season = req.body.season.split('_')[0];
    const start = req.body.start;
    const end = req.body.end;

    try {
        const semester = await createNewSemesterS(season, year, start, end)
        res.json(MessageResponse(semester))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

//GET NÀY CHO ADMIN , requireRole('admin')
router.get('/', requireRole('admin'), async (req, res) => {
    try {
        let semesterList
        await findAllSemester().then(value => semesterList = value)
        if (semesterList != null && semesterList.length > 0) {
            res.json(DataResponse(semesterList));
        }
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})// Tìm kiếm bằng type : value (year: số năm, season: tên mùa, status : 0/1); nếu không có thì get all

//get cho role khác
router.get('/otherRole', async (req, res) => {
    try {
        let semesterList
        await findAllSemesterVer2().then(value => semesterList = value)
        if (semesterList != null && semesterList.length > 0) {
            res.json(DataResponse(semesterList));
        }
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

//GET NÀY CHO ROLE KHÁC
router.get('/season', async (req, res) => {
    try {
        const final = await getSemesterAndStatus();
        res.json(DataResponse(final))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Trả về all semester 


//create timeslot when create semester
router.post('/whenCreateSemester', requireRole("admin"), async (req, res) => {
    const year = parseInt(req.body.season.split('_')[1]);
    const season = req.body.season.split('_')[0];
    const start = req.body.start;
    const end = req.body.end;

    try {
        const result = await autoCreateTimeSlotWhenCreateSemester(year, season, start, end)
        res.json(MessageResponse(result))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.delete('/', requireRole("admin"), async (req, res) => {
    const semId = parseInt(req.query.id)
    try {
        const result = await deleteSemesterById(semId)
        if (result) {
            res.json(MessageResponse('Delete successfully'))
        }
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router
//add xong
