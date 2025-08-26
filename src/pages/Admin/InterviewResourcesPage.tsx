import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/ui/file-uploader';
import { Trash2, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminUploadService } from '@/services/adminUploadService';

interface InterviewResource {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const InterviewResourcesPage: React.FC = () => {
  const { user, isAdmin, ensureSupabaseSession, getSupabaseUserId } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<InterviewResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);

  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch interview resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !fileData) {
      toast({
        title: "Validation Error",
        description: "Please provide a title and select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      
      // Use admin upload service which bypasses RLS
      await adminUploadService.uploadInterviewResource(
        fileData,
        title.trim(),
        description.trim() || null,
        fileName
      );

      toast({
        title: "Success",
        description: "Interview resource uploaded successfully",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setFileData(null);
      fetchResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload interview resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resource: InterviewResource) => {
    if (!confirm(`Are you sure you want to permanently delete "${resource.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Permanently delete the resource and file
      await adminUploadService.delete({
        filePath: resource.file_path,
        bucket: 'interview-resources'
      });

      toast({
        title: "Success",
        description: "Resource permanently deleted",
      });

      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the resource",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Resources</h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage PDF materials for interview preparation
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload New Resource
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., System Design Interview Guide"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the resource..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">PDF File *</label>
              <FileUploader
                onFileChange={setFileData}
                accept="application/pdf"
                maxSize={10}
              />
            </div>

            <Button 
              onClick={handleUpload}
              disabled={uploading || !title.trim() || !fileData}
              className="w-full md:w-auto"
            >
              {uploading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </CardContent>
        </Card>

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              All Resources ({resources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading resources...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">
                  No resources found
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your first PDF resource to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{resource.file_name}</span>
                        <span>{formatFileSize(resource.file_size)}</span>
                        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(resource)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InterviewResourcesPage;