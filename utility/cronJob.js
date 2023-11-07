import { examPhaseCron, lecturerCron, semesterCron } from "../services/cronJobService.js";

export async function startCronJob() {
    try {
        await examPhaseCron() 
        await semesterCron()
        await lecturerCron()
    } catch (error) {
        console.log(error);
    }
}