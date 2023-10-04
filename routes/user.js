import express from "express";
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import Jwt from "jsonwebtoken";
import { DataResponse, ErrorResponse, NotFoundResponse } from "../common/reponses.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router()

router.get('/', async (req, res) => {
    const pageNo = parseInt(req.query.page_no) || 1
    const limit = parseInt(req.query.limit) || 20

    const users = await User.findAll({
        limit: limit,
        offset: (pageNo - 1) * limit
    })
    res.json(DataResponse(users))
})

router.post('/', async (req, res) => {
    const userData = req.body
    await User.create(
        {
            email: userData.email,
            name: userData.name
        }
    )
    res.json(DataResponse("check"))
})

router.get('/getById', async (req, res) => { // Get User or Users by Id 
    const id = req.body.id.split(",")

    const users = await User.findAll({
        where: {
            id: {
                [Op.or]: id
            }
        }
    })

    res.json(DataResponse(users))
})

router.get('/getByName', async (req, res) => { // Get User or Users by name 
    const name = req.body.name

    const users = await User.findAll({
        where: {
            name: {
                [Op.like]: '%' + name + '%'
            }
        }
    })
    console.log(users);
    res.json(DataResponse(users))
})

router.delete('/', async (req, res) => { // Delete User by email
    const email = req.body.email

    try {
        const result = await User.destroy({
            where: {
                email: email,
            }
        })
        if (result === 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('User deleted'))
        }
    } catch (error) {
        console.log(error)
        res.json(MessageResponse('Error found'))
    }
})

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.json(DataResponse())
})

export default router