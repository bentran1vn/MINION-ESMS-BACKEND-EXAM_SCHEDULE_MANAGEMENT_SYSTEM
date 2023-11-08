import passport from "passport";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { NotFoundResponse, InternalErrResponse } from "../common/reponses.js";

const router = express.Router()

router.get('/google', passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false,
}))

router.get('/google/callback', passport.authenticate('google', {
    session: false,
}), async (req, res) => {
    try {
        const profile = req.user
        if (!profile) {
            res.json(NotFoundResponse());
        } else {
            const user = await User.findOne({
                where: {
                    email: profile.email,
                    status: 1
                }
            })
            if (!user) {
                res.redirect(`${process.env.CLIENT_URL}?error_message=Can not find User!`)
            } else {
                const payload = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image_url: profile.photos[0].value
                }
                const token = jwt.sign(payload, process.env.SECRET, {
                    expiresIn: '3h'
                })
                // res.cookie('token', token, { secure: true, httpOnly: true })
                // console.log(user);
                // console.log(token);
                if (user.role == 'admin') res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
                if (user.role == 'lecturer') res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
                if (user.role == 'staff') res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
                if (user.role == 'student') res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
            }
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

router.get('/', (req, res) => {
    res.redirect(`${process.env.SERVER_URL}/auth/google`)
})

export default router