
import React from 'react';
import FinancialPreferencesForm from '@/components/FinancialPreferencesForm';

const GetStarted = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-graphite mb-4">
            Tell Us About Your Financial Values
          </h1>
          <p className="text-brand-gray">
            Help us find the perfect financial partners that align with your values and goals.
          </p>
        </div>
        <FinancialPreferencesForm />
      </div>
    </div>
  );
};

export default GetStarted;
