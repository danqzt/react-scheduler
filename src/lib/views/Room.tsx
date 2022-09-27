import { useEffect, useCallback, Fragment } from "react";
import { Typography } from "@mui/material";
import {
  startOfWeek,
  addDays,
  format,
  eachMinuteOfInterval,
  isToday,
  setMinutes,
  setHours,
  endOfDay,
  startOfDay,
  addMinutes,
  isSameMinute,
} from "date-fns";
import { useAppState } from "../hooks/useAppState";
import {
  CellRenderedProps,
  DayHours,
  DefaultRecourse,
} from "../types";
import { WeekDays } from "./Month";
import {
  calcCellHeight,
  getResourcedEvents,
} from "../helpers/generals";
import { WithResources } from "../components/common/WithResources";
import { Cell } from "../components/common/Cell";
import { TableGrid } from "../styles/styles";
import { MULTI_DAY_EVENT_HEIGHT } from "../helpers/constants";
import RoomEvents from "../components/events/RoomEvents";

export interface RoomProps {
  weekDays: WeekDays[];
  weekStartOn: WeekDays;
  startHour: DayHours;
  endHour: DayHours;
  step: number;
  cellRenderer?(props: CellRenderedProps): JSX.Element;
}

const Room = () => {
  const {
    room,
    selectedDate,
    height,
    events,
    triggerDialog,
    remoteEvents,
    triggerLoading,
    handleState,
    resources,
    resourceFields,
    fields,
    direction,
    locale,
  } = useAppState();

  const { weekStartOn, weekDays, startHour, endHour, step, cellRenderer } =
    room!;
  const _weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartOn });
  const daysList = weekDays.map((d) => addDays(_weekStart, d));
  const weekStart = startOfDay(daysList[0]);
  const weekEnd = endOfDay(daysList[daysList.length - 1]);
  const START_TIME = setMinutes(setHours(selectedDate, startHour), 0);
  const END_TIME = setMinutes(setHours(selectedDate, endHour), 0);
  const hours = eachMinuteOfInterval(
    {
      start: START_TIME,
      end: END_TIME,
    },
    { step: step }
  );
  const CELL_HEIGHT = calcCellHeight(height, hours.length);
  const MULTI_SPACE = MULTI_DAY_EVENT_HEIGHT;

  const fetchEvents = useCallback(async () => {
    try {
      triggerLoading(true);
      const query = `?start=${weekStart}&end=${weekEnd}`;
      const events = await remoteEvents!(query);
      if (Array.isArray(events)) {
        handleState(events, "events");
      }
    } catch (error) {
      throw error;
    } finally {
      triggerLoading(false);
    }
    // eslint-disable-next-line
  }, [selectedDate]);

  useEffect(() => {
    if (remoteEvents instanceof Function) {
      fetchEvents();
    }
    // eslint-disable-next-line
  }, [fetchEvents]);

  
  const renderTable = (resource?: DefaultRecourse) => {
    let recousedEvents = events;
    if (resource) {
      recousedEvents = getResourcedEvents(
        events,
        resource,
        resourceFields,
        fields
      );
    }

   
    // Equalizing multi-day section height
    const headerHeight = MULTI_SPACE * 1 + 45;
    const rooms = ["Auditorium", "Audio Visual", "Sunday School"];
    return (
      <TableGrid days={hours.length}>
        {/* Header days */}
        <span className="rs__cell"></span>
        {hours.map((date, i) => (
          <span
            key={i}
            className={`rs__cell rs__header ${
              isToday(date) ? "rs__today_cell" : ""
            }`}
            style={{ height: headerHeight }}
          >
           <Typography variant="caption">
                {format(date, "hh:mm a", { locale: locale })}
              </Typography>
            {/* <TodayTypo date={date} onClick={handleGotoDay} locale={locale}/>  */}
            {/* {renderMultiDayEvents(recousedEvents, date)} */}
          </span>
        ))}

        {/* Time Cells */}
        {rooms.map((room, i) => (
          <Fragment key={i}>
            <span
              style={{ height: CELL_HEIGHT }}
              className="rs__cell rs__header rs__time"
            >
              <Typography variant="caption">
               {room}
              </Typography>
            </span>
            {hours.map((date, ii) => {
              const start = new Date(
                `${format(date, "yyyy/MM/dd")} ${format(date, "hh:mm a")}`
              );
              const end = new Date(
                `${format(date, "yyyy/MM/dd")} ${format(
                  addMinutes(date, step),
                  "hh:mm a"
                )}`
              );
              const field = resourceFields.idField;
              return (
                <span
                  key={ii}
                  className={`rs__cell ${
                    isToday(date) ? "rs__today_cell" : ""
                  }`}
                >
                  {/* Events of each day - run once on the top hour column */}
                  {i === 0 && (
                    <RoomEvents
                      todayEvents={recousedEvents
                        .filter(
                          (e) =>
                            isSameMinute(date, e.start) 
                        )
                        .sort((a, b) => a.end.getTime() - b.end.getTime())}
                      today={date}
                      minuteHeight={CELL_HEIGHT}
                      startHour={startHour}
                      step={step}
                      direction={direction}
                    />
                  )}
                  
                  {cellRenderer ? (
                    cellRenderer({
                      day: date,
                      start,
                      end,
                      height: CELL_HEIGHT,
                      onClick: () =>
                        triggerDialog(true, {
                          start,
                          end,
                          [field]: resource ? resource[field] : null,
                        }),
                      [field]: resource ? resource[field] : null,
                    })
                  ) : (
                    <Cell
                      start={start}
                      end={end}
                      resourceKey={field}
                      resourceVal={resource ? resource[field] : null}
                    />
                  )}
                </span>
              );
            })}
          </Fragment>
        ))}
      </TableGrid>
    );
  };
  return resources.length ? (
    <WithResources renderChildren={renderTable} />
  ) : (
    renderTable()
  );
};

export { Room };
