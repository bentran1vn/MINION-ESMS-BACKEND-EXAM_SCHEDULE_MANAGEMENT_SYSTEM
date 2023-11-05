import cron from "node-cron";
import { courseCron, examPhaseCron, semesterCron } from "../services/cronJobService.js";

export async function startCronJob() {
    try {
        await examPhaseCron() 
        await semesterCron();
    } catch (error) {
        console.log(error);
    }
}