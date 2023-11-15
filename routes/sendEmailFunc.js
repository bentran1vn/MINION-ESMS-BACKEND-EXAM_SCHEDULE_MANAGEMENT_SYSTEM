import express from 'express'
import { ErrorResponse, MessageResponse } from '../common/reponses.js'
import { sendEmailToLecturer } from '../services/sendEmailFunc.js';

const router = express.Router()

router.get('/sendEmail', async (req, res) => {
    try {
        const result = await sendEmailToLecturer()
        if (result) {
            res.json(MessageResponse('Please check your email !'))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

export default router