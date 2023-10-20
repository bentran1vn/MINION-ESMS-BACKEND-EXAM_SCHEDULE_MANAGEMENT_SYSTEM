import express from 'express'
import { ErrorResponse, MessageResponse } from '../common/reponses.js'
import { autoCreateCourse } from '../utility/courseUtility.js'

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        let result
        await autoCreateCourse().then(value => result = value)
        if(result){
            res.json(MessageResponse('Create Course successfully!'))
        } else {
            throw new Error("Can not create Exam Courses!")
        }
    } catch (Error) {
        res.json(ErrorResponse(500, Error.message));
    }
});

export default router