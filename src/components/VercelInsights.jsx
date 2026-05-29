import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const VercelInsights = () => (
  <>
    <Analytics />
    <SpeedInsights />
  </>
);

export default VercelInsights;
