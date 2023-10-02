import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import SQLModel from '../common/SQLModel.js'

let tableName = 'users'

const User = sequelize.define( tableName , {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'lecturer'
    },
    ...SQLModel
});

User.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default User
