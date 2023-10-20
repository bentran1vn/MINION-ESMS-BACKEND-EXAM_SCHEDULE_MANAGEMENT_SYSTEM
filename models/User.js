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
    status:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là hiện ra
    //0 là ko hiện ra
    ...SQLModel
});

await User.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default User
