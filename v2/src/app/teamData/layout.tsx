"use client";

import NavbarTeam from "./NavbarTeam/page";
import React from "react";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarTeam />
      {children}
    </>
  );
}
