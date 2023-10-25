import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import { createNewSemesterS, deleteSemesterById, findAllSemester, validateYearAndSeason } from '../services/semesterServices.js'

const router = express.Router()

//Swagger Model
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
 *          startDay:
 *              type: Date
 *              description: The start day of the semester
 *          endDay:
 *              type: Date
 *              description: The end day of the semester
 *          status:
 *              type: integer
 *              description: The visible status
 *       example:
 *           id: 1
 *           season: FALL
 *           year: 2023
 *           startDay: 2023-04-13
 *           endDay: 2023-08-13
 *           status: 1   
 */

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: Semesters
 *    description: The Semesters managing API
 */

//Swagger Post
/**
 * @swagger
 * /semesters:
 *   post:
 *     summary: Create a new Semester with information.
 *     tags: [Semesters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: String
 *                 example: SPRING, SUMMER, FALL
 *               start:
 *                 type: String
 *                 example: 2023-04-13
 *               end:
 *                 type: String
 *                 example: 2023-08-13
 *           required:
 *             - season
 *             - start
 *             - end
 *     responses:
 *       '200':
 *         description: Create new semester successfully!
 *       '500':
 *         description: Can not create new Semester!
 */

//Swagger Get
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
 *           type: String
 *         required: true
 *         example: season, year, status.
 *         description: The type of list you want to get.   
 *       - in: query
 *         name: value
 *         schema:
 *           type: String
 *         required: true
 *         example: FALL, 2023, 1.
 *         description: The condition of list you want to get.             
 *     responses:
 *       '200':
 *         description: Create new semester successfully!
 *       '500':
 *         description: Can not create new Semester!
 */

//Swagger Delete
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
 *         description: Create new semester successfully!
 *       '500':
 *         description: Can not create new Semester!
 */

router.post('/', async (req, res) => {
    const year = parseInt(req.body.year);
    const season = req.body.season;
    const start = req.body.start;
    const end = req.body.end;

    if (!validateYearAndSeason(year, season)) {
        res.json(MessageResponse("The year and season must be equal to the current time"));
        return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const absoluteDifference = Math.abs(endDate.getDate() - startDate.getDate());

    // Tính số lượng tháng giữa ngày bắt đầu và ngày kết thúc
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth() + absoluteDifference / 30.44);

    if ((startDate >= endDate) || (monthsDiff < 3)) { //không được nhập start nhỏ hơn end, và end > start ít nhất 3 tháng, end - start >= 3
        res.json(MessageResponse("Start date must be earlier than end time atleast 3 month"));
        return;
    }

    try {
        const existingSemesters = await Semester.findOne({
            where: {
                [Op.and]: {
                    year: year,
                    season: season
                }
            }
        });
        if (existingSemesters) {
            res.json(MessageResponse("Collision to others semester"));
            return;
        } else {
            const semester = await createNewSemesterS(season, year, start, end)
            if (semester != null) {
                res.json(MessageResponse("Create new semester successfully!"))
            }
        }

    } catch (err) {
        res.json(ErrorResponse(500, Error.message));
    }
})

router.get('/', async (req, res) => {
    const type = req.query.type
    const value = req.query.value
    try {
        let semesterList
        await findAllSemester(value, type).then(value => semesterList = value)
        if (semesterList != null && semesterList.length > 0) {
            res.json(DataResponse(semesterList));
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
})// Tìm kiếm bằng type : value (year: số năm, season: tên mùa, status : 0/1); nếu không có thì get all

router.get('/season', async (req, res) => {
    try {
        let final = [];
        const semester = await Semester.findAll();
        semester.forEach(async (item) => {
            const c = {
                start: item.dataValues.start,
                end: item.dataValues.end,
                season: `${season.toUpperCase()}_${year}`
            }
            final.push(c);
        });
        res.json(DataResponse(final));
        return;
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})

router.delete('/:id', async (req, res) => {
    const semId = parseInt(req.params.id)
    try {
        let result
        await deleteSemesterById(semId).then(value => result = value)
        if (result) {
            res.json(MessageResponse('Delete successfully'))
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
})

export default router
//add xong
