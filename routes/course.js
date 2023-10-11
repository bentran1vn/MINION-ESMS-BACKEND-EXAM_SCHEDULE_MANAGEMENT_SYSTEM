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
            const course = await Course.create({
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

export async function countCourse() {

    const courses = await Course.findAll();
    let FE = 0
    let PE = 0
    let FEc = 0
    let PEc = 0
    const subjectPromises = [];

    courses.forEach(element => {
        const subjectId = element.subId;

        subjectPromises.push(
            Subject.findOne({
                where: {
                    id: subjectId
                }
            })
        );
    });

    const subjects = await Promise.all(subjectPromises);

    subjects.forEach(subject => {
        if (subject.dataValues.code.slice(-1) != 'c') {
            if (subject.dataValues.fe) {
                FE = FE + 1;
            }
            if (subject.dataValues.pe) {
                PE = PE + 1;
            }
        } else {
            if (subject.dataValues.fe) {
                FEc = FEc + 1;
            }
            if (subject.dataValues.pe) {
                PEc = PEc + 1;
            }
        }
    });

    return { numFE: FE, numPE: PE, numFEc: FEc, numPEc: PEc }
}

export async function courseByPhase(examPhase) {

    const course = await Course.findAll({
        order: [
            ['numOfStu', 'ASC']
        ]
    })

    let subList = []

    for (const key in course) {
        subList.push(course[key].subId)
    }//Lấy ra các SubID Với Course Tương Ứng

    const subjectList = await Subject.findAll({
        where: {
            id: subList
        }
    })//Lấy ra các Subject với SubID tương ứng

    const examType = await ExamType.findOne({
        where: {
            id: examPhase.eTId
        }
    })//Lấy ra Loại Examtype của ExamPhase tương ứng

    let listSubByPhase = []

    for (const key in subjectList) {
        if (subjectList[key][examType.type.toLowerCase()] > 0) {
            listSubByPhase.push(subjectList[key].id)
        };
    }//Lấy ra các Subject tương ứng với ExamType của Examphase


    let courseByPhase = await Course.findAll({
        where: {
            subId: listSubByPhase
        }
    })//Lấy ra các Course tương ứng với SubId, những thằng mà có cùng loại với ExamPhase

    return courseByPhase

}
//requireRole("staff")
router.get('/', async (req, res) => {
    let listCourse = [];
    try {
        const result = await Course.findAll({
            include: [{
                model: Subject,
                attributes: ['code', 'name', 'semesterNo', 'fe', 'pe']
            }],
            attributes: ['id', 'subId']
        });
        result.forEach(course => {     
            const subject = course.subject;
            const sub = {
                courseId: course.dataValues.id,
                subId: course.dataValues.subId,
                subCode : subject.code,
                subName : subject.name,
                semester : subject.semesterNo,
                fe : subject.fe,
                pe : subject.pe
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

//, requireRole("staff")
router.put('/', async (req, res) => {
    const courseData = req.body
    const id = parseInt(req.body.id)

    try {
        const rowAffected = await Course.update({
            numOfStu: parseInt(courseData.numOfStu)
        }, {
            where: {
                id: id,
            }
        })
        if (rowAffected[0] === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Course updated'))
        }

    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse())
    }
})



export default router