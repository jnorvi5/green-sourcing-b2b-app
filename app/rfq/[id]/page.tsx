'use client';

import { FC } from 'react';

interface PageProps {
  params: {
    id: string;
  };
}

const RFQPage: FC<PageProps> = ({ params }) => {
  const rfqId = params.id; 

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">RFQ Details: {rfqId}</h1>
    </div>
  );
};

export default RFQPage;
