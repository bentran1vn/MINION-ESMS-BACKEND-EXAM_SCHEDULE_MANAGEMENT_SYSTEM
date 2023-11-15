import express from 'express'
import User from '../models/User.js'
import sendEmail from '../common/sendEmail.js'

export async function sendEmailToLecturer() {
    const listLecturer = await User.findAll({
        where: {
            role: 'lecturer'
        }
    })
    const confirmLink = process.env.CLIENT_URL

    for (const Lecturer of listLecturer) {
        sendEmail(Lecturer.email, 'Announcement of exam schedule', `        
        <div style="padding: 10px; text-align: center;">
            <h1 style="color: black;">EXAM SCHEDULE MANAGEMENT SYSTEM</h1>
            <p style="color: black; text-align: left;">Dear teacher: ${Lecturer.name}</p>
            <p style="color: black; text-align: left;">List of exam schedules is now available, please visit the website <a href="${confirmLink}">ESMS</a> to check.</p>
            <p style="color: black; text-align: left;">Thank you for your attention.</p>
        </div>    
        `, () => { })
    }
    return true
}