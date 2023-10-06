import express from 'express'
import { createNewSemester } from './semester.js'
import { countCourse } from './course.js'
import { createExamPhases } from './examPhase.js'
import { DataResponse } from '../common/reponses.js'

const router = express.Router()


router.get('/', async (req, res) => {
    try {
        let numCou
        await countCourse().then(value => numCou = value)

        let semesterId
        await createNewSemester().then(value => semesterId = value)


        let examPhaseList
        await createExamPhases(numCou, semesterId).then(value => examPhaseList = value)

        res.json(DataResponse({
            phaseList: examPhaseList,
            numCourse: numCou
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router