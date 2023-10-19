import express from "express";
import Volunteer from "../models/Volunteer.js";

const router = express.Router()

router.get('/', async (req, res) => {
    res.json(await Volunteer.findAll())
})

export default router