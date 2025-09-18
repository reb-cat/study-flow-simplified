import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDaySchedule } from '@/hooks/useDaySchedule';
import { useApp } from '@/context/AppContext';
import { Assignment } from '@/types';
import { format, addDays, startOfWeek } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface DragDropSchedulerProps {
  studentName: string;
  weekStart: Date;
}

export const DragDropScheduler: React.FC<DragDropSchedulerProps> = ({
  studentName,
  weekStart
}) => {
  const { 
    profiles, 
    getAssignmentsForProfile, 
    updateAssignment 
  } = useApp();

  const studentProfile = profiles.find(p => p.displayName === studentName);
  const studentAssignments = studentProfile ? getAssignmentsForProfile(studentProfile.id) : [];
  
  // Get unscheduled assignments (no scheduledDate or scheduledBlock)
  const unscheduledAssignments = studentAssignments.filter(
    a => !a.scheduledDate || !a.scheduledBlock
  );

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const assignmentId = draggableId;

    // If dropping into a day slot
    if (destination.droppableId.startsWith('day-')) {
      const [, dayIndex, blockNumber] = destination.droppableId.split('-');
      const targetDay = weekDays[parseInt(dayIndex)];
      const dateStr = format(targetDay, 'yyyy-MM-dd');

      updateAssignment(assignmentId, {
        scheduledDate: dateStr,
        scheduledBlock: parseInt(blockNumber)
      });
    }

    // If moving back to unscheduled
    if (destination.droppableId === 'unscheduled') {
      updateAssignment(assignmentId, {
        scheduledDate: undefined,
        scheduledBlock: undefined
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Week Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {weekDays.map((day, dayIndex) => (
            <DayColumn 
              key={dayIndex}
              day={day}
              dayIndex={dayIndex}
              studentName={studentName}
            />
          ))}
        </div>

        {/* Unscheduled Assignments Pool */}
        <Card>
          <CardHeader>
            <CardTitle>Unscheduled Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="unscheduled">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-24 p-4 rounded-lg border-2 border-dashed ${
                    snapshot.isDraggingOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25'
                  }`}
                >
                  {unscheduledAssignments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm">
                      All assignments scheduled! 🎉
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {unscheduledAssignments.map((assignment, index) => (
                        <DraggableAssignment
                          key={assignment.id}
                          assignment={assignment}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
};

interface DayColumnProps {
  day: Date;
  dayIndex: number;
  studentName: string;
}

const DayColumn: React.FC<DayColumnProps> = ({ day, dayIndex, studentName }) => {
  const schedule = useDaySchedule(studentName, day);
  const openBlocks = schedule.filter(block => block.blockType === 'assignment');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {format(day, 'EEEE')}
          <div className="text-sm font-normal text-muted-foreground">
            {format(day, 'MMM d')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {openBlocks.map((block) => (
          <Droppable 
            key={block.blockNumber}
            droppableId={`day-${dayIndex}-${block.blockNumber}`}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-16 p-2 rounded border ${
                  snapshot.isDraggingOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {block.startTime} - {block.endTime} • {block.subject}
                </div>
                
                {block.assignment ? (
                  <div className="bg-muted p-2 rounded text-xs">
                    <div className="font-medium">{block.assignment.title}</div>
                    <div className="text-muted-foreground">{block.assignment.subject}</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Drop assignment here
                  </div>
                )}
                
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </CardContent>
    </Card>
  );
};

interface DraggableAssignmentProps {
  assignment: Assignment;
  index: number;
}

const DraggableAssignment: React.FC<DraggableAssignmentProps> = ({ 
  assignment, 
  index 
}) => {
  return (
    <Draggable draggableId={assignment.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 bg-card border rounded-lg cursor-move ${
            snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{assignment.title}</h4>
              <p className="text-xs text-muted-foreground">{assignment.subject}</p>
              {assignment.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="ml-2">
              {assignment.subject}
            </Badge>
          </div>
        </div>
      )}
    </Draggable>
  );
};