import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Course from "./Course.js";
import ExamSlot from "./ExamSlot.js";

let tableName = 'subInSlot'

const SubInSlot = sequelize.define( tableName , {
    courId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references:{
            model: Course,
            key: 'id'
        }
    },
    exSlId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references:{
            model: ExamSlot,
            key: 'id'
        }
    },
});

Course.hasMany(SubInSlot, { foreignKey: 'courId' })
SubInSlot.belongsTo(Course, { foreignKey: 'courId' })

ExamSlot.hasMany(SubInSlot, { foreignKey: 'exSlId' })
SubInSlot.belongsTo(ExamSlot, { foreignKey: 'exSlId' })

await SubInSlot.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default SubInSlot