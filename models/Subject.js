import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";


let tableName = 'subjects'

const Subject = sequelize.define(tableName, {
    code: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    semesterNo: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    pe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là hiện ra
    //0 là ko hiện ra  
    
});
// 0: là ko thi
// giá trị fe và pe tính bằng phút

await Subject.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Subject