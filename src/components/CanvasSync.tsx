import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CanvasSync } from '@/lib/canvas-sync';
import { useApp } from '@/context/AppContext';

const canvasSyncSchema = z.object({
  canvasUrl: z.string()
    .trim()
    .url({ message: "Please enter a valid Canvas URL" })
    .min(1, { message: "Canvas URL is required" }),
  apiToken: z.string()
    .trim()
    .min(10, { message: "API token must be at least 10 characters" })
    .max(200, { message: "API token too long" })
});

export function CanvasSyncCard() {
  const { currentUser } = useApp();
  const [apiToken, setApiToken] = useState('');
  const [canvasUrl, setCanvasUrl] = useState('https://taa.instructure.com');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ canvasUrl?: string; apiToken?: string }>({});

  const validateInputs = () => {
    try {
      canvasSyncSchema.parse({ canvasUrl, apiToken });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { canvasUrl?: string; apiToken?: string } = {};
        error.issues.forEach(issue => {
          if (issue.path[0] === 'canvasUrl') fieldErrors.canvasUrl = issue.message;
          if (issue.path[0] === 'apiToken') fieldErrors.apiToken = issue.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSync = async () => {
    if (!currentUser?.id) {
      setMessage('Please log in to sync assignments');
      return;
    }
    
    if (!validateInputs()) {
      return;
    }
    
    setSyncing(true);
    setMessage('Syncing assignments from Canvas...');
    
    try {
      const sync = new CanvasSync(apiToken, canvasUrl, currentUser.id);
      const result = await sync.syncAssignments();
      
      if (result.success) {
        setMessage(`✓ Successfully synced ${result.count} assignments from Canvas`);
        // Clear sensitive data
        setApiToken('');
        // Refresh the page to show new assignments after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Unexpected error during sync`);
      console.error('Canvas sync error:', error);
    }
    
    setSyncing(false);
  };

  const handleCanvasUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCanvasUrl(e.target.value);
    if (errors.canvasUrl) {
      setErrors(prev => ({ ...prev, canvasUrl: undefined }));
    }
  };

  const handleApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiToken(e.target.value);
    if (errors.apiToken) {
      setErrors(prev => ({ ...prev, apiToken: undefined }));
    }
  };

  return (
    <Card className='p-6 space-y-4'>
      <div>
        <h3 className='font-semibold text-lg mb-2'>Canvas Assignment Sync</h3>
        <p className='text-sm text-muted-foreground'>
          Import assignments from Canvas. Only assignments with due dates from the last 30 days will be synced.
        </p>
      </div>
      
      <div className='space-y-3'>
        <div>
          <label htmlFor="canvas-url" className='text-sm font-medium'>Canvas URL</label>
          <Input
            id="canvas-url"
            placeholder='https://your-school.instructure.com'
            value={canvasUrl}
            onChange={handleCanvasUrlChange}
            className={errors.canvasUrl ? 'border-destructive' : ''}
          />
          {errors.canvasUrl && (
            <p className='text-sm text-destructive mt-1'>{errors.canvasUrl}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="api-token" className='text-sm font-medium'>Canvas API Token</label>
          <Input
            id="api-token"
            type='password'
            placeholder='Enter your Canvas API token'
            value={apiToken}
            onChange={handleApiTokenChange}
            className={errors.apiToken ? 'border-destructive' : ''}
          />
          {errors.apiToken && (
            <p className='text-sm text-destructive mt-1'>{errors.apiToken}</p>
          )}
          <p className='text-xs text-muted-foreground mt-1'>
            Get your API token from Canvas Account → Settings → Approved Integrations
          </p>
        </div>
      </div>

      <Button 
        onClick={handleSync} 
        disabled={syncing || !apiToken.trim() || !canvasUrl.trim() || !currentUser}
        className='w-full'
      >
        {syncing ? 'Syncing...' : 'Sync Canvas Assignments'}
      </Button>
      
      {message && (
        <Alert className={message.startsWith('✓') ? 'border-green-200 bg-green-50' : 
                         message.startsWith('❌') ? 'border-destructive bg-destructive/5' : ''}>
          <AlertDescription className='text-sm'>
            {message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className='text-xs text-muted-foreground space-y-1'>
        <p><strong>Important:</strong></p>
        <ul className='list-disc list-inside space-y-1 ml-2'>
          <li>Only assignments with due dates will be imported</li>
          <li>Existing completion status will be preserved</li>
          <li>API tokens are not stored permanently</li>
          <li>Assignments older than 30 days are skipped</li>
        </ul>
      </div>
    </Card>
  );
}