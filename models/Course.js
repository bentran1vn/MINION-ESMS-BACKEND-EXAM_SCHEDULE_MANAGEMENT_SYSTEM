import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Subject from "./Subject.js";

let tableName = 'courses'

const Course = sequelize.define( tableName , {
    subId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Subject,
            key: 'id'
        }
    },
    numOfStu:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

Subject.hasMany(Course, { foreignKey: 'subId' })
Course.belongsTo(Subject, { foreignKey: 'subId' })

Course.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default Course