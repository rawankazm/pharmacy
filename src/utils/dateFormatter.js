export const formatDate = (date, language, t) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    if (language === 'ckb') {
        const days = [
            t('date.weekdays.sunday'),
            t('date.weekdays.monday'),
            t('date.weekdays.tuesday'),
            t('date.weekdays.wednesday'),
            t('date.weekdays.thursday'),
            t('date.weekdays.friday'),
            t('date.weekdays.saturday')
        ];
        const months = [
            t('date.months.january'),
            t('date.months.february'),
            t('date.months.march'),
            t('date.months.april'),
            t('date.months.may'),
            t('date.months.june'),
            t('date.months.july'),
            t('date.months.august'),
            t('date.months.september'),
            t('date.months.october'),
            t('date.months.november'),
            t('date.months.december')
        ];

        const dayName = days[d.getDay()];
        const day = d.getDate();
        const monthName = months[d.getMonth()];
        const year = d.getFullYear();

        // Format: Wednesday, 17 December 2025
        return `${dayName}، ${day} ${monthName} ${year}`;
    } else {
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
};

export const formatTime = (date, language) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    if (language === 'ckb') {
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'د.ن' : 'پ.ن';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minsFormatted = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minsFormatted} ${ampm}`;
    }

    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
