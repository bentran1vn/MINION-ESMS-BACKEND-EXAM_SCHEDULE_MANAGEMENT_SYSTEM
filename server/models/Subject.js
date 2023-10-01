import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";


let tableName = 'subjects'

const Subject = sequelize.define(tableName, {
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    semesterNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0,
    },
    pe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        default: 0,
    }
});
// 0: là ko thi
// giá trị fe và pe tính bằng phút

Subject.sync().then(() => {
    console.log(`${tableName} table is created`);
})

export default Subject