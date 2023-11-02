import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import { createNewSemesterS, deleteSemesterById, findAllSemester, validateYearAndSeason } from '../services/semesterServices.js'
import TimeSlot from '../models/TimeSlot.js'

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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: String
 *                 example: SPRING2023, SUMMER2023, FALL2023.
 *               start:
 *                 type: String
 *                 example: 2023-04-13.
 *               end:
 *                 type: String
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
 *         description: List all semester successfully !
 *       '500':
 *         description: Can not list all semester !
 */

//Swagger Get
/**
 * @swagger
 * /semesters/season:
 *   get:
 *     summary: Return all data of semester.
 *     tags: [Semesters]        
 *     responses:
 *       '200':
 *         description: List all semester successfully !
 *       '500':
 *         description: Can not list all semester !
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
 *         description: Delete semester successfully !
 *       '500':
 *         description: Can not delete semester !
 */

router.post('/', async (req, res) => {
    const year = parseInt(req.body.season.split('_')[1]);
    const season = req.body.season.split('_')[0];
    const start = req.body.start;
    const end = req.body.end;

    // console.log(season, year);
    // if (!validateYearAndSeason(year, season)) {
    //     res.json(MessageResponse("The year and season must be equal to the current time"));
    //     return;
    // }//cái này là business rule

    // Cái này để validation data giữa hay ngày start và end day
    // const startDate = new Date(start);
    // const endDate = new Date(end);
    // const absoluteDifference = Math.abs(endDate.getDate() - startDate.getDate());

    // // Tính số lượng tháng giữa ngày bắt đầu và ngày kết thúc
    // const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth() + absoluteDifference / 30.44);

    // if ((startDate >= endDate) || (monthsDiff < 3)) { //không được nhập start nhỏ hơn end, và end > start ít nhất 3 tháng, end - start >= 3
    //     res.json(ErrorResponse(400, "Start day must be earlier than end day atleast 3 month"));
    //     return;
    // }

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
    const pageNo = parseInt(req.query.page_no) || 1
    const limit = parseInt(req.query.limit) || 10

    try {
        let semesterList
        await findAllSemester(value, type, pageNo, limit).then(value => semesterList = value)
        if (semesterList != null && semesterList.length > 0) {
            res.json(DataResponse(semesterList));
        }
    } catch (Error) {
        // res.json(ErrorResponse(500, Error.message));
        res.json(NotFoundResponse())
        return;
    }
})// Tìm kiếm bằng type : value (year: số năm, season: tên mùa, status : 0/1); nếu không có thì get all

router.get('/season', async (req, res) => {
    try {
        let final = [];
        const semester = await Semester.findAll();
        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)
        semester.forEach(async (item) => {
            if (timeFormatted >= item.dataValues.start && timeFormatted <= item.dataValues.end) {
                const c = {
                    start: item.dataValues.start,
                    end: item.dataValues.end,
                    season: `${item.dataValues.season.toUpperCase()}_${item.dataValues.year}`,
                    cur: 1,//ongoing
                }
                final.push(c);
            } else {
                const c = {
                    start: item.dataValues.start,
                    end: item.dataValues.end,
                    season: `${item.dataValues.season.toUpperCase()}_${item.dataValues.year}`,
                    cur: 0,//close
                }
                final.push(c);
            }
        });
        res.json(DataResponse(final));
        return;
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse());
    }
})// Trả về all semester 

//create timeslot when create semester
router.post('/whenCreateSemester', async (req, res) => {
    const year = parseInt(req.body.season.split('_')[1]);
    const season = req.body.season.split('_')[0];
    const start = req.body.start;
    const end = req.body.end;

    try {
        const newSemester = await Semester.create({
            season: season,
            year: year,
            start: start,
            end: end
        })
        const semester = await Semester.findOne({
            where: {
                season: season,
                year: year,
                start: start,
                end: end
            }
        })
        let oldsemId = parseInt(semester.id) - 1;
        const oldtimeslot = await TimeSlot.findAll({
            where: {
                semId: oldsemId
            }
        })
        for (const time of oldtimeslot) {
            const newtimeslot = await TimeSlot.create({
                startTime: time.dataValues.startTime,
                endTime: time.dataValues.endTime,
                semId: parseInt(semester.id),
                des: time.dataValues.des
            })
        }
        res.json(MessageResponse("Add new timeslot success"));
        reutrn;

    } catch (err) {
        console.log(err)
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
