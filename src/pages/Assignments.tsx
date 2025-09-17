import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Search } from 'lucide-react';
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

  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!selectedProfile) {
    return <div>Loading...</div>;
  }

  const profileAssignments = getAssignmentsForProfile(selectedProfile.id);
  
  const filteredAssignments = profileAssignments.filter(assignment => {
    if (filter === 'todo') return !assignment.completed;
    if (filter === 'done') return assignment.completed;
    return true;
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm('Delete this assignment? This can\'t be undone.');
    if (confirmDelete) {
      deleteAssignment(assignmentId);
      toast({ title: 'Assignment deleted' });
    }
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
              <Button className="gap-2 bg-primary hover:bg-primary-hover">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{profileAssignments.filter(a => a.completed).length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="todo" className="flex items-center gap-2">
                To-Do
              </TabsTrigger>
              <TabsTrigger value="done" className="flex items-center gap-2">
                Done
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="space-y-4">
            {filteredAssignments.length > 0 ? (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => (
                  <OverviewBlock
                    key={assignment.id}
                    assignment={assignment}
                    onUpdate={() => {
                      // Force re-render by updating filter state
                      setFilter(filter);
                    }}
                    onEdit={(assignment) => {
                      setEditingAssignment(assignment);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={handleDeleteAssignment}
                    onStartTimer={handleStartTimer}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-muted/20 to-muted/5 border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <div className="max-w-sm mx-auto">
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      {filter === 'all' ? 'Ready to get started?' : 
                       filter === 'todo' ? 'All caught up!' : 
                       'Nothing completed yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {filter === 'all' ? 'Add your first assignment and start building momentum!' : 
                       filter === 'todo' ? 'Great work! You\'ve completed all your assignments.' : 
                       'Complete your first assignment to see it here'}
                    </p>
                    {filter === 'all' && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Your First Assignment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <AssignmentForm
              assignment={editingAssignment}
              onSave={(data) => {
                if (editingAssignment) {
                  updateAssignment(editingAssignment.id, data);
                  setIsEditDialogOpen(false);
                  setEditingAssignment(null);
                  toast({ title: 'Assignment updated! ✨' });
                }
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingAssignment(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

interface AssignmentFormProps {
  assignment?: Assignment | null;
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

const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    subject: assignment?.subject || '',
    dueDate: assignment?.dueDate || '',
    scheduledDate: assignment?.scheduledDate || '',
    scheduledBlock: assignment?.scheduledBlock?.toString() || '',
    canvasUrl: assignment?.canvasUrl || ''
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
          {assignment ? 'Edit Assignment' : 'Add New Assignment'}
        </DialogTitle>
        <DialogDescription>
          {assignment ? 'Update your assignment details' : 'Create a new assignment to stay organized'}
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
          <Select value={formData.scheduledBlock} onValueChange={(value) => setFormData(prev => ({ ...prev, scheduledBlock: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Block 1</SelectItem>
              <SelectItem value="2">Block 2</SelectItem>
              <SelectItem value="3">Block 3</SelectItem>
              <SelectItem value="4">Block 4</SelectItem>
            </SelectContent>
          </Select>
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
          {assignment ? 'Update' : 'Create'} Assignment
        </Button>
      </DialogFooter>
    </form>
  );
};

export default Assignments;