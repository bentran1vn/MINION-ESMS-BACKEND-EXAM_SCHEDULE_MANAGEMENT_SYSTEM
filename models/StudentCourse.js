import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import Course from "./Course.js"
import Student from "./Student.js"

let tableName = 'studentCourse'

const StudentCourse = sequelize.define(tableName, {
    courId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Course,
            key: 'id'
        }
    },
    stuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'id'
        }
    }
});

Course.hasMany(StudentCourse, { foreignKey: 'courId' })
StudentCourse.belongsTo(Course, { foreignKey: 'courId' })

Student.hasMany(StudentCourse, { foreignKey: 'stuId' })
StudentCourse.belongsTo(Student, { foreignKey: 'stuId' })

StudentCourse.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default StudentCourse