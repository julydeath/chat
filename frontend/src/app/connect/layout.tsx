export default function ConnectLayout({
  children,
  room,
  global,
}: {
  children: React.ReactNode;
  room: React.ReactNode;
  global: React.ReactNode;
}) {
  return (
    <div className="h-screen grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="col-span-2 h-full">{children}</div>
      <div className="h-full">{room}</div>
      <div className="h-full">{global}</div>
      <div className="col-span-2">dbvb</div>
    </div>
  );
}
