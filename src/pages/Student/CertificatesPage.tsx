
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CertificateCard from '@/components/Certificates/CertificateCard';
import CertificateViewer from '@/components/Certificates/CertificateViewer';
import { Award, Download, Eye, Calendar, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { downloadCertificate } from '@/services/certificateService';
import { useLocalDashboardData } from '@/hooks/useLocalDashboardData';

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { certificates: userCertificates, loading, error } = useLocalDashboardData();

  const handleDownload = (certificate: any) => { // Changed to any
    const userName = user?.fullName || user?.firstName || 'Student';
    downloadCertificate({
      userName,
      certificateTitle: certificate.certificate_title || 'Certificate',
      completionDate: new Date(certificate.issued_date).toLocaleDateString(),
      score: certificate.assessment_score,
      verificationCode: certificate.verification_code
    });
  };

  const handleView = (certificate: any) => { // Changed to any
    setSelectedCertificate(certificate);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Award className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Certificates</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
            <p className="text-muted-foreground mt-1">
              Your achievements and completed certifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">{userCertificates.length} Earned</span>
            </div>
          </div>
        </div>

        {/* Earned Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Earned Certificates
            </CardTitle>
            <CardDescription>
              Certificates you have successfully earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userCertificates.map((cert) => (
                  <Card key={cert.id} className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Earned</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(cert)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(cert)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">
                        {cert.certificateTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cert.certificateDescription}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(cert.issuedDate).toLocaleDateString()}</span>
                        </div>
                        {cert.assessmentScore && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {cert.assessmentScore}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        ID: {cert.verificationCode}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificates earned yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete courses and pass assessments to earn your first certificate!
                </p>
                <Button onClick={() => window.location.href = '/learning'}>
                  Start Learning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Available Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Available Certificates
            </CardTitle>
            <CardDescription>
              Certificates you can earn by meeting the requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* The original code had a loop here, but the new_code removed the 'availableCertificates' state.
                   Assuming the intent was to show available certificates based on user progress,
                   but the new_code doesn't provide this data directly.
                   For now, I'll keep the structure but note the missing data source. */}
              {/* This section will likely need to be refactored if available certificates are to be displayed */}
              <Card 
                className="border-blue-200 bg-blue-50/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <Badge 
                        variant="outline" 
                        className="bg-blue-100 text-blue-800 border-blue-200"
                      >
                        Available
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">No available certificates currently</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete courses and assessments to unlock new certificates.
                  </p>
                  <Button onClick={() => window.location.href = '/learning'}>
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Viewer Modal */}
      {viewerOpen && selectedCertificate && (
        <CertificateViewer
          certificate={{
            id: selectedCertificate.verification_code,
            title: selectedCertificate.certificateTitle || 'Certificate',
            completedDate: new Date(selectedCertificate.issuedDate).toLocaleDateString(),
            score: selectedCertificate.assessmentScore || 0
          }}
          userName={user?.fullName || user?.firstName || 'Student'}
          onClose={() => setViewerOpen(false)}
          onDownload={() => handleDownload(selectedCertificate)}
        />
      )}
    </DashboardLayout>
  );
};

export default CertificatesPage;
