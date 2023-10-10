import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import Subject from '../models/Subject.js'
import { requireRole } from '../middlewares/auth.js'


const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *    Subjects:
 *       type: object
 *       required:
 *          - code
 *          - name
 *          - semesterNo
 *          - fe
 *          - pe
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          code:
 *              type: String
 *              description: The code number of a Subject
 *          name:
 *              type: String
 *              description: The name of a Subject
 *          semesterNo:
 *              type: integer
 *              description: The semester of a Subject
 *          fe:
 *              type: integer
 *              example: The exam time length (minutes) of Subject
 *          pe: 
 *              type: integer
 *              example: The exam time length (minutes)
 *          example:
 *           id: 1
 *           code: MAE201
 *           name: Mathematics for Engineering
 *           semesterNo: 1
 *           fe: 60
 *           pe: 0 (0 = no test)
 */

/**
 * @swagger
 * tags:
 *    name: Subjects
 *    description: The Subjects managing API
 */
/**
 * @swagger
 * /subjects/:
 *   post:
 *     summary: Create a new Subject
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: String
 *                 example: MAE201, PRN211
 *               name:
 *                 type: String
 *                 example: Mathematic for Engineering
 *               semesterNo:
 *                 type: integer
 *                 example: 1, 2, 3, 4
 *               fe:
 *                 type: integer
 *                 example: 60, 0 (0 = no test)
 *               pe:    
 *                 type: integer
 *                 example: 60, 90, 0
 *           required:
 *             - code
 *             - name
 *             - semesterNo
 *             - fe
 *             - pe
 *     responses:
 *       '200':
 *         description: Create Success !
 *       '500':
 *         description: Internal Server Error !
 */

router.post('/', async (req, res) => {
    const { code, name, semesterNo, fe, pe } = req.body;

    try {
        const subject = await Subject.create({
            code: code,
            name: name,
            semesterNo: parseInt(semesterNo),
            fe: parseInt(fe),
            pe: parseInt(pe)
        })
        console.log(subject);
        res.json(MessageResponse("Create Success !"))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export async function subjectById(id) {
    const subject = await Subject.findOne({
        where: {
            id: id
        }
    })
    return subject
}

export default router
//add xong