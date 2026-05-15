export const metadata = {
  title: "YTAUTO — YouTube Channel Manager",
  description: "AI Tools YouTube channel: script, voice, upload",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#07090f" }}>
        {children}
      </body>
    </html>
  );
}
