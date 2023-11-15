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
    status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
    //1 là hiện ra
    //0 là ko hiện ra  
});

await Subject.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Subject