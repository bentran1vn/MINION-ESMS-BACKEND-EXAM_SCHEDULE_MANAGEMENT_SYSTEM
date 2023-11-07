import express from 'express'
import { ErrorResponse, MessageResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import { autoFillStu } from '../utility/examRoomUtility.js'
import { autoCreateExamRoom, autoFillLecturerToExamRoom } from '../services/examRoomService.js'
import { check } from 'express-validator'
import { checkExamSlotByPhaseId } from '../services/examPhaseService.js'

const router = express.Router()

router.get('/', requireRole('staff'),  async (req, res) => {
    console.log("System is running !");
    const examPhase = req.query.examPhaseId

    try {
        console.log(examPhase);
        console.log("Checking Exam Phase !");
        let result = await checkExamSlotByPhaseId(examPhase)
        if(result) throw new Error("Exam Phase is being scheduled !")
        console.log("Exam Phase OK !");
        console.log("Creating Exam Room !");
        await autoCreateExamRoom(examPhase)
        console.log("Exam Room OK !");
        console.log("Filling Teacher Into Exam Room !");
        await autoFillLecturerToExamRoom(1, examPhase)
        console.log("Filling Lecturer Into Exam Room OK !");
        console.log("Filling Student Into Exam Room !");
        await autoFillStu()
        console.log("Filling Student Into Exam Room OK !");
        console.log("Building System Successfully !");
        res.json(MessageResponse("Create ExamRooms Successfully !"))
    } catch (err) {
        console.log(err);
        res.json(ErrorResponse(500, err.message))
    }
})

export default router