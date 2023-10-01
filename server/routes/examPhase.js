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
        await countCourse().then(value => numCou = value)

        let semesterId
        await createNewSemester().then(value => semesterId = value)


        let examPhaseList
        await createExamPhases().then(value => examPhaseList = value)

        // if (FE > 0) {
        //     let examPhase = await ExamPhase.create({
        //         semId: semesterId,
        //     })
        //     examPhaseList.push(examPhase)
        // }
        // if (PE > 0) {
        //     let examPhase = await ExamPhase.create({
        //         semId: semesterId,
        //     })
        //     examPhaseList.push(examPhase)
        // }
        res.json(DataResponse({
            phaseList: examPhaseList,
            numCourse: numCou
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/updatePhase', (req, res) => {

})

export async function createExamPhases(course, semesterId) {
    try {
        const date = new Date()
        let month = date.getMonth() + 1
        let blockNow = 10
        let desNow = 0
        // 0 is normal
        //{numFE : FE, numPE : PE, numFEc : FEc, numPEc : PEc}

        let examPhaseList = []

        if (month == 4 || month == 8 || month == 12) blockNow = 5
        course.forEach(async (val, key) => {
            if(val > 0) {
                if(key.includes("c")) desNow = 1
                const examType = await ExamType.findOne({
                    where : {
                        type : key.slice(3, 5),
                        block : blockNow,
                        des : desNow,
                    }
                })
                console.log(examType);
                let examPhase = await ExamPhase.create({
                    semId: semesterId,
                    eTId: examType.id
                })
                console.log(examPhase);
                examPhaseList.push(examPhase)
            }
        });

        return examPhaseList

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
}

export default router