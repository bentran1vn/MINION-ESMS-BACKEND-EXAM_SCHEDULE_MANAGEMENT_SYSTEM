import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamType from '../models/ExamType.js'

/**
 * @swagger
 * /examTypes:
 *   post:
 *     summary: Create a new exam types
 *     tags: [ExamTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: PE
 *               block:
 *                 type: int
 *                 example: 10
 *               des:
 *                 type: int
 *                 example: 0
 *           required:
 *             - type
 *             - block
 *             - des
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

const router = express.Router()

router.post('/', async (req, res) => {
    const { type, block, des } = req.body;

    try {
        const examType = await ExamType.create({
            type: type,
            block: parseInt(block),
            des: parseInt(des)
        })
        console.log(examType);
        res.json(DataResponse(examType))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router

//add được