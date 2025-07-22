
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-brand-graphite mb-6">
          Find Financial Partners That{' '}
          <span className="text-brand-electric">Share Your Values</span>
        </h1>
        
        <p className="text-xl text-brand-gray mb-8 max-w-3xl mx-auto leading-relaxed">
          Connect with financial institutions that align with your personal values, 
          beliefs, and lifestyle preferences. Get personalized offers from partners 
          who truly understand what matters to you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/get-started">
            <Button 
              size="lg" 
              className="bg-brand-electric hover:bg-brand-sky text-brand-white px-8 py-4 text-lg font-semibold"
            >
              Start as Consumer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/institution-login">
            <Button 
              variant="outline" 
              size="lg"
              className="border-brand-slate text-brand-graphite hover:bg-brand-sky hover:text-brand-white px-8 py-4 text-lg font-semibold"
            >
              For Institutions
              <Shield className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-brand-gray">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-mint" />
            <span>10,000+ Users Trust Us</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-mint" />
            <span>Bank-Level Security</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
