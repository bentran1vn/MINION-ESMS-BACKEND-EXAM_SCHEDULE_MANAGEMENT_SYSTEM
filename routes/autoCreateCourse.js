import express from 'express'
import { createNewSemester } from './semester.js'
import { countCourse } from './course.js'
import { createExamPhases } from './examPhase.js'
import { DataResponse, MessageResponse } from '../common/reponses.js'
import StudentSubject from '../models/StudentSubject.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import { Op } from 'sequelize'

const router = express.Router()


router.get('/', async (req, res) => {

    try {
        const arrIdSub = []
        const stuSub = await StudentSubject.findAll()

        stuSub.forEach(e => {
            if (!arrIdSub.includes(e.subjectId)) {
                arrIdSub.push(e.subjectId);
            }
        });

        const subject = await Subject.findAll({
            where: {
                id: {
                    [Op.or]: arrIdSub
                }
            }
        })

        for (let i = 0; i < subject.length; i++) {
            const stuSub = await StudentSubject.findAll({
                where: {
                    subjectId: subject[i].id
                }
            })

            await Course.create({
                subId: subject[i].id,
                numOfStu: stuSub.length,
                semesterId: subject[i].semesterNo,
                status: 1
            })

        }
        res.json(MessageResponse('Create Course successfully'))
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
});

export default router