import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnifiedAssignment } from '@/types/assignment';

interface AfterSchoolSummaryProps {
  assignments: UnifiedAssignment[];
  date: string;
}

export function AfterSchoolSummary({ assignments, date }: AfterSchoolSummaryProps) {
  const afterSchoolItems = assignments.filter(a =>
    (a.scheduled_block === 999 || a.needs_reschedule === true) &&
    a.scheduled_date === date
  );

  if (afterSchoolItems.length === 0) return null;

  return (
    <Card className="border-orange-500 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">
          After School Work ({afterSchoolItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {afterSchoolItems.map(item => (
          <div key={item.id} className="bg-white rounded p-3">
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              {item.course_name || item.subject}
            </div>
            {item.canvas_url && (
              <Button size="sm" className="mt-2" asChild>
                <a href={item.canvas_url} target="_blank" rel="noopener noreferrer">
                  Upload to Canvas
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}