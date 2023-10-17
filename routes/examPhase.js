import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import ExamType from '../models/ExamType.js'
import ExamPhase from '../models/ExamPhase.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import { createNewSemester } from './semester.js'
import { countCourse } from './course.js'
import StaffLogChange from '../models/StaffLogChange.js'

/**
 * @swagger
 * components:
 *   schemas:
 *    ExamPhases:
 *       type: object
 *       required:
 *          - semId
 *          - eTId
 *          - startDay
 *          - endDay
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          semId:
 *              type: integer
 *              description: Describe semester Id, reference to table Semester
 *          eTId:
 *              type: integer
 *              description: Describe Exam Type Id, reference to table ExamType
 *          startDay:
 *              type: DATEONLY
 *              description: Describe the exam start day
 *          endDay:
 *              type: DATEONLY
 *              description: Describe the exam end day
 *       example:
 *           id: 1
 *           semId: 1
 *           eTId: 1
 *           startDay: 2023-10-10
 *           endDay: 2023-10-15
 */

/**
 * @swagger
 * tags:
 *    name: ExamPhases
 *    description: The examPhases managing API
 */

/**
 * @swagger
 * /examPhases:
 *   post:
 *     summary: Create new exam phase.
 *     tags: [ExamPhases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semId:
 *                 type: int
 *                 example: 1
 *               eTId:
 *                 type: int
 *                 example: 1
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *           required:
 *             - semId
 *             - eTId
 *             - startDay
 *             - endDay
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

/**
 * @swagger
 * /examPhases:
 *   put:
 *     summary: Update exam phase.
 *     tags: [ExamPhases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: int
 *                 example: 1
 *               semId:
 *                 type: int
 *                 example: 1
 *               eTId:
 *                 type: int
 *                 example: 1
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *           required:
 *             - id
 *             - semId
 *             - eTId
 *             - startDay
 *             - endDay
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

/**
 * @swagger
 * /examPhases:
 *   delete:
 *     summary: Delete exam phase.
 *     tags: [ExamPhases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: int
 *                 example: 1
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Delete Successfully!
 */

/**
 * @swagger
 * /examPhases/ :
 *   get :
 *     summary : Return detail of all Exam Phase has been scheduled.
 *     tags: [ExamPhases]
 *     responses :
 *       200 :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamPhases'
 */

