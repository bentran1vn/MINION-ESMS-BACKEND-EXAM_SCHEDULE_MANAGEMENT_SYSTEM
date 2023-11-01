export function validDay(startDay, endDay, day){
    let dayFomatted = new Date(day)
    let start = new Date(startDay)
    let end = new Date(endDay)

    if(start.getFullYear() == dayFomatted.getFullYear()){
        if(start.getMonth() == dayFomatted.getMonth()) {
            if(start.getDate() < dayFomatted.getDate() && end.getDate() > dayFomatted.getDate()){
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    } else {
        return false
    } 
}