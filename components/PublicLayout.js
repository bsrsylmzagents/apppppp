import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;





