import React from "react";
import { Navbar } from "./Navbar";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
};
