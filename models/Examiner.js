import sequelize from "../database/database.js";
import { DataTypes } from "sequelize";
import User from "./User.js";

let tableName = 'examiners'

const Examiner = sequelize.define(tableName, {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    exName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    exEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    typeExaminer: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    //0 là lecturer
    //1 là staff
    //2 là voluteer
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }, 
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
    }
    //0 còn 
    //1 xóa
});

User.hasOne(Examiner, { foreignKey: 'userId' });
Examiner.belongsTo(User, { foreignKey: 'userId' });

await Examiner.sync().then(() => {
    console.log(`${tableName} table is ready`);
})

export default Examiner