import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'examiners'

const Examiner = sequelize.define( tableName , {
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: User,
            key: 'id'
        }
    },
    typeExaminer: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    //0 là lecturer
    //2 là staff
    //3 là voluteer
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }, 
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    }   
    //0 is not busy
    //1 is busy
});

User.hasOne(Examiner, { foreignKey: 'userId' });
Examiner.belongsTo(User, { foreignKey: 'userId' });

await Examiner.sync().then(()=> {
    console.log(`${tableName} table is ready`);
})

export default Examiner