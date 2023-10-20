import express from 'express'
import { DataResponse, ErrorResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'
import { createNewSemesterS, deleteSemesterById, findAllSemester } from '../services/semesterServices.js'

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
<<<<<<< HEAD
 *                 example: SPRING_2022, SUMMER_2022, FALL_2023
 *               start:
 *                 type: DATEONLY
 *                 example: 2023-04-14
 *               end:
 *                 type: DATEONLY
 *                 example: 2023-08-14
=======
 *                 example: SPRING, SUMMER, FALL
 *               start:
 *                 type: String
 *                 example: 2023-04-13
 *               end:
 *                 type: String
 *                 example: 2023-08-13
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
 *           required:
 *             - season
 *             - start
 *             - end
 *     responses:
 *       '200':
 *         description: Create new semester successfully!
 *       '500':
<<<<<<< HEAD
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /semesters/:
 *   get:
 *     summary: Return all data of Semester
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
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /semesters/start/:
 *   get:
 *     summary: Return all data of Semester from input start date
 *     tags: [Semesters]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: DATEONLY
 *           example: 2023-04-14
 *         required: true
 *         description: The start date Client want to get.             
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
 *         description: Internal Server Error !
 */

/**
 * @swagger
 * /semesters/season/:
 *   get:
 *     summary: Return all data of Semester by input season
 *     tags: [Semesters]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           example: FALL_2022, SEMESTER_2023
 *         required: true
 *         description: The season Client want to get.             
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
 *         description: Internal Server Error !
=======
 *         description: Can not create new Semester!
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
 */

//Swagger Get
/**
 * @swagger
 * /semesters:
<<<<<<< HEAD
 *   delete:
 *     summary: Delete a semester.
 *     tags: [Semesters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               disabled:
 *                 type: boolean
 *           required:
 *             - id
 *             - disabled
=======
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
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
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
    const season = req.body.season;
    const start = req.body.start;
    const end = req.body.end;
<<<<<<< HEAD


    const startDate = new Date(start);
    const endDate = new Date(end);
    const absoluteDifference = Math.abs(endDate.getDate() - startDate.getDate());

    // Tính số lượng tháng giữa ngày bắt đầu và ngày kết thúc
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth() + absoluteDifference / 30.44);

    if ( (startDate >= endDate) || (monthsDiff < 3) ) { //không được nhập start nhỏ hơn end, và end > start ít nhất 3 tháng, end - start >= 3
        res.json(MessageResponse("Start date must be earlier than end time atleast 3 month"));
        return;
    }
    try {
        //check xem start có nhỏ hơn end của bất kì thg nào đã tồn tại không
        const existingSemesters = await Semester.findOne({
            where: {
                end: {
                    [Op.gte]: start,
                }
            }
        });
        if (existingSemesters) {
            res.json(MessageResponse("Collision to others semester"));
            return;
        }else{
            const semester = await Semester.create({
                season: season,
                start: start,
                end: end,
                disabled: false,
            })
            console.log(semester);
            res.json(MessageResponse("Create Success !"))
=======
    try {
        const semester = await createNewSemesterS(season, year, start, end)
        if(semester != null){
            res.json(MessageResponse("Create new semester successfully!"))
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
        }
    } catch (err) {
        res.json(ErrorResponse(500, Error.message));
    }
})

router.get('/', async (req, res) => {
    const type = req.query.type
    const value = req.query.value
    try {
<<<<<<< HEAD
        const semList = []
        const semester = await Semester.findAll();
        const semL = semester.map(sem => sem.dataValues);
        if (semester.length == 0) {
            res.json(MessageResponse("Semester doesn't have any data"));
            return;
        } else {
            const today = new Date()
            const todayFormat = today.toISOString().slice(0, 10);
            console.log(todayFormat);
            for (const item of semL) {
                const id = item.id;
                const season = item.season;
                const disabled = item.disabled;
                const start = item.start;
                const end = item.end;
                let status;
                //0 = passed
                //1 = ongoing
                //2 = future             
                if (todayFormat => start && todayFormat <= end) {
                    status = "1"
                } else if (todayFormat <= start) {
                    status = "0"
                } else if (todayFormat >= end) {
                    status = "2"
                }
                const s = {
                    id: id,
                    season: season,
                    start: start,
                    end: end,
                    disabled: disabled,
                    status: status,
                }
                semList.push(s);
            }
            if (semList.length != 0) {
                res.json(DataResponse(semList));
                return;
            }
        }

    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse());
    }
})

router.get('/start', async (req, res) => {
    const start = req.query.start;
    try {
        const sem = await Semester.findAll({
            where: {
                start: {
                    [Op.gte]: start, //lấy tất cả từ >= start
                }
            }
        })
        if (sem) {
            res.json(DataResponse(sem));
            return;
        } else {
            res.json(MessageResponse("This start date not belongs to any semester"));
            return;
        }
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})

router.get('/season', async (req, res) => {
    const season = req.query.season;
    try {
        const sem = await Semester.findAll({
            where: {
                season: {
                    [Op.startsWith]: season.toUpperCase(),
                },
            }
        })
        if (sem.length != 0) {
            res.json(DataResponse(sem));
            return;
        } else {
            res.json(MessageResponse("This season doesn't exist"));
            return;
        }
    } catch (error) {
        res.json(InternalErrResponse());
        console.log(error);
    }
})

router.delete('/', async (req, res) => {
    const disabled = req.body.disabled;
    try {
        const id = parseInt(req.body.id);
        const semester = await Semester.findOne({
            where: {
                id: id
            }
        });
        if (!semester) {
            res.json(NotFoundResponse())
            return
        }

        const today = new Date()
        const todayFormat = today.toISOString().slice(0, 10);
        if (todayFormat >= semester.end) {
            res.json(MessageResponse("Can't delete the passed semester"));
            return;
        } else {
            const row = await Semester.update({
                disabled: disabled
            }, {
                where: {
                    id: id
                }
            })
            if (row[0] != 0) {
                res.json(MessageResponse('Delete successfully'));
                return;
            }
=======
        let semesterList
        await findAllSemester(value, type).then(value => semesterList = value)
        if(semesterList != null && semesterList.length > 0){
            res.json(DataResponse(semesterList));
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
})

router.delete('/:id', async (req, res) => {
    const semId = parseInt(req.params.id)
    try {
        let result
        await deleteSemesterById(semId).then(value => result = value)
        if(result){
            res.json(MessageResponse('Delete successfully'))
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
})

export default router
//add xong
