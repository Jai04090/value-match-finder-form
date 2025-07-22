
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-graphite py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-brand-electric mb-4">
              Grofinity
            </h3>
            <p className="text-brand-slate mb-4">
              Connecting values with financial opportunities for a better tomorrow.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-brand-electric mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/get-started" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/preferences" className="text-brand-slate hover:text-brand-sky transition-colors">
                  My Preferences
                </Link>
              </li>
              <li>
                <Link to="/institution-login" className="text-brand-slate hover:text-brand-sky transition-colors">
                  For Institutions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-brand-electric mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-brand-electric mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-sky transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-gray pt-8 text-center">
          <p className="text-brand-slate">
            © 2024 Grofinity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
