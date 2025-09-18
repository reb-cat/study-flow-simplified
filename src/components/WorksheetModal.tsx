import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Assignment } from "@/types";
import { Download } from "lucide-react";

interface WorksheetModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export function WorksheetModal({ assignment, onClose }: WorksheetModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Parse questions from the assignment
  const questions = typeof assignment.worksheetQuestions === 'string'
    ? assignment.worksheetQuestions.split('\n').filter(q => q.trim())
    : [];

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
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
            {questions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No worksheet questions available for this assignment.
              </div>
            ) : (
              questions.map((question, index) => (
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
              ))
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportAsText}
              className="flex items-center gap-2"
              disabled={questions.length === 0}
            >
              <Download className="w-4 h-4" />
              Export as Text
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}