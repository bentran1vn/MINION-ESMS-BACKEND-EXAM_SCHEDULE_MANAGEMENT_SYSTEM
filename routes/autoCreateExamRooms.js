import express from 'express'
import { ErrorResponse, MessageResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import { autoFillStu } from '../utility/examRoomUtility.js'
import { autoCreateExamRoom } from '../services/examRoomService.js'

const router = express.Router()

router.get('/', async (req, res) => {
    console.log("System is running !");
    console.log("Creating Exam Room !");
    const examPhase = req.body.examPhaseId

    try {
        await autoCreateExamRoom(examPhase)
        console.log("Filling Student Into Exam Room !");
        await autoFillLecturerToExamRoom(1, examPhase)
        console.log("Filling Teacher Into Exam Room !");
        await autoFillStu()
        console.log("Building System Successfully !");
        res.json(MessageResponse("Create ExamRooms Successfully !"))
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router