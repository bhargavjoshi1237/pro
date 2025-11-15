import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ActiveUsers({ activeSessions, currentSnippetId }) {
  // Filter users editing the current snippet
  const activeInSnippet = activeSessions.filter(
    (session) => session.snippet_id === currentSnippetId
  );

  // Users in workspace but not in current snippet
  const activeInWorkspace = activeSessions.filter(
    (session) => !session.snippet_id || session.snippet_id !== currentSnippetId
  );

  const getInitials = (email, displayName) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (activeSessions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Users editing current snippet */}
      {activeInSnippet.length > 0 && (
        <div className="flex items-center -space-x-1.5">
          <TooltipProvider>
            {activeInSnippet.slice(0, 3).map((session) => (
              <Tooltip key={session.id}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar 
                      className="w-7 h-7 ring-2 ring-white dark:ring-[#212121]"
                      style={{ 
                        ringColor: session.color,
                      }}
                    >
                      {session.profiles?.avatar_url ? (
                        <img
                          src={session.profiles.avatar_url}
                          alt={session.profiles.display_name || session.profiles.email}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback
                          className="text-white text-xs font-semibold"
                          style={{ backgroundColor: session.color }}
                        >
                          {getInitials(session.profiles?.email, session.profiles?.display_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {/* Active indicator */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-[#212121]"
                      style={{ backgroundColor: session.color }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">
                    {session.profiles?.display_name || session.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">Editing this snippet</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {activeInSnippet.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-[#2a2a2a] ring-2 ring-white dark:ring-[#212121] flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                      +{activeInSnippet.length - 3}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {activeInSnippet.slice(3).map((session) => (
                      <p key={session.id} className="text-xs">
                        {session.profiles?.display_name || session.profiles?.email}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}

      {/* Separator if both groups exist */}
      {activeInSnippet.length > 0 && activeInWorkspace.length > 0 && (
        <div className="w-px h-6 bg-gray-300 dark:bg-[#2a2a2a]" />
      )}

      {/* Users in workspace but not editing current snippet */}
      {activeInWorkspace.length > 0 && (
        <div className="flex items-center -space-x-2">
          <TooltipProvider>
            {activeInWorkspace.slice(0, 3).map((session) => (
              <Tooltip key={session.id}>
                <TooltipTrigger asChild>
                  <Avatar className="w-7 h-7 border-2 border-white dark:border-[#212121] opacity-60">
                    {session.profiles?.avatar_url ? (
                      <img
                        src={session.profiles.avatar_url}
                        alt={session.profiles.display_name || session.profiles.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gray-400 text-white text-xs font-semibold">
                        {getInitials(session.profiles?.email, session.profiles?.display_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">
                    {session.profiles?.display_name || session.profiles?.email}
                  </p>
                  <p className="text-xs text-gray-400">In workspace</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {activeInWorkspace.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-[#2a2a2a] border-2 border-white dark:border-[#212121] flex items-center justify-center opacity-60">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      +{activeInWorkspace.length - 3}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activeInWorkspace.slice(3).map((session) => (
                      <p key={session.id} className="text-xs">
                        {session.profiles?.display_name || session.profiles?.email}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
