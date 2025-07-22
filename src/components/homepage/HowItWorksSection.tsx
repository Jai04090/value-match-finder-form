
import React from 'react';
import { UserPlus, Search, Mail } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Tell us about your values, preferences, and financial goals in just a few minutes.'
  },
  {
    number: '02',
    icon: Search,
    title: 'Get Matched',
    description: 'Our intelligent algorithm finds institutions that align with your values and needs.'
  },
  {
    number: '03',
    icon: Mail,
    title: 'Receive Offers',
    description: 'Get personalized financial offers directly from matched institutions.'
  }
];

const HowItWorksSection = () => {
  return (
    <section className="bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-electric mb-4">
            How It Works
          </h2>
          <p className="text-xl text-brand-gray max-w-2xl mx-auto">
            Getting started is simple. Follow these three easy steps to begin 
            your journey toward value-aligned financial partnerships.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-brand-slate transform -translate-x-1/2 z-0" />
              )}
              
              <div className="relative z-10 mb-6">
                <div className="w-16 h-16 bg-brand-electric rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-brand-white" />
                </div>
                <div className="text-sm font-bold text-brand-slate mb-2">
                  STEP {step.number}
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold text-brand-graphite mb-4">
                {step.title}
              </h3>
              
              <p className="text-brand-gray">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
