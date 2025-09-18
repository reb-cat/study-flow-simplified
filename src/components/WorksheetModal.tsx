import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Assignment } from "@/types";
import { Download, Save } from "lucide-react";

interface WorksheetModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export function WorksheetModal({ assignment, onClose }: WorksheetModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Parse questions from the assignment
  const questions = typeof assignment.worksheetQuestions === 'string'
    ? assignment.worksheetQuestions.split('\n').filter(q => q.trim())
    : [];

  useEffect(() => {
    loadExistingAnswers();
  }, [assignment.id]);

  const loadExistingAnswers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('worksheet_answers')
        .select('answers')
        .eq('assignment_id', assignment.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.answers) {
        setAnswers(data.answers as Record<string, string>);
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const saveAnswers = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('worksheet_answers')
        .upsert({
          assignment_id: assignment.id,
          user_id: user.id,
          answers: answers,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'assignment_id,user_id'
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your worksheet answers have been saved.",
      });
    } catch (error) {
      console.error('Error saving answers:', error);
      toast({
        title: "Error",
        description: "Failed to save answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportAsText = () => {
    let content = `${assignment.title}\n`;
    content += `Subject: ${assignment.subject}\n`;
    content += `Due: ${new Date(assignment.dueDate).toLocaleDateString()}\n\n`;
    
    questions.forEach((question, index) => {
      content += `${question}\n`;
      content += `Answer: ${answers[index] || '[Not answered]'}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_worksheet.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Worksheet exported as text file.",
    });
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex justify-center items-center h-32">
            <div>Loading worksheet...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            📝 {assignment.title} - Worksheet
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  {question}
                </Label>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportAsText}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as Text
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={saveAnswers}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Answers'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}