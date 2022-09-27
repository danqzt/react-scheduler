import { ProcessedEvent } from "../../types";
import EventItem from "./EventItem";
import { differenceInMinutes, setHours } from "date-fns";
import { traversCrossingEvents } from "../../helpers/generals";
import { BORDER_HEIGHT} from "../../helpers/constants";
import { Fragment } from "react";

interface RoomEventsProps {
  todayEvents: ProcessedEvent[];
  today: Date;
  startHour: number;
  step: number;
  minuteHeight: number;
  direction: "rtl" | "ltr";
}
const RoomEvents = ({
  todayEvents,
  today,
  startHour,
  step,
  minuteHeight,
  direction,
}: RoomEventsProps) => {
  const crossingIds: Array<number | string> = [];

  return (
    <Fragment>
      {todayEvents.map((event, i) => {
        const eventLength = differenceInMinutes(event.end, event.start)/30 + 1;
        const minituesFromTop = differenceInMinutes(
          event.start,
          setHours(today, startHour)
        );
        //const topSpace = minituesFromTop * minuteHeight; //+ headerHeight;
        /**
         * Add border height since grid has a 1px border
         */
        const slotsFromTop = minituesFromTop / step;

        const borderFactor = slotsFromTop + BORDER_HEIGHT;
        //const top = topSpace + borderFactor;

        const crossingEvents = traversCrossingEvents(todayEvents, event);
        const alreadyRendered = crossingEvents.filter((e) =>
          crossingIds.includes(e.event_id)
        );
        crossingIds.push(event.event_id);
        const topSpace = event.room_id * minuteHeight;
        return (
          <div
            key={event.event_id}
            className="rs__event__item"
            style={{
              //height,
              top: topSpace,
              width: `${100 * eventLength}%`,
              // width: crossingEvents.length
              //   ? `${100 / (crossingEvents.length + 1)}%`
              //   : "95%", //Leave some space to click cell
              // [direction === "rtl" ? "right" : "left"]:
              //   alreadyRendered.length > 0
              //     ? `calc(100%/${alreadyRendered.length + 1})`
              //     : "",
            }}
          >
            <EventItem event={event} />
          </div>
        );
      })}
    </Fragment>
  );
};

export default RoomEvents;
