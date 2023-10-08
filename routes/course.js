import express from 'express'
import { DataResponse, InternalErrResponse, InvalidTypeResponse, MessageResponse, NotFoundResponse } from '../common/reponses.js'
import { requireRole } from '../middlewares/auth.js'
import Subject from '../models/Subject.js'
import Course from '../models/Course.js'
import ExamType from '../models/ExamType.js'
import { Op } from 'sequelize'

const router = express.Router()

router.post('/', async (req, res) => {
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
            res.json(MessageResponse("Create Success !"));
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export async function countCourse() {

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
        if (subject.dataValues.code.slice(-1) != 'c') {
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

    return { numFE: FE, numPE: PE, numFEc: FEc, numPEc: PEc }
}

export async function courseByPhase(examPhase) {

    const course = await Course.findAll()

    let subList = []

    for (const key in course) {
        subList.push(course[key].subId)
    }//Lấy ra các SubID Với Course Tương Ứng

    const subjectList = await Subject.findAll({
        where: {
            id: subList
        }
    })//Lấy ra các Subject với SubID tương ứng

    const examType = await ExamType.findOne({
        where: {
            id: examPhase.eTId
        }
    })//Lấy ra Loại Examtype của ExamPhase tương ứng

    let listSubByPhase = []

    for (const key in subjectList) {
        if (subjectList[key][examType.type.toLowerCase()] > 0) {
            listSubByPhase.push(subjectList[key].id)
        };
    }//Lấy ra các Subject tương ứng với ExamType của Examphase


    let courseByPhase = await Course.findAll({
        where: {
            subId: listSubByPhase
        }
    })//Lấy ra các Course tương ứng với SubId, những thằng mà có cùng loại với ExamPhase

    return courseByPhase

}
//requireRole("staff")
router.get('/', requireRole("staff"),async (req, res) => {
    try {
        const result = await Course.findAll({
            include: [{
                model: Subject,
                attributes: ['code', 'name', 'semesterNo', 'fe', 'pe']
            }],
            attributes: ['id', 'subId']
        });
        let listCourse = [];
        let i = 1;
        result.forEach(course => {     
            const subject = course.subject;
            const sub = {
                "No " : i++,
                "Course Id": course.dataValues.id,
                "Subject Id": course.dataValues.subId,
                "Subject Code" : subject.code,
                "Subject Name" : subject.name,
                "Semester " : subject.semesterNo,
                "FE " : subject.fe,
                "PE " : subject.pe
            }
            listCourse.push(sub);
        });
        console.log(listCourse);
        if(listCourse.length == 0){
            res.json(NotFoundResponse);
        }else{
            res.json(DataResponse(listCourse));
        }
        
    } catch (error) {
        console.error(error);
        res.json(InternalErrResponse());
        return;
    }
})


//requireRole("staff"),
router.delete('/', requireRole("staff"), async (req, res) => {
    const id = parseInt(req.body.id)
    try {
        if(id !== undefined && id !== null){
            const rowAffected = await Course.destroy({
                where: {
                    id: id
                }
            })
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('Course deleted'));
                return;
            }
        }else{
            const rowAffected = await Course.destroy({
                where: {}
            });
            if (rowAffected === 0) {
                res.json(NotFoundResponse());
                return;
            } else {
                res.json(MessageResponse('All courses deleted'));
                return;
            }
        }
    } catch (error) {
        console.log(error)
        res.json(InternalErrResponse())
    }
})


router.put('/', requireRole("staff"), async (req, res) => {
    const courseData = req.body
    const id = parseInt(req.body.id)

    try {
        const rowAffected = await Course.update({
            numOfStu: parseInt(courseData.numOfStu)
        }, {
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