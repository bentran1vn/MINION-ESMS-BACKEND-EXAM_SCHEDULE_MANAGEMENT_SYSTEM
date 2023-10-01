import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'

const router = express.Router()

router.post('/create', async (req, res) => {
    const subId = parseInt(req.body.subId);
    const numOfStu = parseInt(req.body.numOfStu);

    try {
        const subject = await Subject.findOne({
            where: {
                id: subId
            }
        })
        if (!subject) {
            res.json(NotFoundResponse());
            return;
        } else {
            const course = await Course.create({
                subId: subId,
                numOfStu: numOfStu
            })
            res.json(DataResponse(course))
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export async function countCourse(){

    const courses = await Course.findAll();
    let FE = 0
    let PE = 0
    const subjectPromises = [];

    courses.forEach(element => {
        const subjectId = element.subId;

        subjectPromises.push(
            Subject.findOne({
                where: {
                    id: subjectId
                }
            })
        );
    });

    const subjects = await Promise.all(subjectPromises);

    subjects.forEach(subject => {
        if (subject.dataValues.fe > 0) {
            FE = FE + 1;
        }
        if (subject.dataValues.pe) {
            PE = PE + 1;
        }
    });

    return {numFE : FE, numPE : PE}
}

export default router