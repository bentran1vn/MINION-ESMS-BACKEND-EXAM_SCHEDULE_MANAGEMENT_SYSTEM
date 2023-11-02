import cron from "node-cron";
import { courseCron, examPhaseCron, semesterCron } from "../services/cronJobService.js";

export async function startCronJob() {
    const jobCourse = cron.schedule(
        '0 */30 * * * *',
        async () => {
            await courseCron();
            console.log('Cron jub runing...');
        },
        {
            scheduled: true,
            timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng     
        }
    );
    const jobPhase = cron.schedule(
        '0 */30 * * * *',
        async () => {
            await examPhaseCron();
            console.log('Cron jub runing...');
        },
        {
            scheduled: true,
            timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng     
        }
    ); 
    const jobSemester = new cron.schedule(
        '0 */30 * * * *',
        async () => {
            await semesterCron();
            console.log('Cron jub runing...');
        },
        {
            scheduled: true,
            timeZone: 'Asia/Ho_Chi_Minh' // Lưu ý set lại time zone cho đúng     
        }
    );

    jobCourse.start();
    jobPhase.start();
    jobSemester.start();
}