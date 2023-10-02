import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import ExamPhase from '../models/ExamPhase.js'
import TimeSlot from '../models/TimeSlot.js'
import ExamSlot from '../models/ExamSlot.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const ePId = parseInt(req.body.ePId);
    const timeSlotId = parseInt(req.body.timeSlotId);
    const day = req.body.day;


    try {
        const examPhase = await ExamPhase.findOne({
            where: {
                id: ePId
            }
        })
        const timeSlot = await TimeSlot.findOne({
            where: {
                id: timeSlotId
            }
        })
        if (!examPhase || !timeSlot) {
            res.json(NotFoundResponse());
            return;
        } else {
            const examSlot = await ExamSlot.create({
                ePId: ePId,
                timeSlotId: timeSlotId,
                day: day
            })
            console.log(examSlot);
            res.json(DataResponse(examSlot))
        }

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.delete('/', async (req, res) => {
    const id = parseInt(req.body.id)

    try {
        const result = await ExamSlot.destroy({
            where: {
                id: id,
            }
        })
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('Exam Slot deleted'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'))
    }
})

router.get('/', async (req, res) => {
    const examPhaseList = await ExamPhase.findAll(
        {
            order: [
                ['startDay', 'ASC'],
            ]
        }
    )
    //Ensuring the order of Examphase

    const course = await Course.findAll()
    console.log(course);

    for (const key in examPhaseList) {
        const startDay = new Date(examPhaseList[key].startDay)
        const endDay = new Date(examPhaseList[key].endDay)
        const diffInMs = Math.abs(endDay - startDay);
        const dayLength = diffInMs / (1000 * 60 * 60 * 24)
        //get the Different in a Examphase

        for (let i = 0; i <= dayLength; i++) {
            let day = new Date(startDay);
            if (i !== 0) {
                day.setDate(startDay.getDate() + i);
            }
            //set each day in Examphases

        }
    }
    res.json('hihi')
})

export async function createExamSlot() {
    try {
        const examPhaseList = await ExamPhase.findAll(
            {
                order: [
                    ['startDay', 'ASC'],
                ]
            }
        )

    } catch (error) {
        console.log(err)
        res.json(InternalErrResponse());
    }
}

export default router