import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Course from "./Course.js";
import ExamSlot from "./ExamSlot.js";

let tableName = 'subInSlot'

const SubInSlot = sequelize.define( tableName , {
    courId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Course,
            key: 'id'
        }
    },
    exSlId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: ExamSlot,
            key: 'id'
        }
    },
});

Course.hasMany(SubInSlot)
SubInSlot.belongsTo(Course)

ExamSlot.hasMany(SubInSlot)
SubInSlot.belongsTo(ExamSlot)

SubInSlot.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default SubInSlot