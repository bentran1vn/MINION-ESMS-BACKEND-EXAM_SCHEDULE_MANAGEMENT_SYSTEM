import jwt from "jsonwebtoken";
import { UnauthorizedResponse } from "../common/reponses.js";


const roles = {
    lecturer: 0,
    staff: 1,
    admin: 2
}

function roleLevel(role){
    return roles[role]
}

export function requireRole(role){
    const middleware = (req, res, next) => {
        const token = req.cookies.token || req.headers['authorization']
        try{
            const data = jwt.verify(token, process.env.SECRET)
            res.locals.userData = data
            if(roleLevel(data.role) >= roleLevel(role)){
                console.log(data.role);
                next()
            } else {
                throw Error('Unauthorized')
            }
        } catch (err){
            res.json(UnauthorizedResponse())
        }
    }
    return middleware
}