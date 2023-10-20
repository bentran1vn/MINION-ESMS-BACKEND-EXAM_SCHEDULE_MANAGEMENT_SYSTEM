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
<<<<<<< HEAD
    disabled: {
        type: DataTypes.BOOLEAN,
        default: false,
    },
    ...SQLModel
=======
    status:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    //1 là hiện ra
    //0 là ko hiện ra
>>>>>>> b38dc7cbe4597c5db37f74aaa8dac383ff160a00
});

await Semester.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Semester