import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import ExamPhase from '../models/ExamPhase.js'
import StaffLogChange from '../models/StaffLogChange.js'
import { Op, STRING } from 'sequelize'
import { checkTime, createPhase, deletePhaseBySemId, findPhaseBySemId, updatePhase } from '../services/examPhaseService.js'

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
 *          - des
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
 *              description: 0 is finish, 1 is pending
 *          des: 
 *              type: integer
 *              description: 0 is normal, 1 is coursera
 *       example:
 *           id: 1
 *           semId: 1
 *           ePName: Đợt 1
 *           startDay: 2023-10-10
 *           endDay: 2023-10-15
 *           status: 0
 *           des: 0
 */

/**
 * @swagger
 * tags:
 *    name: ExamPhases
 *    description: The ExamPhases managing API
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
 *                 example: FALL_2023, SUMMER_2023
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *               des: 
 *                 type: integer
 *                 example: 0 is normal, 1 is coursera
 *           required:
 *             - ePName
 *             - startDay
 *             - endDay
 *             - des
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
 *               examPhaseId:
 *                 type: integer
 *                 example: 1
 *               semId:
 *                 type: integer
 *                 example: 1
 *               ePName:
 *                 type: string
 *                 example: FALL_2023
 *               startDay:
 *                 type: DATEONLY
 *                 example: 2023-10-10
 *               endDay:
 *                 type: DATEONLY
 *                 example: 2023-10-15
 *           required:
 *             - examPhaseId
 *             - semId
 *             - ePName
 *             - startDay
 *             - endDay
 *     responses:
 *       '200':
 *         description: ExamPhase Update !
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
 * /examPhases/semId :
 *   get :
 *     summary : Return all ExamPhase by Semester Id
 *     tags: [ExamPhases]
 *     parameters:
 *        - in: query
 *          name: semesterId
 *          schema:
 *            type: integer
 *          required: true
 *          description: The Semester Id client want to get
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
    const examPhase = req.body
    try {
        await createPhase(examPhase)
        res.json(MessageResponse('Create successfully !'))
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Creat new Exam Phase

router.put('/', async (req, res) => {
    const examPhaseUp = req.body
    try {
        await updatePhase(examPhaseUp)
        res.json(MessageResponse("ExamPhase Update !"))
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Update ExamPhase

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id)
    try {
        await deletePhaseBySemId(id)
        res.json(MessageResponse("ExamPhase Delete !"))
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Delete Exam Phase

router.get('/semId', async (req, res) => {
    const semesterId = parseInt(req.query.semesterId);
    try {

        const time = new Date() //ngày hiện tại
        var timeFormatted = time.toISOString().slice(0, 10)

        const examPhase = await ExamPhase.findAll({
            where: {
                semId: semesterId
            }
        })
        if (examPhase.length != 0) {
            res.json(DataResponse(examPhase));
            return;
        }
    } catch (err) {
        res.json(InternalErrResponse());
        return;
    }
})

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

router.get('/:id', async (req, res) => {
    const semId = parseInt(req.params.id)
    try {
        let phaseList
        await findPhaseBySemId(semId).then(value => phaseList = value)
        res.json(DataResponse(phaseList))
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router