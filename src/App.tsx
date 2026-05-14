import React from "react";
import { RenderLayer } from "./components/RenderLayer";

// App.tsx is a pure bootloader
export default function App() {
  return (
    <>
      {/* 
        The scroll track sets the document height to allow scrolling.
        We use 500vh to give a long, continuous scroll distance.
      */}
      <div id="cinematic-scroll-track" className="relative w-full h-[500vh]" />
      <RenderLayer />
    </>
  );
}