/**
 * @swagger
 * /examPhases/notScheduled/ :
 *   get :
 *     summary : Return all exam phase has not been scheduled yet.
 *     tags: [ExamPhases]
 *     responses :
 *       200 :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/ExamPhases'
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const semId = parseInt(req.body.semId);
    const eTId = parseInt(req.body.eTId);
    const startDay = req.body.startDay;
    const endDay = req.body.endDay;
    const changerId = parseInt(res.locals.userData.id)

    try {
        const semester = await Semester.findOne({
            where: {
                id: semId
            }
        })
        const examType = await ExamType.findOne({
            where: {
                id: eTId
            }
        })
        if (!semester || !examType) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examPhase = await ExamPhase.create({
                semId: semId,
                eTId: eTId,
                startDay: startDay,
                endDay: endDay,
                status: 0
            })
            if (examPhase) {
                await StaffLogChange.create({
                    rowId: examPhase.id,
                    tableName: 2,
                    staffId: changerId,
                    typeChange: 7
                })
            }
            res.json(MessageResponse('Create successfully !'))
        }
    } catch (errer) {
        console.log(errer)
        res.json(InternalErrResponse());
    }
})// Creat new Exam Phase

router.put('/', async (req, res) => {
    const examPhaseUp = req.body
    const id = parseInt(examPhaseUp.examPhaseId)
    const changerId = parseInt(res.locals.userData.id)

    try {
        const check = await ExamPhase.update({
            semId: examPhaseUp.semId,
            eTId: examPhaseUp.eTId,
            startDay: examPhaseUp.startDay,
            endDay: examPhaseUp.endDay,
            status: 1
        }, {
            where: {
                id: id,
            }
        })
        if (check[0] === 1) {
            await StaffLogChange.create({
                rowId: id,
                tableName: 2,
                staffId: changerId,
                typeChange: 4
            })
            res.json(MessageResponse("ExamPhase Update !"))
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
})// Update ExamPhase

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id)
    // const changerId = parseInt(res.locals.userData.id)
    const changerId = 1
    try {
        const result = await ExamPhase.destroy({
            where: {
                id: id,
            }
        })
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            await StaffLogChange.create({
                rowId: id,
                tableName: 2,
                staffId: changerId,
                typeChange: 8
            })
            res.json(MessageResponse('Exam Phase deleted'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'))
    }
})// Delete Exam Phase

router.get('/', async (req, res) => {
    const detailExamPhase = []
    function insertExamPhase(id, ss, y, t, bl, sd, ed) {
        const EPDetail = {
            id: id, season: ss, year: y, type: t, block: bl, sDay: sd, eDay: ed
        }
        detailExamPhase.push(EPDetail)
    }
    try {
        const examPhases = await ExamPhase.findAll({
            where: {
                status: 1
            }
        })

        for (let i = 0; i < examPhases.length; i++) {
            const semester = await Semester.findOne({
                where: {
                    id: examPhases[i].semId
                }
            })

            const examType = await ExamType.findOne({
                where: {
                    id: examPhases[i].eTId
                }
            })

            if (semester && examType) {
                insertExamPhase(semester.id, semester.season, semester.year, examType.type, examType.block, examPhases[i].startDay, examPhases[i].endDay)
            }
        }
        res.json(DataResponse(detailExamPhase))
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
    res.json(DataResponse(detailExamPhase))
})// Get all detail Exam Phase has been scheduled

router.get('/notScheduled', async (req, res) => {
    const detailExamPhase = []
    function insertExamPhase(ss, y, t, bl, sd, ed) {
        const EPDetail = {
            season: ss, year: y, type: t, block: bl, sDay: sd, eDay: ed
        }
        detailExamPhase.push(EPDetail)
    }
    try {
        const examPhases = await ExamPhase.findAll({
            where: {
                status: 0
            }
        })

        for (let i = 0; i < examPhases.length; i++) {
            const semester = await Semester.findOne({
                where: {
                    id: examPhases[i].semId
                }
            })

            const examType = await ExamType.findOne({
                where: {
                    id: examPhases[i].eTId
                }
            })

            if (semester && examType) {
                insertExamPhase(semester.season, semester.year, examType.type, examType.block, examPhases[i].startDay, examPhases[i].endDay)
            }
        }
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
    res.json(DataResponse(detailExamPhase))
})// Get all Exam Phase has not been scheduled

export async function createExamPhases(course, semesterId) {
    try {
        const date = new Date()
        let month = date.getMonth() + 1
        let blockNow = 10
        let desNow = 0
        // 0 is normal
        //{numFE : FE, numPE : PE, numFEc : FEc, numPEc : PEc}

        let examPhaseList = []

        if (month == 4 || month == 8 || month == 12) blockNow = 5

        const promises = [];

        for (const key in course) {
            if (course.hasOwnProperty(key)) {
                const val = course[key];
                if (val > 0) {
                    if (key.includes("c")) desNow = 1;
                    const promise = (async () => {
                        const examType = await ExamType.findOne({
                            where: {
                                type: key.slice(3, 5),
                                block: blockNow,
                                des: desNow,
                            },
                        });
                        const examPhase = await ExamPhase.create({
                            semId: semesterId,
                            eTId: examType.id,
                        });

                        return examPhase;
                    })();
                    promises.push(promise);
                }
            }
        }

        return Promise.all(promises)
    } catch (err) {
        console.log(err)
    }
}

export default router