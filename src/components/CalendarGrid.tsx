import { useEffect, useState } from "react";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { ListView } from "./views/ListView";

export type CalendarView = "month" | "week" | "list";

const KEY = "calendarView";

export const useCalendarView = () => {
  const [view, setViewState] = useState<CalendarView>("month");
  useEffect(() => {
    const v = localStorage.getItem(KEY) as CalendarView | null;
    if (v === "month" || v === "week" || v === "list") setViewState(v);
  }, []);
  const setView = (v: CalendarView) => {
    setViewState(v);
    localStorage.setItem(KEY, v);
  };
  return { view, setView };
};

interface Props {
  view: CalendarView;
}

export const CalendarGrid = ({ view }: Props) => {
  if (view === "week") return <WeekView />;
  if (view === "list") return <ListView />;
  return <MonthView />;
};
