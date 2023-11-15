// ===== Imports lib =====
import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'
import { Strategy as GoogleStrategy, Strategy } from 'passport-google-oauth2'
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc"
import { startCronJob } from './utility/cronJob.js'
// import { startCronJob } from './test/cronNodeTest.js'

// ===== Import routes ========
import './database/database.js'

import userRouter from './routes/user.js'
import roomRouter from './routes/room.js'
import semesterRouter from './routes/semester.js'
import studentRouter from './routes/student.js'
import subjectRouter from './routes/subject.js'
import timeSlotRouter from './routes/timeSlot.js'
import roomLogTimeRouter from './routes/roomLogTime.js'
import courseRouter from './routes/course.js'
import examPhaseRouter from './routes/examPhase.js'
import examSlotRouter from './routes/examSlot.js'
import subInSlotRouter from './routes/subInSlot.js'
import examRoomRouter from './routes/examRoom.js'
import staffLogChangeRouter from './routes/staffLogChange.js'
import studentExamRouter from './routes/studentExam.js'
import authenticateRouter from './routes/authenticate.js'
import autoCreateExamRoomsRouter from './routes/autoCreateExamRooms.js'
import overwriteResponseJSON from './middlewares/overwriteResponseJSON.js'
import studentSubjectRouter from './routes/studentSubject.js'
import autoCreateCourseRouter from './routes/autoCreateCourse.js'
import autoFillStuRouter from './routes/autoFillStu.js'
import examinerRouter from './routes/examiner.js'
import examinerLogTimeRouter from './routes/examinerLogTime.js'
import dashboardRouter from './routes/dashboard.js'
import sendEmail from './routes/sendEmailFunc.js'

// ===== Config =====
const server = express()
const PORT = process.env.PORT || 3000

// ===== Middlewares =====
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/google/callback`
}, (req, accessToken, refreshToken, profile, done) => {
    done(null, profile)
}))
server.use(passport.initialize())
server.use(cors({
    origin: '*',
    credentials: true,
}))
//access to Google
server.use(cors())
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(cookieParser())
server.use(overwriteResponseJSON)

// ===== Routes =====
server.use('/examiners', examinerRouter)
server.use('examinerLogTimes', examinerLogTimeRouter)

server.use('/users', userRouter)
server.use('/students', studentRouter)
server.use('/rooms', roomRouter)
server.use('/semesters', semesterRouter)
server.use('/students', studentRouter)
server.use('/subjects', subjectRouter)
server.use('/timeSlots', timeSlotRouter)
server.use('/roomLogTimes', roomLogTimeRouter)
server.use('/courses', courseRouter)
server.use('/examPhases', examPhaseRouter)
server.use('/examSlots', examSlotRouter)
server.use('/subInSlots', subInSlotRouter)
server.use('/examRooms', examRoomRouter)
server.use('/staffLogChanges', staffLogChangeRouter)
server.use('/studentExams', studentExamRouter)
server.use('/auth', authenticateRouter)
server.use('/autoCreateExamRooms', autoCreateExamRoomsRouter)
server.use('/studentSubjects', studentSubjectRouter)
server.use('/autoCreateCourses', autoCreateCourseRouter)
server.use('/autoFillStus', autoFillStuRouter)
server.use('/dashboard', dashboardRouter);
server.use('/sendEmail', sendEmail)

// ===== Swagger =====
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Library API",
            version: "1.0.0",
            description: "ESMS Express Library API"
        },
        servers: [
            {
                url: process.env.SERVER_URL
            },
        ],
    },
    apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options)
server.use("/", swaggerUI.serve, swaggerUI.setup(specs))

// ===== Cron Job =====
await startCronJob()

// ===== Start server =====
server.listen(PORT, () => {
    console.log(`Server is listening at PORT=${PORT}`)
})

console.log("--------------");
console.log("Website: " + process.env.SERVER_URL);
console.log("--------------");