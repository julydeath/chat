"use client";

import { usePathname, useRouter } from "next/navigation";

const Tabs = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Public Chat", path: "/connect/global" },
    { name: "Chat Rooms", path: "/connect/room" },
    { name: "Video Call", path: "/connect/video" },
  ];

  const activeTab = tabs.find((tab) => pathname.includes(tab.path))?.path || tabs[0].path;

  return (
    <div role="tablist" className="tabs tabs-lifted">
      {tabs.map((tab) => (
        <a
          key={tab.path}
          role="tab"
          className={`tab ${activeTab === tab.path ? "tab-active" : ""}`}
          onClick={() => router.push(tab.path)}
        >
          {tab.name}
        </a>
      ))}
    </div>
  );
};

export default Tabs;
