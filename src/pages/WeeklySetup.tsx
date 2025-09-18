import React from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, addDays } from "date-fns";
import { DragDropScheduler } from "@/components/DragDropScheduler";

export default function WeeklySetup() {
  const { selectedProfile } = useApp();
  const [selectedWeek, setSelectedWeek] = React.useState(new Date());

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });

  if (!selectedProfile) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Weekly Setup</h1>
        <div>Please select a profile first.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Weekly Setup</h1>
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
          >
            Previous Week
          </Button>
          <span className="font-medium">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </span>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
          >
            Next Week
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Assignment Scheduler</h2>
          <p className="text-muted-foreground mb-4">
            Drag assignments from the unscheduled pool to schedule template blocks for {selectedProfile.displayName}.
          </p>
          <DragDropScheduler studentName={selectedProfile.displayName} weekStart={weekStart} />
        </CardContent>
      </Card>
    </div>
  );
}