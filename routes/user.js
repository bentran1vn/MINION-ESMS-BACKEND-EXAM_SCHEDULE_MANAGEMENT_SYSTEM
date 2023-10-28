import express from "express";
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt  from 'jsonwebtoken'
import { Op } from "sequelize";
import { DataResponse, ErrorResponse, InternalErrResponse, MessageResponse, NotFoundResponse } from "../common/reponses.js";
import { requireRole } from "../middlewares/auth.js";

/**
 * @swagger
 * components:
 *   schemas:
 *    Users:
 *       type: object
 *       required:
 *          - email
 *          - name
 *          - role
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
 *       example:
 *           id: 1
 *           email: tan182205@gmail.com
 *           name: Tran Dinh Thien Tan
 *           role: Admin
 *           status: 1
 */

/**
 * @swagger
 * tags:
 *    name: Users
 *    description: The users managing API
 */

/**
 * @swagger
 * /users/ :
 *   get :
 *     summary : Return the list of all the users with paging .
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

/**
 * @swagger
 * /users/logout:
 *   get:
 *     summary: Logout.
 *     tags: [Users]
 *     responses:
 *       '200':
 *         description: OK !
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user.
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
 *               name:
 *                 type: string
 *                 example: ahihi
 *               role:
 *                 type: string
 *                 example: ahihi
 *           required:
 *             - email
 *             - name
 *             - role
 *     responses:
 *       '200':
 *         description: Create Successfully!
 */

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

const router = express.Router()
//, requireRole('admin')
router.get('/', async (req, res) => {

    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20

        const totalUser = await User.findAll({
            where: {
                status: 1
            }
        })
        const users = await User.findAll({
            where: {
                status: 1
            },
            limit: limit,
            offset: (pageNo - 1) * limit
        })
        const count_User = { Total: totalUser.length, Data: users }
        res.json(DataResponse(count_User))
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})// Get all User (status = 1)

//requireRole('admin')
router.post('/', async (req, res) => {
    try {
        const userData = req.body

        const user1 = await User.findOne({
            where: {
                email: userData.email
            }
        })
        if (!user1) {
            await User.create({
                email: userData.email,
                name: userData.name,
                role: userData.role,
                status: 0
            })
            res.json(MessageResponse("Create Successfully !"))
        } else {
            res.json(MessageResponse('Duplicated email!'))
        }
    } catch (error) {
        console.log(error);
        res.json(InternalErrResponse())
    }
})

router.get('/:searchValue', async (req, res) => {
    try {
        const pageNo = parseInt(req.query.page_no) || 1
        const limit = parseInt(req.query.limit) || 20

        const string = req.params.searchValue
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
        res.json(InternalErrResponse())
    }
})// Get User or Users by name 
//, requireRole('admin')
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
        console.log(error)
        res.json(MessageResponse('Error found'))
    }
})// Delete User by email (status = 0)

//, requireRole('lecturer')
router.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.json(DataResponse())
})


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
}

export default router