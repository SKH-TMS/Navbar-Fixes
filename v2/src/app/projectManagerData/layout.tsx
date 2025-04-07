"use client";

import NavbarUser from "../userData/NavbarUser/page";
import React from "react";

export default function ProjectManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarUser />
      {children}
    </>
  );
}
