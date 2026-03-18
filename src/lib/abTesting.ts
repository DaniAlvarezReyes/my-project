'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('ab-visitor-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ab-visitor-id', id);
  }
  return id;
}

// Hook: get assigned variant for an experiment
export function useExperiment(experimentName: string): { variant: string; loading: boolean } {
  const [variant, setVariant] = useState('control');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assign = async () => {
      const visitorId = getVisitorId();
      try {
        // Check existing assignment
        const { data: existing } = await supabase
          .from('ab_assignments')
          .select('variant, experiment:ab_experiments!inner(name)')
          .eq('visitor_id', visitorId)
          .eq('experiment.name', experimentName)
          .maybeSingle();

        if (existing) { setVariant(existing.variant); setLoading(false); return; }

        // Get experiment
        const { data: exp } = await supabase
          .from('ab_experiments')
          .select('id, variants')
          .eq('name', experimentName)
          .eq('active', true)
          .maybeSingle();

        if (!exp) { setLoading(false); return; }

        // Random assignment
        const variants = exp.variants as string[];
        const assigned = variants[Math.floor(Math.random() * variants.length)];

        await supabase.from('ab_assignments').insert({
          experiment_id: exp.id,
          visitor_id: visitorId,
          variant: assigned,
        });

        setVariant(assigned);
      } catch {
        // Fallback to control
      } finally {
        setLoading(false);
      }
    };
    assign();
  }, [experimentName]);

  return { variant, loading };
}

// Track conversion
export async function trackConversion(experimentName: string) {
  const visitorId = getVisitorId();
  try {
    const { data: assignment } = await supabase
      .from('ab_assignments')
      .select('id, experiment:ab_experiments!inner(name)')
      .eq('visitor_id', visitorId)
      .eq('experiment.name', experimentName)
      .maybeSingle();

    if (assignment) {
      await supabase.from('ab_assignments').update({ converted: true }).eq('id', assignment.id);
    }
  } catch {}
}

// Component: render different content based on variant
export function ABTest({ experiment, variants }: {
  experiment: string;
  variants: Record<string, React.ReactNode>;
}) {
  const { variant, loading } = useExperiment(experiment);
  if (loading) return null;
  return <>{variants[variant] || variants['control'] || null}</>;
}
