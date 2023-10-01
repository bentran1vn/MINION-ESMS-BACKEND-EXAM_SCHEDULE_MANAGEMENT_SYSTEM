import express from "express"; 
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import Jwt from "jsonwebtoken";
import { DataResponse, ErrorResponse, NotFoundResponse } from "../common/reponses.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router()

router.get('/', async (req, res) => {
    const users = await User.findAll()
    res.json(DataResponse(users))
})

router.post('/registers', async (req, res) => {
    const userData = req.body
    await User.create(
        {
            email : userData.email,
            name : userData.name
        }
    )
    res.json(DataResponse("check"))
})

router.get('/', async (req, res) => {
    const user = await User.findAll()
    res.json(DataResponse(user))
})

router.post('/login', async (req, res) => {
    const userData = req.body
    console.log(userData.email, userData.password);
    const user = await User.findOne({
        where: {
            email: userData.enmail
        }
    })

    if (!user) {
        res.json(NotFoundResponse())
        return
    }

    const isMatch = await bcrypt.compare(
        userData.password,
        user.password
    )

    if (isMatch) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }
        const token = Jwt.sign(payload, process.env.SECRET, {
            expiresIn: '3h'
        })
        res.cookie('token', token)
        res.json(DataResponse({
            token: token
        }))
    } else {
        res.json(ErrorResponse(401, 'Invalid email or password'))
    }
})

router.get('/logout', requireRole('lecture'), (req, res) => {
    res.clearCookie('token')
    res.json(DataResponse())
})

export default router