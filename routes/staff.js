import express from "express";
import Staff from "../models/Staff.js";

const router = express.Router()

router.get('/', async (req, res) => {
    res(await Staff.findAll())
})

export default router