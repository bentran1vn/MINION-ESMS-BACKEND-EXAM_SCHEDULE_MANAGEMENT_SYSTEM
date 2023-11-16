import express from 'express'
import { DataResponse, MessageResponse, ErrorResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import { findPhaseBySemIdv2, createPhase, deletePhaseBySemId, getExamphasesBySemId, updatePhase, findPhaseBySemId } from '../services/examPhaseService.js'

/**
 * @swagger
 * components:
 *   schemas:
 *     ExamPhases:
 *       type: object
 *       required:
 *         - semId
 *         - ePName
 *         - startDay
 *         - endDay
 *         - status
 *         - des
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto generate id
 *         semId:
 *           type: integer
 *           description: Describe semester Id, reference to table Semester
 *         ePName:
 *           type: string
 *           description: Describe the name of the exam phase
 *         startDay:
 *           type: DATEONLY
 *           description: Describe the exam start day
 *         endDay:
 *           type: DATEONLY
 *           description: Describe the exam end day
 *         status:
 *           type: BOOLEAN
 *           description: 0 is finish, 1 is pending
 *         des:
 *           type: integer
 *           description: 0 is normal, 1 is coursera
 *         alive:
 *           type: integer
 *           description: 0 is dead, 1 is alive
 *       example:
 *         id: 1
 *         semId: 1
 *         ePName: Đợt 1
 *         startDay: 2023-10-10
 *         endDay: 2023-10-15
 *         status: 0
 *         des: 0
 *         alive: 1
 */

/**
 * @swagger
 * tags:
 *   - name: ExamPhases
 *     description: The ExamPhases managing API
 */

/**
 * @swagger
 * /examPhases:
 *   post:
 *     summary: Create new exam phase.
 *     tags:
 *       - ExamPhases
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semId:
 *                 type: integer
 *                 example: 1
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
 *             required:
 *               - semId
 *               - ePName
 *               - startDay
 *               - endDay
 *               - des
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

/**
 * @swagger
 * /examPhases:
 *   put:
 *     summary: Update exam phase.
 *     tags:
 *       - ExamPhases
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               des:
 *                 type: string
 *                 example: Normal
 *             required:
 *               - semId
 *               - ePName
 *               - startDay
 *               - endDay
 *               - des
 *     responses:
 *       '200':
 *         description: ExamPhase Update!
 */

/**
 * @swagger
 * /examPhases:
 *   delete:
 *     summary: Delete exam phase.
 *     tags:
 *       - ExamPhases
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
 *             required:
 *               - id
 *     responses:
 *       '200':
 *         description: Delete Successfully!
 */

/**
 * @swagger
 * /examPhases/semId:
 *   get:
 *     summary: Return all ExamPhase by Semester Id
 *     tags:
 *       - ExamPhases
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Return Examphase List by Semester Id
 *     responses:
 *       '200':
 *         description: OK!
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExamPhases'
 */

/**
 * @swagger
 * /examPhases/{id}:
 *   get:
 *     summary: Return all ExamPhase by Semester Id
 *     tags:
 *       - ExamPhases
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Return Examphase by Semester Id
 *     responses:
 *       '200':
 *         description: OK!
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExamPhases'
 */

const router = express.Router()

router.post('/', requireRole('admin'), async (req, res) => {
    const examPhase = req.body
    const staff = res.locals.userData
    try {
        await createPhase(examPhase, staff)
        res.json(MessageResponse('Create successfully !'))
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Creat new Exam Phase

router.put('/', requireRole('admin'), async (req, res) => {

    try {
        const examPhaseUp = req.body
        const staff = res.locals.userData
        await updatePhase(examPhaseUp, staff)
        res.json(MessageResponse("ExamPhase Update !"))
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Update ExamPhase

router.delete('/', requireRole('admin'), async (req, res) => {
    const id = parseInt(req.body.id)
    const staff = res.locals.userData.id
    try {
        const result = await deletePhaseBySemId(id, staff)
        if (result) {
            res.json(MessageResponse("ExamPhase Delete !"))
        }
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})// Delete Exam Phase

router.get('/semId', async (req, res) => {
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20
        const semesterId = parseInt(req.query.semesterId);
        let returnL = await getExamphasesBySemId(semesterId, pageNo, limit);
        res.json(DataResponse(returnL));
    } catch (error) {
        console.log(error)
        res.json(ErrorResponse(500, error.message))
    }
})//get all Exam Phase by Semester Id


router.get('/otherRole', async (req, res) => {
    try {
        const semId = parseInt(req.query.id)
        let phaseList
        await findPhaseBySemIdv2(semId).then(value => phaseList = value)
        res.json(DataResponse(phaseList))
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})// Get Exam Phase by Semester Id


router.get('/:id', requireRole("admin"), async (req, res) => {
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20
        const semId = parseInt(req.params.id)
        let phaseList
        await findPhaseBySemId(semId, pageNo, limit).then(value => phaseList = value)
        res.json(DataResponse(phaseList))
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})
export default router