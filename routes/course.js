import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import ExamType from '../models/ExamType.js'
import { Op } from 'sequelize'

const router = express.Router()
/**
 * @swagger
 * components:
 *   schemas:
 *    Courses:
 *       type: object
 *       required:
 *          - subId
 *          - numOfStu
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          subId:
 *              type: integer
 *              description: reference to Subject id
 *          numOfStu:
 *              type: integer
 *              description: number of student in 1 Subject test
 *       example:
 *           id: 1
 *           subId: 1
 *           numOfStu: 120
 */

/**
 * @swagger
 * tags:
 *    name: Courses
 *    description: The courses managing API
 */

/**
 * @swagger
 * /courses/:
 *   post:
 *     summary: Create a new Course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subId:
 *                 type: integer
 *                 example: 1, 2, 3
 *               numOfStu:
 *                 type: integer
 *                 example: 120
 *           required:
 *             - subId
 *             - numOfStu
 *     responses:
 *       '200':
 *         description: Create Success !
 */
/**
 * @swagger
 * /courses/:
 *   get:
 *     summary: Return all Courses
 *     tags: [Courses]
 *     responses:
 *       '200':
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Courses'
 */
/**
 * @swagger
 * /courses/:
 *   delete:
 *     summary: Delete 1 Courses by id or Delete all if id null by Staff
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                 type: integer
 *                 example: 1, or null
 *           required:
 *             - id
 *     responses:
 *       '200':
 *         description: Course deleted / All courses deleted 
 */
/**
 * @swagger
 * /courses/:
 *   put:
 *     summary: Update 1 Couse data by Staff
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: 
 *                 type: integer
 *                 example: 1, or null
 *               subId:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *               numOfStu:
 *                 type: inter
 *                 example: 120, 124
 *           required:
 *             - id
 *             - subId
 *             - numOfStu
 *     responses:
 *       '200':
 *         description: Course deleted / All courses deleted 

 */


router.post('/', async (req, res) => {
    const subId = parseInt(req.body.subId);
    const numOfStu = parseInt(req.body.numOfStu);

    try {
        const subject = await Subject.findOne({
            where: {
                id: subId
            }
        })
        if (!subject) {
            res.json(NotFoundResponse());
            return;
        } else {
            await Course.create({
                subId: subId,
                numOfStu: numOfStu
            })
            res.json(MessageResponse("Create Success !"));
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/', async (req, res) => {
    let listCourse = [];
    try {
        const result = await Course.findAll({
            include: [{
                model: Subject,
                attributes: ['code']
            }],
            attributes: ['id', 'subId', 'numOfStu']
        });
        result.forEach(course => {     
            const subject = course.subject;
            const sub = {
                courseId: course.dataValues.id,
                subCode : subject.code,
                numOfStu : course.dataValues.numOfStu,
            }
            listCourse.push(sub);
        });
        console.log(listCourse);
        if(listCourse.length == 0){
            res.json(NotFoundResponse);
        }else{
            res.json(DataResponse(listCourse));
        }
        
    } catch (error) {
        console.error(error);
        res.json(InternalErrResponse());
        return;
    }
})

//requireRole("staff"),
router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id) || null;
    try {
        if(id != null){
            const rowAffected = await Course.destroy({
                where: {
                    id: id
                }
            })
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('Course deleted'));
                return;
            }
        }else{
            const rowAffected = await Course.destroy({
                where: {}
            });
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('All courses deleted'));
                return;
            }
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})

export default router