import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import { Op } from 'sequelize'

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
 *       example:
 *           id: 1
 *           season: SPRING
 *           year: 2023
 */

/**
 * @swagger
 * tags:
 *    name: Semesters
 *    description: The Semesters managing API
 */

/**
 * @swagger
 * /semesters/:
 *   post:
 *     summary: Create a new Semester
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
 *                 example: SPRING_2022, SUMMER_2022, FALL_2023
 *               start:
 *                 type: DATEONLY
 *                 example: 2023-04-14
 *               end:
 *                 type: DATEONLY
 *                 example: 2023-08-14
 *           required:
 *             - season
 *             - start
 *             - end
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
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
 */

/**
 * @swagger
 * /semesters:
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
 *     responses:
 *       '200':
 *         description: Delete Successfully!
 *       '500':
 *         description: Internal Error!
 */

router.post('/', async (req, res) => {
    const season = req.body.season;
    const start = req.body.start;
    const end = req.body.end;


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
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    try {
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
        }
    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse());
    }
})

export async function createNewSemester() {
    const date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let season
    if (month >= 1 && month <= 4) season = "SPRING"
    if (month >= 5 && month <= 8) season = "SUMMER"
    if (month >= 9 && month <= 12) season = "FALL"
    try {
        const semester = await Semester.create({
            season: season,
            year: year
        })
        return semester.id
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
}

export default router
//add xong
