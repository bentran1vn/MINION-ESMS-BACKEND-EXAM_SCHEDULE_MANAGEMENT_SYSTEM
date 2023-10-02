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
    let FEc = 0
    let PEc = 0
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
        if(subject.dataValues.code.slice(-1) != 'c'){
            if (subject.dataValues.fe) {
                FE = FE + 1;
            }
            if (subject.dataValues.pe) {
                PE = PE + 1;
            }
        } else {
            if (subject.dataValues.fe) {
                FEc = FEc + 1;
            }
            if (subject.dataValues.pe) {
                PEc = PEc + 1;
            }
        }
    });

    return {numFE : FE, numPE : PE, numFEc : FEc, numPEc : PEc}
}

router.get('/getAll', requireRole("staff"), async (req, res) => {
    try {
        const course = await Course.findAll()
        if(!course){
            res.json(NotFoundResponse())
        }else{
            res.json(DataResponse(course))
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})

router.post('/create', async (req, res) => {
    const {subId, numOfStu} = req.body;

    try{
        const subject = await Subject.findOne({
            where: {
                id: parseInt(subId)
            }
        })
        if(!subject){
            res.json(NotFoundResponse());
        }else{
            const course = await Course.create({
                subId: parseInt(subId),
                numOfStu: parseInt(numOfStu)
            })
            console.log(course);
            res.json(DataResponse(course))
        }
    }catch(error){
        console.log(error);
        res.json(InternalErrResponse())
    }
})

router.delete('/delete', requireRole("staff"), async (req, res) => {
    const id = parseInt(req.body.id)
    try {
        const rowAffected = await Course.destroy({
            where: {
                id: id
            }
        })
        if (rowAffected === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Course deleted'));
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})

router.delete('/deleteAll', requireRole("staff"), async (req, res) => {
    try {
        const rowAffected = await Course.destroy({
            where: {}
        });
        if (rowAffected === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('All courses deleted'));
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})


router.put('/update', requireRole("staff"), async (req, res) => {
    const courseData = req.body
    const id = parseInt(req.body.id)

    try {
        const rowAffected = await Course.update(courseData, {
            where: {
                id: id,
            }
        })
        if (rowAffected[0] === 0) {
            res.json(NotFoundResponse());
        } else {
            res.json(MessageResponse('Course updated'))
        }

    } catch (err) {
        console.log(err);
        res.json(InternalErrResponse())
    }
})



export default router