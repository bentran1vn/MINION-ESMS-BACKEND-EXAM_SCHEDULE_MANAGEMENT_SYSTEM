import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'
import ExamType from '../models/ExamType.js'
import ExamPhase from '../models/ExamPhase.js'
import Course from '../models/Course.js'
import Subject from '../models/Subject.js'
import { createNewSemester } from './semester.js'
import { countCourse } from './course.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const semId = parseInt(req.body.semId);
    const eTId = parseInt(req.body.eTId);
    const startDay = req.body.startDay;
    const endDay = req.body.endDay;


    try {
        const semester = await Semester.findOne({
            where: {
                id: semId
            }
        })
        const examType = await ExamType.findOne({
            where: {
                id: eTId
            }
        })
        if (!semester || !examType) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examPhase = await ExamPhase.create({
                semId: semId,
                eTId: eTId,
                startDay: startDay,
                endDay: endDay
            })
            console.log(examPhase);
            res.json(DataResponse(examPhase))
        }


    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/generateExamPhaseByCourse', async (req, res) => {
    try {
        let numCou
        let FE,PE
        await countCourse().then(value => numCou = value)
        FE = numCou.numFE
        PE = numCou.numPE
        
        let semesterId
        await createNewSemester().then(value => semesterId = value)
        let examPhaseList = []
        if(FE > 0) {
            let examPhase = await ExamPhase.create({
                semId : semesterId,
            })
            examPhaseList.push(examPhase)
        }
        if(PE > 0) {
            let examPhase = await ExamPhase.create({
                semId : semesterId,
            })
            examPhaseList.push(examPhase)
        }
        res.json(DataResponse({
            phaseList : examPhaseList,
            numCourse: numCou
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/updatePhase', (req, res) => {
    
})

export default router