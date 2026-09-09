'use client';

type CalendarDayHeaderProps = { label: string; date: Date; isToday: boolean };

export default function CalendarDayHeader({ label, date, isToday }: CalendarDayHeaderProps) {
  return (
    <div className={`calendar-day-header${isToday ? ' calendar-day-header--today' : ''}`}>
      <span className="calendar-day-header__label">{label}</span>
      <span className="calendar-day-header__number">{date.getDate()}</span>
    </div>
  );
}
