import express from 'express'
import { countCourse } from '../utility/courseUtility.js'
import { createExamPhases } from '../services/examPhaseService.js'
import { DataResponse, ErrorResponse } from '../common/reponses.js'
import { findSemesterPresentTime } from '../utility/examPhaseUtility.js'

const router = express.Router()


router.get('/', async (req, res) => {
    try {
        let numCou
        await countCourse().then(value => numCou = value)
        if(numCou === null) {
            throw new Error("Can not create a exam phase! Course problem!")
        }

        let semesterId
        await findSemesterPresentTime().then(value => semesterId = value)
        if(semesterId === null) {
            throw new Error("Can not create a exam phase! Semester problem!")
        }

        let examPhaseList
        await createExamPhases(numCou, semesterId).then(value => examPhaseList = value)
        if(examPhaseList === null) {
            throw new Error("Can not create a exam phase!")
        }

        res.json(DataResponse({
            phaseList: examPhaseList,
            numCourse: numCou
        }));
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
});

export default router