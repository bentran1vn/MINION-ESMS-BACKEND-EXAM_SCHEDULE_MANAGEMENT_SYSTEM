export function validDay(startDay, endDay, day) {
    let dayFomatted = new Date(day)
    let start = new Date(startDay)
    let end = new Date(endDay)

    if (start.getFullYear() == dayFomatted.getFullYear()) {
        if (start.getMonth() == dayFomatted.getMonth()) {
            if (start.getDate() <= dayFomatted.getDate() && end.getDate() >= dayFomatted.getDate()) {
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

export function modiDays(dateStr, daysToChange, type) {
    try {
        // Parse the input date string in the format "dd/mm/yyyy"
        const [day, month, year] = dateStr.split('/').map(Number);
        const date = new Date(year, month - 1, day); // JavaScript months are 0-based

        // Add the specified number of days
        if (type == 1) {
            date.setDate(date.getDate() + daysToChange);
        } else {
            date.setDate(date.getDate() - daysToChange);
        }


        // Format the new date as a string in the "dd/mm/yyyy" format
        const newDay = date.getDate();
        const newMonth = date.getMonth() + 1; // Adding 1 to adjust for 0-based months
        const newYear = date.getFullYear();
        const newDateStr = `${newDay}/${newMonth}/${newYear}`;

        return newDateStr;
    } catch (error) {
        return "Invalid date format. Please use the format dd/mm/yyyy.";
    }
}