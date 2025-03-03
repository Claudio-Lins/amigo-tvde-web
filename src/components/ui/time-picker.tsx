"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { set, startOfDay } from "date-fns";
import { useState } from "react";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  minuteStep?: number;
}

export function TimePicker({ date, setDate, minuteStep = 15 }: TimePickerProps) {
  const baseDate = startOfDay(new Date());
  const [selectedHour, setSelectedHour] = useState(date ? date.getHours() : 0);
  const [selectedMinute, setSelectedMinute] = useState(
    date ? Math.floor(date.getMinutes() / minuteStep) * minuteStep : 0
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from(
    { length: 60 / minuteStep },
    (_, i) => i * minuteStep
  );

  function handleHourClick(hour: number) {
    setSelectedHour(hour);
    const newDate = set(date || baseDate, { hours: hour, minutes: selectedMinute });
    setDate(newDate);
  }

  function handleMinuteClick(minute: number) {
    setSelectedMinute(minute);
    const newDate = set(date || baseDate, { hours: selectedHour, minutes: minute });
    setDate(newDate);
  }

  return (
    <div className="flex border rounded-md">
      <div className="border-r">
        <ScrollArea className="h-72 w-16">
          <div className="p-1">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant="ghost"
                className={cn(
                  "w-full justify-center",
                  selectedHour === hour && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleHourClick(hour)}
              >
                {hour.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <ScrollArea className="h-72 w-16">
          <div className="p-1">
            {minutes.map((minute) => (
              <Button
                key={minute}
                variant="ghost"
                className={cn(
                  "w-full justify-center",
                  selectedMinute === minute && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleMinuteClick(minute)}
              >
                {minute.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 