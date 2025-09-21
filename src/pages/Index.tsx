import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            StudyFlow Scheduler
          </h1>
          <p className="text-xl text-muted-foreground">
            Charlotte Mason inspired homeschool scheduling with family-based learning blocks
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="p-4 rounded-lg border space-y-2">
            <Calendar className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-semibold">Fixed Patterns</h3>
            <p className="text-sm text-muted-foreground">
              Analytical → Humanities → Composition → Creative rotation
            </p>
          </div>
          
          <div className="p-4 rounded-lg border space-y-2">
            <Clock className="w-8 h-8 text-timer mx-auto" />
            <h3 className="font-semibold">Built-in Timers</h3>
            <p className="text-sm text-muted-foreground">
              Track time spent on each assignment with automatic saving
            </p>
          </div>
          
          <div className="p-4 rounded-lg border space-y-2">
            <BookOpen className="w-8 h-8 text-success mx-auto" />
            <h3 className="font-semibold">Smart Placement</h3>
            <p className="text-sm text-muted-foreground">
              Assignments auto-fill based on subject family and due dates
            </p>
          </div>
          
          <div className="p-4 rounded-lg border space-y-2">
            <Target className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="font-semibold">Parent Control</h3>
            <p className="text-sm text-muted-foreground">
              Manual override during weekly setup for perfect customization
            </p>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full max-w-md"
          onClick={() => navigate('/schedule')}
        >
          Open Family Schedule
        </Button>
      </div>
    </div>
  );
};

export default Index;
