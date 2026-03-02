import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { MentorApp } from "./MentorApp";

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MentorApp />} />
    </Routes>
  </BrowserRouter>
);

