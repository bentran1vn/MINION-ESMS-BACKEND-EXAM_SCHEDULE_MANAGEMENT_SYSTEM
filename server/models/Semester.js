import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'semesters'

const Semester = sequelize.define( tableName , {
    season:{
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    year:{
        type: DataTypes.INTEGER,
        allowNull: false
    }

});
Semester.sync().then(()=> {
    console.log(`${tableName} table is created`);
})

export default Semester