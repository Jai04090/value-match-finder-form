
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2 } from 'lucide-react';

const CallToActionSection = () => {
  return (
    <section className="bg-gradient-to-r from-brand-electric to-brand-sky py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-brand-white mb-6">
          Ready to Find Your Perfect Financial Match?
        </h2>
        
        <p className="text-xl text-brand-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of users who have discovered financial partners 
          that truly understand their values and goals.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/get-started">
            <Button 
              size="lg"
              className="bg-brand-white text-brand-electric hover:bg-brand-white/90 px-8 py-4 text-lg font-semibold"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/institution-login">
            <Button 
              variant="outline"
              size="lg"
              className="border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-electric px-8 py-4 text-lg font-semibold"
            >
              Partner With Us
              <Building2 className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
