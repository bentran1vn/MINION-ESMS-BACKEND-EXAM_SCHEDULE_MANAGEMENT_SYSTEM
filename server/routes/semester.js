import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Semester from '../models/Semester.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const year = parseInt(req.body.year);
    const season = req.body.year;

    try {
        const semester = await Semester.create({
            season: season,
            year: year
        })
        console.log(semester);
        res.json(DataResponse(semester))

    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export async function createNewSemester() {
    const date = new Date()
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let season
    if(month >= 1 && month <= 4) season = "SPRING"
    if(month >= 5 && month <= 8) season = "SUMMER"
    if(month >= 9 && month <= 12) season = "FALL"
    try {
        const semester = await Semester.create({
            season: season,
            year: year
        })
        return semester.id
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
}

export default router
//add xong
