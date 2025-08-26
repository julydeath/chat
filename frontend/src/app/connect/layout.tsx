"use client";
import { usePathname } from "next/navigation";
import Tabs from "../components/Tabs";

export default function ConnectLayout({
  room,
  global,
  video,
}: {
  room: React.ReactNode;
  global: React.ReactNode;
  video: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="h-screen flex flex-col p-4 bg-gray-900">
      <Tabs />
      <div className="flex-1 mt-4">
        {pathname.includes("/connect/global") && global}
        {pathname.includes("/connect/room") && room}
        {pathname.includes("/connect/video") && video}
      </div>
    </div>
  );
}
