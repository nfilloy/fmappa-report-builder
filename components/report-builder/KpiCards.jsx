"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { formatTonnes } from "@/lib/formatters";

function CountUp({ value }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [value, reduceMotion]);

  return <>{formatTonnes(reduceMotion ? value : display)}</>;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function KpiCards({ kpis }) {
  return (
    <motion.div
      className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {kpis.map((kpi) => (
        <motion.div className="min-w-0" key={kpi.label} variants={itemVariants}>
          <Card className="relative h-full min-w-0 overflow-hidden rounded-2xl">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: kpi.color }}
            />
            <div className="min-w-0 px-5 py-6">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: kpi.color }}
                />
                <p className="min-w-0 text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </p>
              </div>
              <p className="mt-4 break-words text-[clamp(1.55rem,1.1rem+1vw,1.875rem)] font-bold leading-tight text-foreground tabular-nums">
                <CountUp value={kpi.value} />
              </p>
              <p className="mt-2 min-w-0 break-words text-sm text-muted-foreground">
                {kpi.detail}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
