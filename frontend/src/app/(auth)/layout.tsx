import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-slate-100">
      {/* Cột trái: Hình ảnh/Branding */}
      <div className="relative hidden md:flex w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#071026] via-[#0f172a] to-[#071026] p-12 overflow-hidden border-r border-border">
        
        {/* Glowing dots & Ambient background */}
        <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-blue-400 blur-[1px] animate-pulse"></div>
        <div className="absolute bottom-[30%] right-[25%] w-3 h-3 rounded-full bg-indigo-500 blur-[2px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[60%] left-[15%] w-1.5 h-1.5 rounded-full bg-emerald-400 blur-[1px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Soft gradient orb - Optimized for GPU */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)' }}></div>

        {/* Geometric Background Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 border border-border rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 border border-border rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] border border-blue-500/5 rounded-full animate-spin-slow pointer-events-none border-dashed"></div>

        {/* Floating Quiz Cards Illustration */}
        <div className="relative w-full max-w-md h-64 mb-12 flex items-center justify-center">
          {/* Card 1 */}
          <div className="absolute z-10 w-64 h-32 bg-card border border-border rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-float">
            <div className="w-1/3 h-3 bg-slate-700 rounded-full mb-4"></div>
            <div className="w-full h-2 bg-slate-800 rounded-full mb-2"></div>
            <div className="w-5/6 h-2 bg-slate-800 rounded-full mb-4"></div>
            <div className="flex gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50"></div>
              <div className="w-6 h-6 rounded-full bg-slate-800"></div>
              <div className="w-6 h-6 rounded-full bg-slate-800"></div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="absolute z-20 w-72 h-36 bg-muted border border-blue-500/20 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-float-reverse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-1/4 h-3 bg-blue-500/50 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full mb-2"></div>
            <div className="w-4/5 h-2 bg-slate-700 rounded-full mb-6"></div>
            <div className="w-full h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <div className="w-1/3 h-2 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Typography */}
        <div className="relative z-10 text-center max-w-md mt-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl font-bold text-foreground tracking-tighter">EQ</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">EduQuiz</h1>
          <p className="text-base text-muted-foreground font-normal leading-relaxed">
            Learn smarter. Practice faster. Achieve more.
          </p>
        </div>
      </div>

      {/* Cột phải: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/5 via-[#020617] to-[#020617] pointer-events-none"></div>
        {children}
      </div>
    </div>
  );
}
