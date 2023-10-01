import passport from "passport";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { NotFoundResponse } from "../common/reponses.js";

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
                    email: profile.email
                }
            })
            if (!user) {
                res.json(NotFoundResponse());
            } else {
                const payload = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
                const token = jwt.sign(payload, process.env.SECRET, {
                    expiresIn: '3h'
                })
                res.cookie('token', token)
                res.redirect(process.env.CLIENT_URL)
            }
        }
    } catch (err) {
        console.log(err)
        res.json(InternalErrResponse());
    }
})

export default router