import express from "express";
import User from "../models/User.js";
import { Op } from "sequelize";
import { DataResponse, ErrorResponse, MessageResponse, NotFoundResponse } from "../common/reponses.js";
import { requireRole } from "../middlewares/auth.js";
import { fieldValidator } from "../middlewares/fieldValidator.middleware.js";
import { searchValidation } from "../validation/userValidation.js";
import { createUser, getAllUser, searchUser } from "../services/userService.js";

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
    const pageNo = parseInt(req.query.page_no) || 1
    const limit = parseInt(req.query.limit) || 20
    try {
        const count_User = await getAllUser(pageNo, limit)
        res.json(DataResponse(count_User))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get all User (status = 1)

//
router.post('/', requireRole('admin'), async (req, res) => {
    const userData = req.body
    const staff = res.locals.userData
    try {
        await createUser(userData, staff)
        res.json(MessageResponse("Create User Sucess!"))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})

router.get('/:searchValue', requireRole('admin'), fieldValidator(searchValidation), async (req, res) => {
    const string = req.params.searchValue
    const pageNo = parseInt(req.query.page_no) || 1
    const limit = parseInt(req.query.limit) || 20
    try {
        const count_User = searchUser(string, pageNo, limit)
        res.json(DataResponse(count_User))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Get User or Users by name 

//requireRole('admin')
router.delete('/', requireRole('admin'), async (req, res) => {
    const email = req.body.email
    const staff = res.locals.userData
    try {
        await deleteUser(email, staff)
        res.json(MessageResponse('User deleted'))
    } catch (error) {
        console.log(error);
        res.json(ErrorResponse(500, error.message))
    }
})// Delete User by email (change status = 1 to 0)
export default router