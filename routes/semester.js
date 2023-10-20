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
 *               year:
 *                 type: integer
 *                 example: 2023, 2022, 2021
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
 *             - year
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
    try {
        const semester = await createNewSemesterS(season, year, start, end)
        if(semester != null){
            res.json(MessageResponse("Create new semester successfully!"))
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
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
})

export default router
//add xong
