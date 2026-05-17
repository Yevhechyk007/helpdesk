'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Lightning Fast',
    description: 'Respond to tickets instantly with smart routing and automation.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Team Collaboration',
    description: 'Assign, comment and resolve tickets together in real-time.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Analytics',
    description: 'Track performance metrics and SLA compliance at a glance.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Secure by Default',
    description: 'Role-based access control and JWT authentication built-in.',
  },
];

const stats = [
  { value: '< 1s', label: 'Response time' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '∞', label: 'Tickets handled' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-hidden">
      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-white/4 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-white/3 blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">Helpdesk</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-white/60 hover:text-white hover:bg-white/10">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-white text-[#080808] hover:bg-white/90 font-medium">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="max-w-3xl">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <Badge className="mb-6 bg-white/10 text-white/80 border border-white/10 hover:bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
              ✦ &nbsp; Open-source support platform
            </Badge>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-6xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Support that
            <br />
            <span className="text-white/40">actually scales.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg text-white/50 leading-relaxed mb-10 max-w-xl"
          >
            A modern helpdesk built for fast-moving teams. Manage tickets,
            collaborate seamlessly, and keep customers happy — all in one place.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-[#080808] hover:bg-white/90 font-semibold px-6 h-11"
            >
              <Link href="/register">Start for free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 px-6 h-11"
            >
              <Link href="/login">Sign in →</Link>
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-20 flex items-center gap-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
              <span className="text-sm text-white/40">{stat.label}</span>
            </div>
          ))}
          <div className="h-12 w-px bg-white/10 ml-2" />
          <p className="text-sm text-white/30 max-w-[160px] leading-relaxed">
            Trusted by support teams worldwide
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="mt-28 grid grid-cols-2 gap-4 max-w-2xl lg:grid-cols-4 lg:max-w-none">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={5 + i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center mb-4 text-white/60 group-hover:text-white group-hover:bg-white/12 transition-all">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom gradient */}
      <div className="fixed bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </div>
  );
}
