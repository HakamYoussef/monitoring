import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/actions/session';
import { GetStartedDialog } from '@/components/landing/get-started-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  AlarmCheck,
  BarChart3,
  CircuitBoard,
  Lock,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    title: 'Unified Monitoring',
    description:
      'Bring sensor data, device health, and operational alerts together in one place so that every stakeholder has the full picture.',
    icon: Activity,
  },
  {
    title: 'Smart Automation',
    description:
      'Configure automated workflows that react instantly to threshold breaches or equipment failures to keep your systems resilient.',
    icon: CircuitBoard,
  },
  {
    title: 'Clear Insights',
    description:
      'Transform raw telemetry into dashboards, timelines, and reports that make it easy to communicate impact and plan the next steps.',
    icon: BarChart3,
  },
];

const assurances = [
  {
    title: 'Secure by design',
    description:
      'Role-based access controls and encrypted connections help you stay compliant while scaling visibility across teams.',
    icon: ShieldCheck,
  },
  {
    title: 'Always in the loop',
    description:
      'Custom alerts and automated notifications keep the right people informed before small anomalies become outages.',
    icon: AlarmCheck,
  },
  {
    title: 'Built for operations',
    description:
      'From factory floors to remote field deployments, Smart Monitoring adapts to the environments you rely on.',
    icon: Lock,
  },
];

export default async function HomePage() {
  const session = await getSession();

  if (session.isLoggedIn) {
    const defaultDashboard = session.dashboardNames[0];
    if (defaultDashboard) {
      redirect(`/dashboard/${encodeURIComponent(defaultDashboard)}`);
    }
    redirect('/dashboard');
  }

  return <LandingContent />;
}

function LandingContent() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col items-center px-6 pb-20 pt-24 sm:px-10 lg:px-12">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
            Smart Monitoring Platform
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Know what is happening across your operations in real time.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-200/80">
            Smart Monitoring centralizes telemetry, alerting, and automation so that every member of your team can make faster, safer
            decisions. Visualize critical metrics, trigger workflows, and deliver reliable service without juggling multiple tools.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GetStartedDialog triggerClassName="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-200" />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 text-slate-800 hover:bg-white/10 sm:w-auto"
            >
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid w-full gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-white/10 bg-white/5 text-left text-slate-100">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-semibold text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-200/80">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 w-full rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Why teams choose Smart Monitoring</h2>
          <p className="mt-3 max-w-3xl text-base text-slate-200/80">
            Every deployment is unique. We partner with you to understand your goals, tailor dashboards, and roll out automation that
            matches your environment. Share a few details about your project to begin the conversation.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assurances.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-xl bg-white/5 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200/80">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Ready to explore a tailored monitoring plan?</h3>
              <p className="mt-2 text-sm text-slate-200/80">
                Tell us about your initiative and we will reach out with a personalized walkthrough and setup options.
              </p>
            </div>
            <GetStartedDialog triggerClassName="w-full bg-white text-slate-900 hover:bg-slate-200 sm:w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

