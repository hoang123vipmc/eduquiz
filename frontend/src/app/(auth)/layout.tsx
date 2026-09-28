import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Cột trái: Hình ảnh/Branding */}
      <div className="relative hidden md:flex w-1/2 flex-col items-center justify-center bg-muted p-12 border-r border-border">
        
        {/* Floating Quiz Cards Illustration */}
        <div className="relative w-full max-w-md h-64 mb-12 flex items-center justify-center">
          {/* Card 1 */}
          <div className="absolute z-10 w-64 h-32 bg-card border border-border rounded-lg p-5 shadow-sm">
            <div className="w-1/3 h-3 bg-muted-foreground/30 rounded-full mb-4"></div>
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full mb-2"></div>
            <div className="w-5/6 h-2 bg-muted-foreground/20 rounded-full mb-4"></div>
            <div className="flex gap-2 mt-auto">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/50"></div>
              <div className="w-6 h-6 rounded-full bg-muted-foreground/20"></div>
              <div className="w-6 h-6 rounded-full bg-muted-foreground/20"></div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="absolute z-20 w-72 h-36 bg-card border border-primary/20 rounded-lg p-6 shadow-sm translate-x-12 translate-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-1/4 h-3 bg-primary/50 rounded-full"></div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="w-full h-2 bg-muted-foreground/20 rounded-full mb-2"></div>
            <div className="w-4/5 h-2 bg-muted-foreground/20 rounded-full mb-6"></div>
            <div className="w-full h-10 bg-primary rounded-md flex items-center justify-center">
              <div className="w-1/3 h-2 bg-primary-foreground/30 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Typography */}
        <div className="relative z-10 text-center max-w-md mt-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-md flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground tracking-tighter">EQ</span>
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
        {children}
      </div>
    </div>
  );
}
