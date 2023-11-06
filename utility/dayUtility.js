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
        // Parse the input date string in ISO 8601 format
        const isoDate = new Date(dateStr);

        // Extract day, month, and year from the ISO date
        const day = isoDate.getUTCDate();
        const month = isoDate.getUTCMonth() + 1; // Adding 1 to adjust for 0-based months
        const year = isoDate.getUTCFullYear();

        // Create a new date object using the extracted components
        const date = new Date(Date.UTC(year, month - 1, day)); // JavaScript months are 0-based

        // Add or subtract the specified number of days
        if (type === 1) {
            date.setUTCDate(date.getUTCDate() + daysToChange);
        } else {
            date.setUTCDate(date.getUTCDate() - daysToChange);
        }

        // Format the new date as a string in the "dd/mm/yyyy" format
        const newDay = date.getUTCDate();
        const newMonth = date.getUTCMonth() + 1; // Adding 1 to adjust for 0-based months
        const newYear = date.getUTCFullYear();
        const newDateStr = `${newYear}/${newMonth}/${newDay}`;

        return newDateStr;
    } catch (error) {
        return "Invalid date format. Please use the format dd/mm/yyyy.";
    }
}