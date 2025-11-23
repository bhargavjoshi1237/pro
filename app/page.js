'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { WaveBackground } from '@/components/landing/wave/WaveBackground';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import HeroGeometric from '@/components/landing/HeroGeometric';

function LandingContent() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-[#e7e7e7] overflow-hidden">
      <div>
        {/* Animated background */}
        <WaveBackground />

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold">Prodigy</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-[#e7e7e7] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <HeroGeometric title1="Write, Organize," title2="Create Masterpieces" badge="Your creative writing companion" />

        {/* Features Section */}
        <div id="features" className="relative z-10">
          <FeatureShowcase />
        </div>

        {/* Pricing Section */}
        <section id="pricing" className="relative z-10 py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-[#e7e7e7] dark:via-white dark:to-[#e7e7e7]">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Start for free, upgrade when you need more power</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Tier */}
              <div className="bg-white/80 dark:bg-[#191919]/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all hover:shadow-xl relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xl font-semibold mb-2">Starter</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <PricingFeature text="Up to 3 workspaces" />
                  <PricingFeature text="Basic AI assistance" />
                  <PricingFeature text="5GB storage" />
                  <PricingFeature text="Community support" />
                </ul>
                <button className="w-full py-3 px-4 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-[#e7e7e7] rounded-xl font-semibold transition-colors">
                  Get Started
                </button>
              </div>

              {/* Pro Tier */}
              <div className="bg-gray-900 dark:bg-[#e7e7e7] p-8 rounded-2xl shadow-2xl scale-105 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white dark:text-gray-900">Pro</h3>
                <div className="flex items-baseline gap-1 mb-6 text-white dark:text-gray-900">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-gray-400 dark:text-gray-600">/month</span>
                </div>
                <ul className="space-y-4 mb-8 text-gray-300 dark:text-gray-700">
                  <PricingFeature text="Unlimited workspaces" />
                  <PricingFeature text="Advanced AI co-author" />
                  <PricingFeature text="Unlimited storage" />
                  <PricingFeature text="Priority support" />
                  <PricingFeature text="Advanced analytics" />
                </ul>
                <button className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/25">
                  Start Free Trial
                </button>
              </div>

              {/* Team Tier */}
              <div className="bg-white/80 dark:bg-[#191919]/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all hover:shadow-xl relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xl font-semibold mb-2">Team</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <PricingFeature text="Everything in Pro" />
                  <PricingFeature text="Team collaboration" />
                  <PricingFeature text="Admin controls" />
                  <PricingFeature text="API access" />
                  <PricingFeature text="SSO integration" />
                </ul>
                <button className="w-full py-3 px-4 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-[#e7e7e7] rounded-xl font-semibold transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-6xl mx-auto relative">
            {/* Animated gradient orbs in background */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Main CTA Card */}
            <div className="relative bg-gradient-to-br from-white/60 via-white/40 to-white/30 dark:from-white/10 dark:via-white/5 dark:to-white/5 backdrop-blur-2xl rounded-3xl p-12 md:p-20 text-center border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

              {/* Noise texture overlay */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

              {/* Floating particles */}
              <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
              <div className="absolute top-20 right-20 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-20 left-20 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-10 right-10 w-3 h-3 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>

              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-8">
                  <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Join 10,000+ Writers
                  </span>
                </div>

                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent leading-tight">
                  Ready to write your<br />best work?
                </h2>

                <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of writers who have found their flow with Prodigy.<br />
                  <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Start your free trial today — no credit card required.
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center gap-2">
                      Get Started Now
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>

                  <button className="px-8 py-4 bg-white/60 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white rounded-xl font-semibold text-lg hover:bg-white/80 dark:hover:bg-white/20 transition-all duration-300 border border-gray-200/50 dark:border-white/20">
                    Watch Demo
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span>Free 14-day trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span>No credit card needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-16 border-t border-gray-200/50 dark:border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand Column */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Prodigy</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your creative writing companion. Built for writers, by writers.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  </a>
                </div>
              </div>

              {/* Product Column */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Roadmap</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Changelog</a></li>
                </ul>
              </div>

              {/* Resources Column */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Resources</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>

              {/* Company Column */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-gray-200/50 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-500">
                © 2024 Prodigy. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-500">
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Status</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Security</a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PricingFeature({ text, light = false }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${light ? 'text-white' : 'text-green-500'}`} />
      <span className={light ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{text}</span>
    </li>
  );
}

function ComparisonRow({ feature, free, pro, premium }) {
  const renderCell = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <span className="text-gray-400">—</span>
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <tr>
      <td className="px-6 py-4 text-sm font-medium">{feature}</td>
      <td className="px-6 py-4 text-center">{renderCell(free)}</td>
      <td className="px-6 py-4 text-center">{renderCell(pro)}</td>
      <td className="px-6 py-4 text-center">{renderCell(premium)}</td>
    </tr>
  );
}

export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}
