export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="grid min-h-screen place-items-center p-6">{children}</main>;
}
