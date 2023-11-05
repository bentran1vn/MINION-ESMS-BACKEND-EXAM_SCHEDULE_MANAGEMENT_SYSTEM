import { examPhaseCron, semesterCron } from "../services/cronJobService.js";

export async function startCronJob() {
    try {
        await examPhaseCron() 
        await semesterCron();
    } catch (error) {
        console.log(error);
    }
}