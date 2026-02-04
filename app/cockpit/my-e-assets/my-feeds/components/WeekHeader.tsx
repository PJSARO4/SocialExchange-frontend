'use client';

interface WeekHeaderProps {
  dates: Date[];
}

export default function WeekHeader({ dates }: WeekHeaderProps) {
  return (
    <div className="week-header">
      {dates.map((date, index) => (
        <div key={index} className="week-header-day">
          <div className="week-header-name">
            {date.toLocaleDateString(undefined, { weekday: 'short' })}
          </div>
          <div className="week-header-date">
            {date.getDate()}
          </div>
        </div>
      ))}
    </div>
  );
}
