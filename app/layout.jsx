import "./globals.css";

export const metadata = {
  title: "Woodpecker — Business Intelligence Workspace",
  description: "Business research, strategy and planning in one workspace.",
};

const initTheme = `
(function () {
  try {
    var preference = localStorage.getItem("wp-theme");
    var mode = preference === "dark" || preference === "light" ? preference : "light";
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode;
  } catch (_) {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initTheme }} /></head>
      <body className="min-h-screen bg-[#F7F5F0] font-sans text-stone-900 antialiased dark:bg-[#171716] dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
