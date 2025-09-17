import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Timer, ExternalLink } from 'lucide-react';
import { Assignment } from '@/types';
import { toast } from '@/hooks/use-toast';

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
    deleteAssignment(assignmentId);
    toast({ title: 'Assignment deleted successfully' });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">
              Manage your assignments and track progress
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  toast({ title: 'Assignment created successfully' });
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({profileAssignments.length})</TabsTrigger>
            <TabsTrigger value="todo">To-Do ({profileAssignments.filter(a => !a.completed).length})</TabsTrigger>
            <TabsTrigger value="done">Done ({profileAssignments.filter(a => a.completed).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredAssignments.length > 0 ? (
              <div className="grid gap-4">
                {filteredAssignments.map((assignment) => (
                  <Card key={assignment.id} className="card-elevated">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{assignment.title}</h3>
                            <Badge className={assignment.completed ? 'status-done' : 'status-todo'}>
                              {assignment.completed ? 'Done' : 'To-Do'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><strong>Subject:</strong> {assignment.subject}</p>
                            {assignment.dueDate && (
                              <p><strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</p>
                            )}
                            {assignment.scheduledDate && (
                              <p><strong>Scheduled:</strong> {new Date(assignment.scheduledDate).toLocaleDateString()}</p>
                            )}
                            {assignment.scheduledBlock && (
                              <p><strong>Block:</strong> {assignment.scheduledBlock}</p>
                            )}
                            <p><strong>Time Spent:</strong> {formatTime(assignment.timeSpent)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartTimer(assignment.id)}
                            className="gap-2"
                          >
                            <Timer className="w-4 h-4" />
                            Start Timer
                          </Button>

                          {assignment.canvasUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={assignment.canvasUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAssignment(assignment);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete this assignment? This can't be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-elevated">
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {filter === 'all' ? 'No assignments yet' : 
                     filter === 'todo' ? 'No pending assignments' : 
                     'No completed assignments'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {filter === 'all' ? 'Add your first assignment to get started' : 
                     filter === 'todo' ? 'All caught up! Great work.' : 
                     'Complete some assignments to see them here'}
                  </p>
                  {filter === 'all' && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <AssignmentForm
              assignment={editingAssignment}
              onSave={(data) => {
                if (editingAssignment) {
                  updateAssignment(editingAssignment.id, data);
                  setIsEditDialogOpen(false);
                  setEditingAssignment(null);
                  toast({ title: 'Assignment updated successfully' });
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
        <DialogTitle>
          {assignment ? 'Edit Assignment' : 'New Assignment'}
        </DialogTitle>
        <DialogDescription>
          {assignment ? 'Update assignment details' : 'Add a new assignment to your schedule'}
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