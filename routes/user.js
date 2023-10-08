import express from "express";
import User from "../models/User.js";
import bcrypt from 'bcrypt'
import Jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { DataResponse, ErrorResponse, MessageResponse, NotFoundResponse } from "../common/reponses.js";
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
 *       example:
 *           id: 1
 *           email: tan182205@gmail.com
 *           name: Tran Dinh Thien Tan
 *           role: Admin
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
 *           required:
 *             - email
 *             - name
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
    res.json(MessageResponse("Create Successfully !"))
})

router.get('/:searchValue', async (req, res) => {
    const string = req.params.searchValue

    const users = await User.findAll({
        where: {
            [Op.or]: {
                name: {
                    [Op.like]: '%' + string + '%'
                },
                email: {
                    [Op.like]: '%' + string + '%'
                }
            }
        }
    })
    res.json(DataResponse(users))
})// Get User or Users by name 

router.delete('/', async (req, res) => {
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
})// Delete User by email

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.json(DataResponse())
})

export default router