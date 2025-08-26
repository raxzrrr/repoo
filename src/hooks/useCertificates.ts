
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_type: string;
  template_data: any;
  requirements: any;
  is_active: boolean;
  auto_issue: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  course_id: string | null;
  issued_date: string;
  completion_data: any;
  certificate_url: string | null;
  verification_code: string;
  score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  certificate_title: string;
  certificate_description: string | null;
  certificate_type: string;
  certificate_is_active: boolean;
}

export const useCertificates = () => {
  const [userCertificates, setUserCertificates] = useState<UserCertificate[]>([]);
  const [availableCertificates, setAvailableCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { getSupabaseUserId, isAuthenticated, ensureSupabaseSession } = useAuth();

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!isAuthenticated) {
        setUserCertificates([]);
        setAvailableCertificates([]);
        setLoading(false);
        return;
      }

      try {
        // Ensure Supabase session is established before querying RLS-protected tables
        await ensureSupabaseSession?.();
        
        const supabaseUserId = getSupabaseUserId();
        if (!supabaseUserId) {
          console.log('useCertificates - No Supabase user ID available');
          setUserCertificates([]);
          setAvailableCertificates([]);
          setLoading(false);
          return;
        }

        console.log('useCertificates - Fetching certificates for user:', supabaseUserId);
        
        // Fetch user's certificates using the new view
        const { data: userCerts, error: userError } = await supabase
          .from('v_user_certificates')
          .select('*')
          .eq('user_id', supabaseUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (userError) {
          console.error('Error fetching user certificates:', userError);
          setUserCertificates([]);
        } else {
          console.log('useCertificates - Found user certificates:', userCerts);
          
          // Process certificates to ensure they have required fields
          const processedCerts = (userCerts || []).map((cert) => ({
            ...cert,
            // Provide fallback values if certificate data is missing
            certificate_title: cert.certificate_title || 'Course Completion Certificate',
            certificate_description: cert.certificate_description || 'Certificate of successful course completion'
          }));
          
          setUserCertificates(processedCerts);
        }

        // Fetch available certificates
        const { data: availableCerts, error: availableError } = await supabase
          .from('certificates')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (availableError) {
          console.error('Error fetching available certificates:', availableError);
          setAvailableCertificates([]);
        } else {
          setAvailableCertificates(availableCerts || []);
        }
      } catch (error) {
        console.error('Error in fetchCertificates:', error);
        setUserCertificates([]);
        setAvailableCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();

    // Set up real-time subscriptions for certificate changes
    const supabaseUserId = getSupabaseUserId();
    if (supabaseUserId) {
      const channel = supabase
        .channel('user-certificates-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_certificates',
            filter: `user_id=eq.${supabaseUserId}`
          },
          (payload) => {
            console.log('Certificate change detected:', payload);
            fetchCertificates();
          }
        )
        .subscribe();

      // Listen for custom certificate generation events
      const handleCertificateGenerated = () => {
        console.log('Certificate generation event received, refetching...');
        setTimeout(fetchCertificates, 500);
      };
      
      window.addEventListener('certificateGenerated', handleCertificateGenerated);
      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('certificateGenerated', handleCertificateGenerated);
      };
    }
  }, [getSupabaseUserId, isAuthenticated, ensureSupabaseSession]);

  const refetch = () => {
    setLoading(true);
    // Trigger useEffect to run again by updating a state that's watched
    const event = new Event('refetch-certificates');
    window.dispatchEvent(event);
  };

  return {
    userCertificates,
    availableCertificates,
    loading,
    refetch
  };
};
