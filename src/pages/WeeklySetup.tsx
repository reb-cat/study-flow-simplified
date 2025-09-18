import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  scheduled_date?: string;
  speechify_url?: string;
  worksheet_questions?: any;
  interactive_type?: string;
  parent_notes?: string;
  requires_printing?: boolean;
}

export default function WeeklySetup() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { toast } = useToast();

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  useEffect(() => {
    fetchWeekAssignments();
  }, [selectedWeek]);

  const fetchWeekAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .gte('due_date', weekStart.toISOString())
        .lte('due_date', weekEnd.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments for this week",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = (id: string, field: string, value: any) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === id 
          ? { ...assignment, [field]: value }
          : assignment
      )
    );
  };

  const saveEnrichments = async () => {
    try {
      setSaving(true);
      
      for (const assignment of assignments) {
        const { error } = await supabase
          .from('assignments')
          .update({
            speechify_url: assignment.speechify_url,
            worksheet_questions: assignment.worksheet_questions ? JSON.parse(assignment.worksheet_questions as string) : null,
            interactive_type: assignment.interactive_type,
            parent_notes: assignment.parent_notes,
            requires_printing: assignment.requires_printing,
          })
          .eq('id', assignment.id);

        if (error) throw error;
      }

      toast({
        title: "Success!",
        description: "Week setup saved successfully",
      });
    } catch (error) {
      console.error('Error saving enrichments:', error);
      toast({
        title: "Error",
        description: "Failed to save week setup",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAssignmentsByDay = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayAssignments = assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.due_date);
        return assignmentDate.toDateString() === day.toDateString();
      });
      
      if (dayAssignments.length > 0) {
        days.push({
          date: day,
          assignments: dayAssignments
        });
      }
    }
    return days;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Weekly Setup</h1>
        <div>Loading assignments...</div>
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

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No assignments found for this week.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {getAssignmentsByDay().map(({ date, assignments: dayAssignments }) => (
              <div key={date.toISOString()}>
                <h2 className="text-xl font-semibold mb-4">
                  {format(date, 'EEEE, MMM d')}
                </h2>
                <div className="grid gap-4">
                  {dayAssignments.map(assignment => (
                    <Card key={assignment.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <Badge variant="secondary">{assignment.subject}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`speechify-${assignment.id}`}>
                              Speechify Link (optional)
                            </Label>
                            <Input
                              id={`speechify-${assignment.id}`}
                              placeholder="https://speechify.app.link/..."
                              value={assignment.speechify_url || ''}
                              onChange={(e) => updateAssignment(assignment.id, 'speechify_url', e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Paste link from Speechify library
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`interactive-${assignment.id}`}>
                              Add Practice Activity
                            </Label>
                            <Select
                              value={assignment.interactive_type || 'none'}
                              onValueChange={(value) => updateAssignment(assignment.id, 'interactive_type', value === 'none' ? '' : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select activity type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="vocabulary">Vocabulary Cards</SelectItem>
                                <SelectItem value="grammar">Grammar Check</SelectItem>
                                <SelectItem value="comprehension">Reading Questions</SelectItem>
                                <SelectItem value="timeline">History Timeline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`questions-${assignment.id}`}>
                            Main Questions (paste from worksheet)
                          </Label>
                          <Textarea
                            id={`questions-${assignment.id}`}
                            placeholder="1. What were the four issues?&#10;2. When did the Convention meet?"
                            rows={4}
                            value={typeof assignment.worksheet_questions === 'string' ? assignment.worksheet_questions : ''}
                            onChange={(e) => updateAssignment(assignment.id, 'worksheet_questions', e.target.value)}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Just the key questions Khalil needs to answer
                          </p>
                        </div>

                        <div>
                          <Label htmlFor={`notes-${assignment.id}`}>
                            Notes for Supervision
                          </Label>
                          <Input
                            id={`notes-${assignment.id}`}
                            placeholder="Needs help with question 3"
                            value={assignment.parent_notes || ''}
                            onChange={(e) => updateAssignment(assignment.id, 'parent_notes', e.target.value)}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`print-${assignment.id}`}
                            checked={assignment.requires_printing || false}
                            onCheckedChange={(checked) => updateAssignment(assignment.id, 'requires_printing', checked)}
                          />
                          <Label htmlFor={`print-${assignment.id}`}>
                            Need to print this
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={saveEnrichments}
              disabled={saving}
              size="lg"
            >
              {saving ? 'Saving...' : 'Save Week Setup'}
            </Button>
          </div>

          {/* Drag-Drop Scheduler */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Weekly Assignment Scheduler</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Assign your enriched assignments to specific time blocks. The schedule template provides the structure.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Schedule Template Structure</h3>
              <p className="text-sm text-muted-foreground">
                Each student has a weekly template with fixed blocks (Co-op, Bible, Lunch) and open assignment blocks. 
                During weekly setup, you assign specific assignments to the open blocks.
              </p>
            </div>

            {/* Simple Assignment Scheduler */}
            <div className="space-y-6">
              {/* Week Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {getAssignmentsByDay().map(({ date, assignments: dayAssignments }) => (
                  <Card key={date.toISOString()}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {format(date, 'EEEE')}
                        <div className="text-sm font-normal text-muted-foreground">
                          {format(date, 'MMM d')}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayAssignments.map(assignment => (
                        <div key={assignment.id} className="p-2 bg-muted rounded text-xs">
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-muted-foreground">{assignment.subject}</div>
                          {assignment.scheduled_date && (
                            <div className="text-muted-foreground">Block {assignment.scheduled_date}</div>
                          )}
                        </div>
                      ))}
                      {dayAssignments.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-4">
                          No assignments scheduled
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}