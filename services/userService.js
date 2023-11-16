import { Op } from "sequelize"
import User from "../models/User.js"

export async function getAllUser(pageNo, limit) {
    const users_Total = await User.findAll({
        where: {
            role: { [Op.notLike]: '%admin' }
        }
    })
    if (!users_Total) throw new Error("Can not find User!")
    const users = await User.findAll({
        where: {
            role: { [Op.notLike]: '%admin' }
        },
        limit: limit,
        offset: (pageNo - 1) * limit
    })
    if (!users) throw new Error("Can not find User!")

    const count_User = { Total: users_Total.length, Data: users }
    return count_User
}

export async function createUser(userData, staff) {
    const user = await User.findOne({
        where: {
            email: userData.email,
            status: 0
        }
    })
    if (user) {
        let result = await User.update(
            { status: 1, name: userData.name },
            {
                where: {
                    email: userData.email,
                    status: 0
                }
            }
        )
        if (!result) throw new Error("Can not create User!")

        // const checkLogStaff = await StaffLogChange.create({
        //     rowId: examRoom.dataValues.id,
        //     tableName: 4,
        //     userId: staff.id,
        //     typeChange: 17,
        // })
        // if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")

        res.json(MessageResponse("Create Successfully !"))
    } else {
        let result = await User.create({
            email: userData.email,
            name: userData.name,
            role: userData.role,
        })
        if (!result) throw new Error("Can not create User!")
    }
}

export async function searchUser(string, pageNo, limit) {
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
    if (!users) throw new Error("Can not find User!")
    const count_User = { Total: users.count, Data: users.rows }

    return count_User
}

export async function deleteUser(email, staff) {
    const result = await User.update({ status: 0 }, {
        where: {
            email: email,
            status: 1
        }
    })
    if (!result) throw new Error("Can not delete User!")

    const checkLogStaff = await StaffLogChange.create({
        rowId: examRoom.dataValues.id,
        tableName: 4,
        userId: staff.id,
        typeChange: 18,
    })
    if (!checkLogStaff) throw new Error("Problem with assign Course! Fail to write staff log!")
}