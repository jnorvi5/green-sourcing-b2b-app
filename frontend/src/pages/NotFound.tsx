import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <EmptyState
          title="Page Not Found"
          description="The page you are looking for doesn't exist or has been moved."
          icon={FileQuestion}
          action={
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go back home
            </Link>
          }
        />
      </div>
    </div>
  );
};

export default NotFound;
