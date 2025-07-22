
import React from 'react';
import { Heart, Lock, Target, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Heart,
    title: 'Value-Based Matching',
    description: 'Connect with institutions that share your personal values and beliefs.',
    color: 'text-brand-electric'
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description: 'Your data is protected with bank-level security and encryption.',
    color: 'text-brand-sky'
  },
  {
    icon: Target,
    title: 'Personalized Offers',
    description: 'Receive tailored financial products that match your specific needs.',
    color: 'text-brand-mint'
  },
  {
    icon: Zap,
    title: 'Real-Time Matching',
    description: 'Get instant matches as soon as relevant opportunities become available.',
    color: 'text-brand-amber'
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description: 'Access valuable insights about financial trends and opportunities.',
    color: 'text-brand-electric'
  },
  {
    icon: CheckCircle,
    title: 'Verified Institutions',
    description: 'All partner institutions are vetted and verified for your safety.',
    color: 'text-brand-mint'
  }
];

const FeaturesSection = () => {
  return (
    <section className="bg-muted py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-electric mb-4">
            Why Choose Grofinity?
          </h2>
          <p className="text-xl text-brand-gray max-w-2xl mx-auto">
            Our platform combines cutting-edge technology with deep understanding 
            of personal values to create meaningful financial connections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <feature.icon className={`h-8 w-8 ${feature.color} mr-3`} />
                  <h3 className="text-xl font-semibold text-brand-graphite">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-brand-gray">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
