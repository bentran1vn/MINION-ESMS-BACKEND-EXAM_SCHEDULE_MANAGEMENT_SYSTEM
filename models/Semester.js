import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import SQLModel from '../common/SQLModel.js'

let tableName = 'semesters'

const Semester = sequelize.define( tableName , {
    season:{
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    start:{
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    end:{
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    disabled: {
        type: DataTypes.BOOLEAN,
        default: false,
    },
    ...SQLModel
});

await Semester.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Semester