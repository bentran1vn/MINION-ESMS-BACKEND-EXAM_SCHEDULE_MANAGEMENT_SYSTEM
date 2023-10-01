// ===== Imports lib =====
import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'
import { Strategy as GoogleStrategy, Strategy } from 'passport-google-oauth2'

// ===== Import routes ========
import './database/database.js'

import userRouter from './routes/user.js'
import examTypeRouter from './routes/examType.js'
import lecturerRouter from './routes/lecturer.js'
import roomRouter from './routes/room.js'
import semesterRouter from './routes/semester.js'
import studentRouter from './routes/student.js'
import subjectRouter from './routes/subject.js'
import timeSlotRouter from './routes/timeSlot.js'
import roomLogTimeRouter from './routes/roomLogTime.js'
import lecturerLogTimeRouter from './routes/lecturerLogTime.js'
import courseRouter from './routes/course.js'
import examPhaseRouter from './routes/examPhase.js'
import examSlotRouter from './routes/examSlot.js'
import subInSlotRouter from './routes/subInSlot.js'
import examRoomRouter from './routes/examRoom.js'
import studentExamRouter from './routes/studentExam.js'
import authenticateRouter from './routes/authenticate.js'
import overwriteResponseJSON from './middlewares/overwriteResponseJSON.js'


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
    origin: process.env.CLIENT_URL,
    credentials: true,
}))
//access to Google
server.use(cors())
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(cookieParser())
server.use(overwriteResponseJSON)

// ===== Routes =====
server.use('/users', userRouter)
server.use('/students', studentRouter)
server.use('/examTypes', examTypeRouter)
server.use('/lecturers', lecturerRouter)
server.use('/rooms', roomRouter)
server.use('/semesters', semesterRouter)
server.use('/students', studentRouter)
server.use('/subjects', subjectRouter)
server.use('/timeSlots', timeSlotRouter)
server.use('/roomLogTimes', roomLogTimeRouter)
server.use('/lecturerLogTimes', lecturerLogTimeRouter)
server.use('/courses', courseRouter)
server.use('/examPhases', examPhaseRouter)
server.use('/examSlots', examSlotRouter)
server.use('/subInSlots', subInSlotRouter)
server.use('/examRooms', examRoomRouter)
server.use('/studentExams', studentExamRouter)
server.use('/auth', authenticateRouter)
// khoaBE test

server.listen(PORT, () => {
    console.log(`Server is listening at PORT=${PORT}`)
})