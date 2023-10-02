import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'lecturers'

const Lecturer = sequelize.define( tableName , {
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: User,
            key: 'id'
        }
    }, 
    lecId:{
        type: DataTypes.STRING(8),
        allowNull: false
    }
});

User.hasOne(Lecturer);
Lecturer.belongsTo(User);

Lecturer.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default Lecturer