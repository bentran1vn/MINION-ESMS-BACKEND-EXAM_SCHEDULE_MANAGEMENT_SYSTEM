import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'
import StaffLogChange from '../models/StaffLogChange.js'
import { Op, STRING } from 'sequelize'
import { checkTime } from '../services/examPhaseService.js'

/**
 * @swagger
 * components:
 *   schemas:
 *    ExamPhases:
 *       type: object
 *       required:
 *          - semId
 *          - ePName
 *          - startDay
 *          - endDay
 *          - status
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          semId:
 *              type: integer
 *              description: Describe semester Id, reference to table Semester
 *          ePName:
 *              type: string
 *              description: Describe the name of exam phase
 *          startDay:
 *              type: DATEONLY
 *              description: Describe the exam start day
 *          endDay:
 *              type: DATEONLY
 *              description: Describe the exam end day
 *          status: 
 *              type: BOOLEAN
 *              description: 0 is pending, 1 is finish
 *       example:
 *           id: 1
 *           semId: 1
 *           ePName: Đợt 1
 *           startDay: 2023-10-10
 *           endDay: 2023-10-15
 *           status: 0
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
 *               ePName:
 *                 type: string
 *                 example: Đợt 1
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *           required:
 *             - ePName
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
 *               ePName:
 *                 type: string
 *                 example: Đợt 1
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *           required:
 *             - id
 *             - semId
 *             - ePName
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
    const ePName = req.body.ePName
    const startDay = req.body.startDay;
    const endDay = req.body.endDay;

    try {
        const currentYear = new Date().getFullYear();

        const semester = await Semester.findOne({
            where: {
                [Op.and]: {
                    year: currentYear,
                    status: 1
                }
            }
        })
        try {
            !checkTime(startDay, endDay)

        } catch (err) {
            res.json(ErrorResponse(500, err.message))
            return
        }
        if (!semester) {
            res.json(NotFoundResponse());
            return;
        } else {
            await ExamPhase.create({
                semId: semester.id,
                ePName: ePName,
                startDay: startDay,
                endDay: endDay,
            })
            res.json(MessageResponse('Create successfully !'))
            return;
        }
    } catch (errer) {
        console.log(errer)
        res.json(InternalErrResponse());
    }
})// Creat new Exam Phase

router.put('/', async (req, res) => {
    const examPhaseUp = req.body
    const id = parseInt(examPhaseUp.examPhaseId)

    try {
        const check = await ExamPhase.update({
            semId: examPhaseUp.semId,
            ePName: examPhaseUp.ePName,
            startDay: examPhaseUp.startDay,
            endDay: examPhaseUp.endDay,
        }, {
            where: {
                id: id,
                status: 1
            }
        })
        if (check[0] === 1) {
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
    try {
        const result = await ExamPhase.destroy({
            where: {
                id: id,
            }
        })
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('Exam Phase deleted'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'))
    }
})// Delete Exam Phase

router.get('/', async (req, res) => {
    const detailExamPhase = []
    function insertExamPhase(id, ss, y, pN, sd, ed) {
        const EPDetail = {
            id: id, season: ss, year: y, ePName: pN, sDay: sd, eDay: ed
        }
        detailExamPhase.push(EPDetail)
    }
    try {
        const examPhases = await ExamPhase.findAll({ where: { status: 1 } })

        for (let i = 0; i < examPhases.length; i++) {
            const semester = await Semester.findOne({
                where: {
                    id: examPhases[i].semId
                }
            })

            if (semester) {
                insertExamPhase(semester.id, semester.season, semester.year, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay)
            }
        }
        res.json(DataResponse(detailExamPhase));
        return;
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
    
})// Get all detail Exam Phase has been scheduled

router.get('/notScheduled', async (req, res) => {
    const detailExamPhase = []
    function insertExamPhase(id, ss, y, pN, sd, ed) {
        const EPDetail = {
            id: id, season: ss, year: y, ePName: pN, sDay: sd, eDay: ed
        }
        detailExamPhase.push(EPDetail)
    }
    try {
        const examPhases = await ExamPhase.findAll({ where: { status: 0 } })

        for (let i = 0; i < examPhases.length; i++) {
            const semester = await Semester.findOne({
                where: {
                    id: examPhases[i].semId
                }
            })

            if (semester) {
                insertExamPhase(semester.id, semester.season, semester.year, examPhases[i].ePName, examPhases[i].startDay, examPhases[i].endDay)
            }
        }
    } catch (error) {
        console.log(error);
        res.json(MessageResponse('Error found'))
    }
    res.json(DataResponse(detailExamPhase))
})// Get all Exam Phase has not been scheduled

export default router