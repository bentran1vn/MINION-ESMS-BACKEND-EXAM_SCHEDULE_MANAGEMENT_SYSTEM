import express from "express";
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Op } from "sequelize";
import { DataResponse, ErrorResponse, InternalErrResponse, MessageResponse, NotFoundResponse } from "../common/reponses.js";
import { requireRole } from "../middlewares/auth.js";
import { fieldValidator } from "../middlewares/fieldValidator.middleware.js";
import { searchValidation } from "../validation/userValidation.js";

const router = express.Router()

//Swagger Model
/**
 * @swagger
 * components:
 *   schemas:
 *    Users:
 *       type: object
 *       properties:
 *          id:
 *              type: integer
 *              description: Auto generate id
 *          email:
 *              type: string
 *              description: Describe User Email
 *          name:
 *              type: string
 *              description: Describe User Name
 *          role:
 *              type: string
 *              description: Describe User Role
 *          status: 
 *              type: integer
 *              description: 1 là hiện ra; 0 là ko hiện ra
 *       required:
 *          - email
 *          - name
 *          - role
 *       example:
 *           id: 1
 *           email: tan182205@gmail.com
 *           name: Tran Dinh Thien Tan
 *           role: Admin
 *           status: 1
 */

//Swagger Tag
/**
 * @swagger
 * tags:
 *    name: Users
 *    description: The users managing API
 */

//Swagger Get
/**
 * @swagger
 * /users/ :
 *   get :
 *     summary : Return the list of all the users with paging (status = 1).
 *     tags: [Users]
 *     parameters:
 *        - in: query
 *          name: page_no
 *          schema:
 *            type: integer
 *          required: true
 *          description: The page number Client want to get.
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *          description: The users limitation in a page.
 *     responses :
 *       200 :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Users'
 */

//Swagger Get
/**
 * @swagger
 * /users/{searchValue} :
 *   get :
 *     summary : Return the users with specific search value .
 *     tags: [Users]
 *     parameters:
 *        - in: query
 *          name: page_no
 *          schema:
 *            type: integer
 *          required: true
 *          description: The page number Client want to get.
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *          description: The users limitation in a page.
 *        - in: path
 *          name: searchValue
 *          schema:
 *            type: string
 *          required: true
 *          description: The value you want to search. It can be a name or email.
 *     responses :
 *       200 :
 *         description: OK !
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Users'
 */

//Swagger Delete
/**
 * @swagger
 * /users:
 *   delete:
 *     summary: Delete a user.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: tan1822@gmail.com
 *           required:
 *             - email
 *     responses:
 *       '200':
 *         description: Delete Successfully!
 */

//requireRole('admin')
router.get('/', requireRole('admin'), async (req, res) => {
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20
        const users_Total = await User.findAll()
        const users = await User.findAll({
            where: {
                role: { [Op.notLike]: '%admin' }
            },
            limit: limit,
            offset: (pageNo - 1) * limit
        })
        const count_User = { Total: users_Total.length, Data: users }
        res.json(DataResponse(count_User))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all User (status = 1)

//requireRole('admin')
router.post('/', async (req, res) => {
    try {
        const userData = req.body

        const user = await User.findOne({
            where: {
                email: userData.email,
                status: 0
            }
        })
        if (user) {
            await User.update(
                { status: 1, name: userData.name },
                {
                    where: {
                        email: userData.email,
                        status: 0
                    }
                }
            )
            res.json(MessageResponse("Create Successfully !"))
        } else {
            await User.create({
                email: userData.email,
                name: userData.name,
                role: userData.role,
            })
            res.json(MessageResponse("Create Successfully !"))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/:searchValue', fieldValidator(searchValidation), async (req, res) => {
    const string = req.params.searchValue
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20
        const users = await User.findAndCountAll({
            where: {
                [Op.or]: {
                    name: {
                        [Op.like]: '%' + string + '%'
                    },
                    email: {
                        [Op.like]: '%' + string + '%'
                    }
                },
                status: 1
            },
            limit: limit,
            offset: (pageNo - 1) * limit
        })
        const count_User = { Total: users.count, Data: users.rows }
        res.json(DataResponse(count_User))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get User or Users by name 

//requireRole('admin')
router.delete('/', async (req, res) => {
    const email = req.body.email
    try {
        const result = await User.update({ status: 0 }, {
            where: {
                email: email,
                status: 1
            }
        })
        if (result[0] == 0) {
            res.json(NotFoundResponse('Not found'))
        } else {
            res.json(MessageResponse('User deleted'))
        }
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Delete User by email (change status = 1 to 0)

function sendToken(res, user) {
    const payload = {
        id: user.id,
        name: user.username,
        role: user.role,
    }
    const token = jwt.sign(payload, process.env.SECRET, {
        expiresIn: '3h'
    })
    res.cookie('token', token)
    res.json(DataResponse({
        token: token
    }))
}// Send token

export default router