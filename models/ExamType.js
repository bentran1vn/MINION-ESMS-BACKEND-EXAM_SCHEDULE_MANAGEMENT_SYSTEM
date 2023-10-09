import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";

let tableName = 'examTypes'

const ExamType = sequelize.define( tableName , {
    type:{
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    block:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    des: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    //des = 0 normal
    //des = 1 coursera
});


ExamType.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default ExamType