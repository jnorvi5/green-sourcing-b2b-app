'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const CompetitorBenchmark = () => {
  // Mock data as per requirements
  const data = [
    {
      name: 'Your Product',
      gwp: 240,
      fill: '#ef4444', // red-500 for "worse" performance
    },
    {
      name: 'Regional Avg',
      gwp: 210,
      fill: '#22c55e', // green-500 for "better" performance
    },
  ];

  const userGwp = 240;
  const avgGwp = 210;

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Competitor Comparison</CardTitle>
        <CardDescription>
          See how your product stacks up against the regional average.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                label={{
                  value: 'GWP (kg CO2e)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 }
                }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(value: number) => [`${value} kg CO2e`, 'GWP']}
              />
              <Bar dataKey="gwp" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-gray-700">
            Your concrete GWP is <span className="text-red-600 font-bold">{userGwp}</span>.
          </p>
          <p className="text-sm text-gray-600">
            The average in your region is <span className="text-green-600 font-bold">{avgGwp}</span>.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Claim profile to update your mix designs and showcase your sustainability improvements.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pb-6">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Claim Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompetitorBenchmark;
