export function validDay(startDay, endDay, day){
    let dayFomatted = new Date(day).getDate()
    let start = new Date(startDay).getDate()
    let end = new Date(endDay).getDate()
    if(start < dayFomatted && end > dayFomatted) return true
    return false
}