import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Play, Timer } from "lucide-react";
import { Assignment } from "@/types";
import { WorksheetModal } from "./WorksheetModal";

interface EnhancedAssignmentCardProps {
  assignment: Assignment;
  onStartTimer?: (assignmentId: string) => void;
  onComplete?: (assignmentId: string) => void;
  isTimerActive?: boolean;
  elapsedTime?: number;
}

export function EnhancedAssignmentCard({
  assignment,
  onStartTimer,
  onComplete,
  isTimerActive,
  elapsedTime = 0
}: EnhancedAssignmentCardProps) {
  const [showWorksheet, setShowWorksheet] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openActivity = (assignment: Assignment) => {
    // Placeholder for activity opening logic
    console.log(`Opening ${assignment.interactiveType} activity for:`, assignment.title);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <Badge variant="secondary">{assignment.subject}</Badge>
          </div>
          {assignment.parentNotes && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              📝 {assignment.parentNotes}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Enrichment Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Speechify Link */}
            {assignment.speechifyUrl && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open(assignment.speechifyUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                🎧 Listen with Speechify
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            
            {/* Interactive Worksheet */}
            {assignment.worksheetQuestions && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowWorksheet(true)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                📝 Open Worksheet
              </Button>
            )}
            
            {/* Practice Activity */}
            {assignment.interactiveType && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => openActivity(assignment)}
                className="flex items-center gap-2"
              >
                🎮 Practice {assignment.interactiveType}
              </Button>
            )}

            {/* Printing Indicator */}
            {assignment.requiresPrinting && (
              <Badge variant="outline" className="flex items-center gap-1">
                🖨️ Print Required
              </Badge>
            )}
          </div>
          
          {/* Timer Section - Always Present */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="font-medium">Timer</span>
                {isTimerActive && (
                  <Badge variant="default">
                    {formatTime(elapsedTime)}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isTimerActive ? (
                  <Button
                    onClick={() => onStartTimer?.(assignment.id)}
                    size="sm"
                  >
                    Start Timer
                  </Button>
                ) : (
                  <Button
                    onClick={() => onComplete?.(assignment.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
            
            {assignment.timeSpent > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Total time spent: {Math.floor(assignment.timeSpent / 60)}h {assignment.timeSpent % 60}m
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Worksheet Modal */}
      {showWorksheet && assignment.worksheetQuestions && (
        <WorksheetModal
          assignment={assignment}
          onClose={() => setShowWorksheet(false)}
        />
      )}
    </>
  );
}