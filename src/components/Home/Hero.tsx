
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/ClerkAuthContext';

const Hero: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-hero min-h-screen flex items-center">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-8 animate-fadeInLeft">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-soft border border-white/20">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-foreground/80">AI-Powered Interview Prep</span>
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl leading-tight">
                <span className="block">Ace Your Next</span>
                <span className="block text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Interview
                </span>
                <span className="block">With MockInvi</span>
              </h1>
            </div>
            
            <p className="max-w-lg text-xl text-foreground/70 leading-relaxed">
              The ultimate AI-powered interview preparation platform. Practice with mock interviews, 
              get intelligent feedback, and discover your next job opportunity with our smart crawling technology.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {!user ? (
                <>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="btn-primary shadow-strong hover:shadow-strong hover:scale-105 transition-all duration-300"
                  >
                    Get Started Free
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/about')}
                    className="border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg"
                  onClick={() => navigate(profile?.role === 'admin' ? '/admin' : '/dashboard')}
                  className="btn-primary shadow-strong hover:shadow-strong hover:scale-105 transition-all duration-300"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-foreground/60">Interviews Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-foreground/60">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-foreground/60">Job Categories</div>
              </div>
            </div>
          </div>
          
          {/* Right Content */}
          <div className="relative hidden lg:block animate-fadeInRight">
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img
                src="/lovable-uploads/23109cc1-3f65-4c26-9142-d431fca949c9.png"
                alt="AI Interview Robot"
                className="object-cover w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-6 right-6">
                <div className="glass-effect rounded-xl p-4 shadow-soft">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-white">Live AI</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass-effect rounded-xl p-4 shadow-soft">
                  <span className="inline-flex items-center px-3 py-1 mb-3 text-xs font-medium text-white bg-primary rounded-full">
                    AI-Powered
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Real-time Feedback & Analysis
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    Get instant insights on your performance
                  </p>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
