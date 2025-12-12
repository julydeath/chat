export default function ConnectLayout({
  children,
  room,
  global,
  video,
}: {
  children: React.ReactNode;
  room: React.ReactNode;
  global: React.ReactNode;
  video: React.ReactNode;
}) {
  return (
    <div className="h-screen grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="col-span-2 h-full">{children}</div>
      <div className="">{room}</div>
      <div className="">{global}</div>
      <div className="col-span-2">{video}</div>
    </div>
  );
}
