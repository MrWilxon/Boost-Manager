import React from 'react';

export const SettingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-surface text-muted font-sans" suppressHydrationWarning>
      <main className="max-w-4xl mx-auto px-4 md:px-8 pb-24 pt-24 lg:pt-8" suppressHydrationWarning>
        
        {/* Header */}
        <div className="nm-flat rounded-3xl p-6 md:p-8 mb-8 border border-white/5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl animate-shimmer shrink-0"></div>
          <div className="space-y-3 w-full max-w-sm">
            <div className="h-8 w-48 rounded-lg animate-shimmer"></div>
            <div className="h-4 w-64 rounded-md animate-shimmer"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="nm-flat rounded-3xl p-6 border border-white/5 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full animate-shimmer mb-4"></div>
              <div className="h-6 w-24 rounded-md animate-shimmer mb-2"></div>
              <div className="h-4 w-16 rounded-md animate-shimmer"></div>
            </div>
          </div>

          {/* Forms Section */}
          <div className="md:col-span-2 space-y-8">
            {/* Form 1 */}
            <div className="nm-flat rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="h-6 w-40 rounded-md animate-shimmer mb-6"></div>
              
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-sm animate-shimmer"></div>
                <div className="h-12 w-full rounded-xl animate-shimmer"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-3 w-32 rounded-sm animate-shimmer"></div>
                <div className="h-12 w-full rounded-xl animate-shimmer"></div>
              </div>

              <div className="h-14 w-full rounded-xl animate-shimmer mt-6"></div>
            </div>

            {/* Form 2 */}
            <div className="nm-flat rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
              <div className="h-6 w-32 rounded-md animate-shimmer mb-6"></div>
              
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-sm animate-shimmer"></div>
                <div className="h-12 w-full rounded-xl animate-shimmer"></div>
              </div>

              <div className="h-14 w-full rounded-xl animate-shimmer mt-6"></div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
