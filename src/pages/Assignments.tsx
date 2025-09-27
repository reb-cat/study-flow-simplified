import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { Assignment } from '@/types';
import { toast } from '@/hooks/use-toast';
import { OverviewBlock } from '@/components/OverviewBlock';

const Assignments = () => {
  const { 
    selectedProfile, 
    getAssignmentsForProfile, 
    addAssignment, 
    updateAssignment, 
    deleteAssignment,
    startTimer
  } = useApp();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  const profileAssignments = getAssignmentsForProfile(selectedProfile.id);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStartTimer = (assignmentId: string) => {
    startTimer(assignmentId, selectedProfile.id);
    toast({ title: 'Timer started' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Assignments</h1>
            <p className="text-muted-foreground">
              Track your progress and stay organized
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <AssignmentForm
                onSave={(data) => {
                  addAssignment({
                    profileId: selectedProfile.id,
                    title: data.title || '',
                    subject: data.subject || '',
                    dueDate: data.dueDate || '',
                    scheduledDate: data.scheduledDate,
                    scheduledBlock: data.scheduledBlock,
                    completed: false,
                    timeSpent: 0,
                    canvasUrl: data.canvasUrl
                  });
                  setIsAddDialogOpen(false);
                  toast({ title: 'Assignment added! 🎉' });
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-primary border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{profileAssignments.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-timer/5 to-timer/10 border-timer/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-timer">{profileAssignments.filter(a => !a.completed).length}</div>
              <div className="text-sm text-muted-foreground">To Do</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-success border-success/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{profileAssignments.filter(a => a.completed).length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {profileAssignments.length > 0 ? (
            profileAssignments.map((assignment) => (
              <OverviewBlock
                key={assignment.id}
                assignment={assignment}
                onEdit={(assignment) => {
                  // Handle edit if needed
                }}
                onDelete={(assignmentId) => {
                  const confirmDelete = window.confirm('Delete this assignment? This can\'t be undone.');
                  if (confirmDelete) {
                    deleteAssignment(assignmentId);
                    toast({ title: 'Assignment deleted' });
                  }
                }}
                onStartTimer={handleStartTimer}
              />
            ))
          ) : (
            <Card className="bg-muted/10 border-dashed border-2">
              <CardContent className="p-12 text-center">
                <div className="max-w-sm mx-auto">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    Ready to get started?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first assignment and start building momentum!
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </main>
    </div>
  );
};

interface AssignmentFormProps {
  onSave: (data: {
    title: string;
    subject: string;
    dueDate: string;
    scheduledDate?: string;
    scheduledBlock?: number;
    canvasUrl?: string;
  }) => void;
  onCancel: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    dueDate: '',
    scheduledDate: '',
    scheduledBlock: '',
    canvasUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ 
        title: 'Please fill required fields',
        variant: 'destructive'
      });
      return;
    }

    onSave({
      title: formData.title,
      subject: formData.subject,
      dueDate: formData.dueDate,
      scheduledDate: formData.scheduledDate || undefined,
      scheduledBlock: formData.scheduledBlock ? parseInt(formData.scheduledBlock) : undefined,
      canvasUrl: formData.canvasUrl || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-xl">
          Add New Assignment
        </DialogTitle>
        <DialogDescription>
          Create a new assignment to stay organized
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter assignment title"
            required
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="e.g., Math, English, Science"
          />
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="scheduledDate">Scheduled Day</Label>
          <Input
            id="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="scheduledBlock">Block #</Label>
          <Input
            id="scheduledBlock"
            type="number"
            min="1"
            max="4"
            value={formData.scheduledBlock}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledBlock: e.target.value }))}
            placeholder="Enter block number (1-4)"
          />
        </div>

        <div>
          <Label htmlFor="canvasUrl">Canvas Link (optional)</Label>
          <Input
            id="canvasUrl"
            type="url"
            value={formData.canvasUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, canvasUrl: e.target.value }))}
            placeholder="https://canvas.example.com/..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Assignment
        </Button>
      </DialogFooter>
    </form>
  );
};

export default Assignments;