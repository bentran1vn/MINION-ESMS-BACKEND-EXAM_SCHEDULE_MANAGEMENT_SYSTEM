import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import ExamRoom from "./ExamRoom.js"
import Student from "./Student.js"

let tableName = 'studentExams'

const StudentExam = sequelize.define( tableName , {
    eRId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: ExamRoom,
            key: 'id'
        }
    },
    stuId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: Student,
            key: 'id'
        }
    },
    
});

Student.hasMany(StudentExam)
StudentExam.belongsTo(Student)

ExamRoom.hasMany(StudentExam)
StudentExam.belongsTo(ExamRoom)

StudentExam.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default StudentExam