'use client';

interface Props {
  dates: Date[];
}

export default function WeekHeader({ dates }: Props) {
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="week-header">
      <div className="week-header-time-column">TIME</div>
      {dates.map((date, index) => (
        <div key={index} className={`week-header-day ${isToday(date) ? 'today' : ''}`}>
          <div className="week-header-day-name">{dayNames[index]}</div>
          <div className="week-header-day-date">
            {monthNames[date.getMonth()]} {date.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
}