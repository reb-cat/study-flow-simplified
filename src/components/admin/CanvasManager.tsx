import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, RotateCw, Settings } from 'lucide-react';
import { CanvasSync } from '@/lib/canvas-sync';
import { useApp } from '@/context/AppContext';

interface CanvasInstance {
  id: string;
  name: string;
  url: string;
  token: string;
  lastSync?: string;
  isActive: boolean;
}

const canvasInstanceSchema = z.object({
  name: z.string().trim().min(1, "Instance name is required").max(50, "Name too long"),
  url: z.string().trim().url("Please enter a valid Canvas URL"),
  token: z.string().trim().min(10, "API token must be at least 10 characters").max(200, "Token too long")
});

export function CanvasManager() {
  const { selectedProfile } = useApp();
  const [instances, setInstances] = useState<CanvasInstance[]>([
    { 
      id: '1', 
      name: 'School 1', 
      url: 'https://taa.instructure.com', 
      token: '', 
      isActive: true,
      lastSync: undefined
    },
    { 
      id: '2', 
      name: 'School 2', 
      url: '', 
      token: '', 
      isActive: false,
      lastSync: undefined
    }
  ]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, any>>({});

  const addInstance = () => {
    const newId = Date.now().toString();
    const newInstance: CanvasInstance = {
      id: newId,
      name: `School ${instances.length + 1}`,
      url: '',
      token: '',
      isActive: false
    };
    setInstances([...instances, newInstance]);
    setEditingId(newId);
  };

  const removeInstance = (id: string) => {
    setInstances(instances.filter(inst => inst.id !== id));
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[id];
      return newMessages;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const updateInstance = (id: string, updates: Partial<CanvasInstance>) => {
    setInstances(instances.map(inst => 
      inst.id === id ? { ...inst, ...updates } : inst
    ));
  };

  const validateInstance = (instance: CanvasInstance) => {
    try {
      canvasInstanceSchema.parse({
        name: instance.name,
        url: instance.url,
        token: instance.token
      });
      setErrors(prev => ({ ...prev, [instance.id]: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.issues.forEach(issue => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(prev => ({ ...prev, [instance.id]: fieldErrors }));
      }
      return false;
    }
  };

  const syncInstance = async (instance: CanvasInstance) => {
    if (!selectedProfile?.id) {
      setMessages(prev => ({ ...prev, [instance.id]: 'No student selected' }));
      return;
    }

    if (!validateInstance(instance)) {
      setMessages(prev => ({ ...prev, [instance.id]: 'Please fix validation errors first' }));
      return;
    }

    setSyncingId(instance.id);
    setMessages(prev => ({ ...prev, [instance.id]: 'Syncing assignments from Canvas...' }));

    try {
      console.log('Syncing Canvas instance:', {
        instanceName: instance.name,
        studentId: selectedProfile.id,
        url: instance.url
      });

      const sync = new CanvasSync(
        instance.token,
        instance.url,
        selectedProfile.id,  // This is now the correct UUID
        instance.name
      );
      
      const result = await sync.syncAssignments();
      
      if (result.success) {
        const syncTime = new Date().toLocaleString();
        setMessages(prev => ({ 
          ...prev, 
          [instance.id]: `✓ Successfully synced ${result.count} assignments from ${instance.name}` 
        }));
        updateInstance(instance.id, { 
          lastSync: syncTime,
          isActive: true 
        });
        
        // Refresh the page after successful sync
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessages(prev => ({ 
          ...prev, 
          [instance.id]: `❌ Sync failed for ${instance.name}: ${result.error}` 
        }));
      }
    } catch (error) {
      console.error('Canvas sync error:', error);
      setMessages(prev => ({ 
        ...prev, 
        [instance.id]: `❌ Unexpected error during sync for ${instance.name}` 
      }));
    } finally {
      setSyncingId(null);
    }
  };

  const saveInstance = (id: string) => {
    const instance = instances.find(inst => inst.id === id);
    if (instance && validateInstance(instance)) {
      setEditingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Canvas Instance Manager
          {selectedProfile && (
            <Badge variant="outline" className="ml-auto">
              Student: {selectedProfile.displayName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Manage multiple Canvas instances for the selected student. Each instance can be synced independently.
        </div>

        {instances.map(instance => (
          <Card key={instance.id} className={`p-4 ${instance.isActive ? 'border-green-200' : ''}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingId === instance.id ? (
                    <Input
                      value={instance.name}
                      onChange={(e) => updateInstance(instance.id, { name: e.target.value })}
                      className={`w-48 ${errors[instance.id]?.name ? 'border-destructive' : ''}`}
                      placeholder="Instance name"
                    />
                  ) : (
                    <h4 className="font-medium">{instance.name}</h4>
                  )}
                  
                  {instance.isActive && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                  
                  {instance.lastSync && (
                    <Badge variant="outline" className="text-xs">
                      Last sync: {instance.lastSync}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === instance.id ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => saveInstance(instance.id)}
                        disabled={Object.keys(errors[instance.id] || {}).length > 0}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingId(instance.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => syncInstance(instance)}
                        disabled={syncingId === instance.id || !instance.url || !instance.token}
                        className="min-w-[80px]"
                      >
                        {syncingId === instance.id ? (
                          <>
                            <RotateCw className="w-3 h-3 mr-1 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RotateCw className="w-3 h-3 mr-1" />
                            Sync
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeInstance(instance.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {errors[instance.id]?.name && (
                <p className="text-sm text-destructive">{errors[instance.id].name}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Canvas URL</label>
                  <Input
                    value={instance.url}
                    onChange={(e) => updateInstance(instance.id, { url: e.target.value })}
                    placeholder="https://your-school.instructure.com"
                    disabled={editingId !== instance.id}
                    className={errors[instance.id]?.url ? 'border-destructive' : ''}
                  />
                  {errors[instance.id]?.url && (
                    <p className="text-sm text-destructive mt-1">{errors[instance.id].url}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">API Token</label>
                  <Input
                    type="password"
                    value={instance.token}
                    onChange={(e) => updateInstance(instance.id, { token: e.target.value })}
                    placeholder="Canvas API token"
                    disabled={editingId !== instance.id}
                    className={errors[instance.id]?.token ? 'border-destructive' : ''}
                  />
                  {errors[instance.id]?.token && (
                    <p className="text-sm text-destructive mt-1">{errors[instance.id].token}</p>
                  )}
                </div>
              </div>

              {messages[instance.id] && (
                <Alert className={
                  messages[instance.id].startsWith('✓') ? 'border-green-200 bg-green-50' : 
                  messages[instance.id].startsWith('❌') ? 'border-destructive bg-destructive/5' : ''
                }>
                  <AlertDescription className="text-sm">
                    {messages[instance.id]}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addInstance}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Canvas Instance
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Usage Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Each instance represents a different Canvas installation</li>
            <li>API tokens are stored temporarily during sync only</li>
            <li>Only assignments with due dates from the last 30 days will be synced</li>
            <li>Existing completion status will be preserved</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}